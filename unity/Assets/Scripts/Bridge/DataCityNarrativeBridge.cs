using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Events;
using Yarn.Unity;
using SanAndreasUnity.Behaviours;
using SanAndreasUnity.Behaviours.Vehicles;

namespace DataCity.Integration
{
    /// <summary>
    /// Production-grade C# Bridge coupling SanAndreasUnity physics/player controls
    /// with YarnSpinner dialogue runner and the Data Tablet WebGL analytical interface.
    /// </summary>
    [RequireComponent(typeof(DialogueRunner))]
    public class DataCityNarrativeBridge : MonoBehaviour
    {
        [Header("SanAndreasUnity Player References")]
        [Tooltip("Direct reference to the active SanAndreasUnity PlayerController.")]
        [SerializeField] private PlayerController playerController;

        [Tooltip("Direct reference to the player's Pedestrian model and animation controller.")]
        [SerializeField] private Pedestrian playerPedestrian;

        [Header("YarnSpinner References")]
        [Tooltip("The YarnSpinner DialogueRunner managing narrative execution.")]
        [SerializeField] private DialogueRunner dialogueRunner;

        [Header("Data Tablet Interface")]
        [Tooltip("The UI Data Tablet controller responsible for CSV/API parsing and SQL queries.")]
        [SerializeField] private DataTabletUI dataTabletUI;

        [Header("Bridge Events")]
        public UnityEvent onDialogueStarted;
        public UnityEvent onDialogueEnded;
        public UnityEvent<string, string> onDataTaskTriggered;

        private bool isMovementBlocked = false;
        private Vector3 savedVelocity = Vector3.zero;

        private void Awake()
        {
            if (dialogueRunner == null)
            {
                dialogueRunner = GetComponent<DialogueRunner>();
            }

            // Auto-locate player controller if not bound via inspector
            if (playerController == null)
            {
                playerController = FindObjectOfType<PlayerController>();
            }

            if (playerPedestrian == null && playerController != null)
            {
                playerPedestrian = playerController.GetComponent<Pedestrian>();
            }

            if (dataTabletUI == null)
            {
                dataTabletUI = FindObjectOfType<DataTabletUI>();
            }
        }

        private void OnEnable()
        {
            if (dialogueRunner != null)
            {
                dialogueRunner.onDialogueStart.AddListener(OnDialogueStart);
                dialogueRunner.onDialogueComplete.AddListener(OnDialogueComplete);
            }
        }

        private void OnDisable()
        {
            if (dialogueRunner != null)
            {
                dialogueRunner.onDialogueStart.RemoveListener(OnDialogueStart);
                dialogueRunner.onDialogueComplete.RemoveListener(OnDialogueComplete);
            }
        }

        /// <summary>
        /// Invoked automatically when YarnSpinner begins executing a dialogue node.
        /// Freezes player inputs, zeros velocity, and prevents entering/exiting vehicles.
        /// </summary>
        public void OnDialogueStart()
        {
            BlockPlayerMovement(true);
            onDialogueStarted?.Invoke();
            Debug.Log("[DataCityBridge] Dialogue started. SanAndreasUnity player movement locked.");
        }

        /// <summary>
        /// Invoked automatically when YarnSpinner finishes conversation execution.
        /// Restores player movement inputs and physics raycasting.
        /// </summary>
        public void OnDialogueComplete()
        {
            BlockPlayerMovement(false);
            onDialogueEnded?.Invoke();
            Debug.Log("[DataCityBridge] Dialogue completed. SanAndreasUnity player movement unlocked.");
        }

        /// <summary>
        /// Explicitly disables or enables SanAndreasUnity player controller input,
        /// pedestrian movement, and vehicle interaction.
        /// </summary>
        /// <param name="block">True to freeze player; False to restore control.</param>
        public void BlockPlayerMovement(bool block)
        {
            isMovementBlocked = block;

            if (playerController != null)
            {
                // Disable input polling on the SanAndreasUnity PlayerController
                playerController.enabled = !block;
            }

            if (playerPedestrian != null)
            {
                if (block)
                {
                    // Zero out pedestrian velocity and reset animator walk/run parameters
                    if (playerPedestrian.rigidbody != null)
                    {
                        savedVelocity = playerPedestrian.rigidbody.velocity;
                        playerPedestrian.rigidbody.velocity = Vector3.zero;
                        playerPedestrian.rigidbody.angularVelocity = Vector3.zero;
                    }

                    // Reset movement flags
                    playerPedestrian.IsWalking = false;
                    playerPedestrian.IsRunning = false;
                    playerPedestrian.IsSprinting = false;
                }
                else
                {
                    // Restore physics responsiveness
                    if (playerPedestrian.rigidbody != null && savedVelocity != Vector3.zero)
                    {
                        playerPedestrian.rigidbody.velocity = Vector3.zero;
                    }
                }
            }

            // Lock or unlock cursor based on state
            if (block)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        /// <summary>
        /// YarnCommand hook callable directly from any .yarn narrative script.
        /// Syntax in Yarn: <<trigger_data_task "dataset_path" "mystery_id">>
        /// Example: <<trigger_data_task "datasets/bank_transactions.csv" "banker_discrepancy">>
        /// </summary>
        /// <param name="datasetPath">Relative or remote URL path to the target CSV/JSON dataset.</param>
        /// <param name="taskId">Unique identifier for the analytical objective.</param>
        [YarnCommand("trigger_data_task")]
        public void TriggerDataTask(string datasetPath, string taskId)
        {
            Debug.Log($"[DataCityBridge] YarnCommand trigger_data_task received: Dataset={datasetPath}, TaskId={taskId}");

            // Ensure player remains immobilized while analyzing data
            BlockPlayerMovement(true);

            // Notify tablet UI to wake up and fetch dataset
            if (dataTabletUI != null)
            {
                dataTabletUI.OpenTablet(datasetPath, taskId);
            }
            else
            {
                Debug.LogWarning("[DataCityBridge] DataTabletUI reference missing. Triggering fallback event.");
            }

            onDataTaskTriggered?.Invoke(datasetPath, taskId);
        }

        /// <summary>
        /// Callback for the Data Tablet UI when player finishes analysis and submits findings.
        /// Can resume dialogue or jump to a specific validation node in YarnSpinner.
        /// </summary>
        /// <param name="isSuccess">Whether query satisfied the rubric validation.</param>
        /// <param name="resumeNode">Target Yarn node to evaluate consequences.</param>
        public void OnDataTaskSubmitted(bool isSuccess, string resumeNode = "")
        {
            Debug.Log($"[DataCityBridge] Data task submitted. Result={isSuccess}, NextNode={resumeNode}");

            if (dataTabletUI != null)
            {
                dataTabletUI.CloseTablet();
            }

            if (!string.IsNullOrEmpty(resumeNode) && dialogueRunner != null)
            {
                // Inject analytical result into Yarn variable storage
                dialogueRunner.VariableStorage.SetValue("$data_task_success", isSuccess);
                dialogueRunner.StartDialogue(resumeNode);
            }
            else
            {
                BlockPlayerMovement(false);
            }
        }
    }
}
