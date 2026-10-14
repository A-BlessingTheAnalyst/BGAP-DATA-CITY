using UnityEngine;

namespace DataCity_Core
{
    /// <summary>
    /// Attach to interactive NPCs in Data City.
    /// Tagged as "Banker", "Lawyer", or "Doctor" with trigger colliders.
    /// Manages interaction radius, prompts, and passes interaction requests to DataCityNarrativeBridge.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class DataNPCController : MonoBehaviour
    {
        [Header("NPC Identity")]
        [Tooltip("Classification tag: Banker, Lawyer, or Doctor.")]
        public string npcTag = "Banker";

        [Tooltip("Display name for UI prompts and dialogues.")]
        public string npcName = "Julian Sterling";

        [Tooltip("Role title shown on dialogue banner.")]
        public string roleTitle = "Chief Financial Auditor";

        [Header("YarnSpinner Narrative Node")]
        [Tooltip("The starting story node inside the Yarn script.")]
        public string defaultStoryNode = "Banker_Intro";

        [Header("Interaction Settings")]
        [Tooltip("Key used to initiate conversation when inside trigger zone.")]
        public KeyCode interactionKey = KeyCode.E;

        [Tooltip("Floating UI prompt object or billboard banner.")]
        public GameObject interactionPromptUI;

        private bool playerInRange = false;

        private void Reset()
        {
            var col = GetComponent<Collider>();
            if (col != null)
            {
                col.isTrigger = true;
            }
        }

        private void Start()
        {
            if (interactionPromptUI != null)
            {
                interactionPromptUI.SetActive(false);
            }
        }

        private void Update()
        {
            if (playerInRange && Input.GetKeyDown(interactionKey))
            {
                Interact();
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            // Verify if collider belongs to player (SanAndreasUnity PlayerController or Tag "Player")
            if (other.CompareTag("Player") || other.GetComponentInParent<SanAndreasUnity.Behaviours.PlayerController>() != null)
            {
                playerInRange = true;
                if (interactionPromptUI != null)
                {
                    interactionPromptUI.SetActive(true);
                }
                Debug.Log($"[DataNPC] Player entered interaction zone for NPC '{npcName}' [{npcTag}].");
            }
        }

        private void OnTriggerExit(Collider other)
        {
            if (other.CompareTag("Player") || other.GetComponentInParent<SanAndreasUnity.Behaviours.PlayerController>() != null)
            {
                playerInRange = false;
                if (interactionPromptUI != null)
                {
                    interactionPromptUI.SetActive(false);
                }
                Debug.Log($"[DataNPC] Player left interaction zone for NPC '{npcName}'.");
            }
        }

        /// <summary>
        /// Explicit interaction trigger, called on keypress or trigger entry.
        /// </summary>
        public void Interact()
        {
            if (DataCityNarrativeBridge.Instance != null)
            {
                if (interactionPromptUI != null)
                {
                    interactionPromptUI.SetActive(false);
                }
                DataCityNarrativeBridge.Instance.OnNPCInteracted(this);
            }
            else
            {
                Debug.LogWarning("[DataNPC] DataCityNarrativeBridge instance not found in scene!");
            }
        }
    }
}
