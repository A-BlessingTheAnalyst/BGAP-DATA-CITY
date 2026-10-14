using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;
using SanAndreasUnity.Behaviours;
using ClassicRPG;
using Yarn.Unity;
using DataCity.Integration;

namespace DataCity_Core
{
    /// <summary>
    /// Master Engine Bridge for "Data City" (WebGL-compatible 3D Data Analysis Game).
    /// Bridges SanAndreasUnity player physics/input, YarnSpinner branching narrative,
    /// and the ClassicRPG quest milestone evaluation framework.
    /// Strictly single-threaded for WebGL web deployment.
    /// </summary>
    [RequireComponent(typeof(DialogueRunner))]
    public class DataCityNarrativeBridge : MonoBehaviour
    {
        public static DataCityNarrativeBridge Instance { get; private set; }

        [Header("--- SanAndreasUnity Player References ---")]
        [Tooltip("Active SanAndreasUnity PlayerController managing input and camera.")]
        [SerializeField] private PlayerController playerController;

        [Tooltip("Active pedestrian actor with physics and CharacterController.")]
        [SerializeField] private Ped playerPed;

        [Header("--- YarnSpinner Narrative Engine ---")]
        [Tooltip("YarnSpinner DialogueRunner executing the story graphs.")]
        [SerializeField] private DialogueRunner dialogueRunner;

        [Header("--- ClassicRPG Framework References ---")]
        [Tooltip("ClassicRPG Quest Tracker managing story objectives and milestones.")]
        [SerializeField] private RPGQuestManager questManager;

        [Header("--- Data Tablet UI Overlay ---")]
        [Tooltip("Data Tablet UI overlay component for interactive SQL and CSV analysis.")]
        [SerializeField] private DataTabletUI dataTabletUI;

        [Header("--- Bridge Events ---")]
        public UnityEvent<string> onDialogueBegan;
        public UnityEvent onDialogueFinished;
        public UnityEvent<string, string> onDataTaskActivated;
        public UnityEvent<string, int> onQuestMilestoneFlagged;

        private bool isInteracting = false;
        private DataNPCController currentInteractingNPC = null;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            // Auto-resolve components if unassigned in inspector
            if (dialogueRunner == null)
            {
                dialogueRunner = GetComponent<DialogueRunner>();
            }

            if (questManager == null)
            {
                questManager = FindObjectOfType<RPGQuestManager>();
                if (questManager == null)
                {
                    GameObject qmObj = new GameObject("RPGQuestManager");
                    questManager = qmObj.AddComponent<RPGQuestManager>();
                }
            }

            if (dataTabletUI == null)
            {
                dataTabletUI = FindObjectOfType<DataTabletUI>();
            }

            ResolvePlayerReferences();
        }

        private void Start()
        {
            ResolvePlayerReferences();
        }

        private void OnEnable()
        {
            if (dialogueRunner != null)
            {
                dialogueRunner.onDialogueStart.AddListener(OnDialogueStarted);
                dialogueRunner.onDialogueComplete.AddListener(OnDialogueComplete);
            }
        }

        private void OnDisable()
        {
            if (dialogueRunner != null)
            {
                dialogueRunner.onDialogueStart.RemoveListener(OnDialogueStarted);
                dialogueRunner.onDialogueComplete.RemoveListener(OnDialogueComplete);
            }
        }

        private void ResolvePlayerReferences()
        {
            if (playerController == null)
            {
                playerController = FindObjectOfType<PlayerController>();
            }

            if (playerPed == null)
            {
                if (playerController != null)
                {
                    playerPed = playerController.GetComponent<Ped>();
                }
                if (playerPed == null)
                {
                    playerPed = FindObjectOfType<Ped>();
                }
            }
        }

        /// <summary>
        /// Interaction listener triggered when player interfaces with a tagged NPC trigger (Banker, Lawyer, Doctor).
        /// Freezes player inputs, zeros physics velocity, reads active quest state, and starts narrative dialogue.
        /// </summary>
        /// <param name="npc">Interacting NPC controller with tag and assigned story node.</param>
        public void OnNPCInteracted(DataNPCController npc)
        {
            if (npc == null || isInteracting) return;

            currentInteractingNPC = npc;
            isInteracting = true;

            Debug.Log($"[DataCityBridge] Handshake initiated with NPC '{npc.npcName}' [Tag: {npc.npcTag}].");

            // 1. FREEZE SANANDREASUNITY CONTROLS & ZERO VELOCITY
            FreezePlayer(true);

            // 2. READ ACTIVE QUEST STATES FROM RPG QUEST TRACKER
            string storyNodeToRun = npc.defaultStoryNode;

            if (questManager != null)
            {
                QuestRecord quest = questManager.GetActiveQuestForNpc(npc.npcTag);
                if (quest != null)
                {
                    Debug.Log($"[DataCityBridge] Active Quest: '{quest.questTitle}' [State: {quest.state}, Step: {quest.currentStep}].");

                    // Inject quest state into Yarn variable storage
                    if (dialogueRunner != null && dialogueRunner.VariableStorage != null)
                    {
                        dialogueRunner.VariableStorage.SetValue("$active_quest_id", quest.questId);
                        dialogueRunner.VariableStorage.SetValue("$quest_state", quest.state.ToString());
                        dialogueRunner.VariableStorage.SetValue("$quest_step", (float)quest.currentStep);
                        dialogueRunner.VariableStorage.SetValue("$milestone_flagged", quest.isMilestoneFlagged);
                    }

                    // Dynamically route story node based on quest milestone
                    if (quest.state == QuestState.Completed)
                    {
                        storyNodeToRun = $"{npc.npcTag}_Completed";
                    }
                    else if (quest.isMilestoneFlagged && quest.currentStep >= 2)
                    {
                        storyNodeToRun = $"{npc.npcTag}_Debrief";
                    }
                    else if (quest.state == QuestState.InProgress && quest.currentStep > 0)
                    {
                        storyNodeToRun = $"{npc.npcTag}_InProgress";
                    }
                }
            }

            // 3. START YARN NARRATIVE DIALOGUE
            if (dialogueRunner != null)
            {
                // Verify node exists, else fallback to default
                if (dialogueRunner.NodeExists(storyNodeToRun))
                {
                    dialogueRunner.StartDialogue(storyNodeToRun);
                }
                else if (dialogueRunner.NodeExists(npc.defaultStoryNode))
                {
                    dialogueRunner.StartDialogue(npc.defaultStoryNode);
                }
                else
                {
                    Debug.LogWarning($"[DataCityBridge] Story node '{storyNodeToRun}' not found in Yarn project. Opening default conversation.");
                }
            }
            else
            {
                Debug.LogError("[DataCityBridge] YarnSpinner DialogueRunner reference missing!");
                FreezePlayer(false);
            }
        }

        /// <summary>
        /// Freezes or restores SanAndreasUnity player controller input and physics velocity.
        /// </summary>
        public void FreezePlayer(bool freeze)
        {
            ResolvePlayerReferences();

            if (playerController != null)
            {
                playerController.enabled = !freeze;
            }

            if (playerPed != null)
            {
                if (freeze)
                {
                    // Zero pedestrian velocity and movement input
                    playerPed.Movement = Vector3.zero;
                    playerPed.MouseMoveInput = Vector2.zero;
                    playerPed.MouseScrollInput = Vector2.zero;

                    var rb = playerPed.GetComponent<Rigidbody>();
                    if (rb != null)
                    {
                        rb.velocity = Vector3.zero;
                        rb.angularVelocity = Vector3.zero;
                    }

                    if (playerPed.characterController != null)
                    {
                        playerPed.characterController.Move(Vector3.zero);
                    }
                }
            }

            // Manage mouse cursor lock state
            if (freeze)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }

            Debug.Log($"[DataCityBridge] Player physics and input {(freeze ? "FROZEN" : "UNFROZEN")}.");
        }

        private void OnDialogueStarted()
        {
            Debug.Log("[DataCityBridge] Yarn dialogue session active.");
            onDialogueBegan?.Invoke(currentInteractingNPC != null ? currentInteractingNPC.npcName : "NPC");
        }

        /// <summary>
        /// Invoked when YarnSpinner completes narrative dialogue sequence.
        /// Re-enables input polling only if the Data Tablet UI is not currently open.
        /// </summary>
        public void OnDialogueComplete()
        {
            Debug.Log("[DataCityBridge] Yarn dialogue session completed.");
            onDialogueFinished?.Invoke();

            // Re-enable player controls only if data tablet is not keeping player occupied
            bool isTabletActive = dataTabletUI != null && dataTabletUI.gameObject.activeInHierarchy;
            if (!isTabletActive)
            {
                FreezePlayer(false);
                isInteracting = false;
                currentInteractingNPC = null;
            }
        }

        /// <summary>
        /// Custom YarnCommand exposed for narrative scripts.
        /// Yarn script syntax: <<trigger_data_task "datasets/bank_transactions.csv" "banker_audit_01">>
        /// Activates dataTabletUI overlay, flags the milestone step in RPG Quest Tracker.
        /// </summary>
        /// <param name="datasetPath">Target CSV/JSON dataset URL or StreamingAssets path.</param>
        /// <param name="taskId">Associated quest or analytical objective identifier.</param>
        [YarnCommand("trigger_data_task")]
        public void TriggerDataTask(string datasetPath, string taskId = "")
        {
            Debug.Log($"[DataCityBridge] YarnCommand 'trigger_data_task' fired: Dataset='{datasetPath}', TaskId='{taskId}'.");

            // Ensure player remains immobilized during analysis
            FreezePlayer(true);

            // 1. ACTIVATE DATA TABLET UI OVERLAY
            if (dataTabletUI != null)
            {
                dataTabletUI.gameObject.SetActive(true);
                dataTabletUI.OpenTablet(datasetPath, taskId);
            }
            else
            {
                Debug.LogWarning("[DataCityBridge] DataTabletUI overlay GameObject not found!");
            }

            // 2. FLAG TARGET MILESTONE STEP IN CLASSIC RPG QUEST TRACKER
            if (questManager != null)
            {
                string keyToFlag = !string.IsNullOrEmpty(taskId) ? taskId : datasetPath;
                bool flagged = questManager.FlagMilestoneStep(keyToFlag);
                if (flagged)
                {
                    onQuestMilestoneFlagged?.Invoke(keyToFlag, 1);
                }
            }

            onDataTaskActivated?.Invoke(datasetPath, taskId);
        }

        /// <summary>
        /// Callback triggered when player submits query analysis on the Data Tablet.
        /// Evaluates outcome, resumes Yarn dialogue on validation branch, or unlocks controls.
        /// </summary>
        public void OnDataTaskSubmitted(bool isSuccess, string resumeNode = "")
        {
            Debug.Log($"[DataCityBridge] Data task validated. Success: {isSuccess}, Target Branch: '{resumeNode}'.");

            if (dataTabletUI != null)
            {
                dataTabletUI.CloseTablet();
                dataTabletUI.gameObject.SetActive(false);
            }

            if (dialogueRunner != null && !string.IsNullOrEmpty(resumeNode) && dialogueRunner.NodeExists(resumeNode))
            {
                dialogueRunner.VariableStorage?.SetValue("$data_task_success", isSuccess);
                dialogueRunner.StartDialogue(resumeNode);
            }
            else
            {
                FreezePlayer(false);
                isInteracting = false;
                currentInteractingNPC = null;
            }
        }
    }
}
