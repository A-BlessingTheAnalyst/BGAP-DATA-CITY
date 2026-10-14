using UnityEngine;
using Yarn.Unity;
using SanAndreasUnity.Behaviours;

namespace DataCity.Integration
{
    /// <summary>
    /// Attach to Bankers, Lawyers, Doctors in the 3D city scene.
    /// Manages proximity trigger zones, interaction prompt display,
    /// and invokes YarnSpinner dialogue nodes.
    /// </summary>
    public class DataNPCController : MonoBehaviour
    {
        [Header("NPC Identity")]
        public string npcName = "Chief Financial Officer Adeleke";
        public string characterRole = "Banker"; // Banker, Lawyer, Doctor

        [Header("Yarn Dialogue Target")]
        [Tooltip("The starting node in the Yarn narrative script for this character.")]
        public string startDialogueNode = "Banker_Intro";

        [Header("Interaction Radius")]
        public float interactionDistance = 3.0f;
        public KeyCode interactKey = KeyCode.E;

        [Header("Visual Feedback")]
        public GameObject interactionPromptUI;

        private Transform playerTransform;
        private DialogueRunner dialogueRunner;
        private bool isPlayerInRange = false;

        private void Start()
        {
            dialogueRunner = FindObjectOfType<DialogueRunner>();
            var player = FindObjectOfType<PlayerController>();
            if (player != null)
            {
                playerTransform = player.transform;
            }

            if (interactionPromptUI != null)
            {
                interactionPromptUI.SetActive(false);
            }
        }

        private void Update()
        {
            if (playerTransform == null) return;

            float distance = Vector3.Distance(transform.position, playerTransform.position);
            bool inRange = distance <= interactionDistance;

            if (inRange != isPlayerInRange)
            {
                isPlayerInRange = inRange;
                if (interactionPromptUI != null)
                {
                    interactionPromptUI.SetActive(isPlayerInRange);
                }
            }

            if (isPlayerInRange && Input.GetKeyDown(interactKey))
            {
                TriggerDialogue();
            }
        }

        public void TriggerDialogue()
        {
            if (dialogueRunner != null && !dialogueRunner.IsDialogueRunning)
            {
                if (interactionPromptUI != null)
                {
                    interactionPromptUI.SetActive(false);
                }

                // Face the player
                Vector3 lookTarget = playerTransform.position;
                lookTarget.y = transform.position.y;
                transform.LookAt(lookTarget);

                dialogueRunner.StartDialogue(startDialogueNode);
            }
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, interactionDistance);
        }
    }
}
