using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace ClassicRPG
{
    [Serializable]
    public enum QuestState
    {
        NotStarted,
        InProgress,
        Completed,
        Failed
    }

    [Serializable]
    public class QuestRecord
    {
        public string questId;
        public string questTitle;
        public string associatedNpcTag; // e.g. "Banker", "Lawyer", "Doctor"
        public QuestState state = QuestState.NotStarted;
        public int currentStep = 0;
        public int totalSteps = 3;
        public string[] milestoneDescriptions;
        public string targetDataset;
        public bool isMilestoneFlagged = false;
    }

    /// <summary>
    /// ClassicRPG Quest Tracker and Progression Manager for Data City.
    /// Manages storyline investigation stages, dataset targets, and milestone flags.
    /// Fully single-threaded and WebGL compatible.
    /// </summary>
    public class RPGQuestManager : MonoBehaviour
    {
        public static RPGQuestManager Instance { get; private set; }

        [Header("Quests Database")]
        [SerializeField] private List<QuestRecord> activeQuests = new List<QuestRecord>();

        [Header("Events")]
        public UnityEvent<QuestRecord> onQuestUpdated;
        public UnityEvent<string, int> onMilestoneAdvanced;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeDefaultQuests();
        }

        private void InitializeDefaultQuests()
        {
            if (activeQuests.Count > 0) return;

            // Quest 1: Meridian Capital Bank Anomaly (Banker)
            activeQuests.Add(new QuestRecord
            {
                questId = "banker_audit_01",
                questTitle = "The Meridian Vault Discrepancy",
                associatedNpcTag = "Banker",
                state = QuestState.InProgress,
                currentStep = 0,
                totalSteps = 3,
                milestoneDescriptions = new string[]
                {
                    "Interview Chief Auditor Julian Sterling at Meridian Financial Tower.",
                    "Analyze ledger transaction anomaly on the Data Tablet (SQL filter > $50,000).",
                    "Return findings to Julian Sterling to complete financial clearance."
                },
                targetDataset = "datasets/bank_transactions.csv"
            });

            // Quest 2: Municipal Court Antitrust (Lawyer)
            activeQuests.Add(new QuestRecord
            {
                questId = "lawyer_antitrust_02",
                questTitle = "The Sovereign Corporate Merger",
                associatedNpcTag = "Lawyer",
                state = QuestState.NotStarted,
                currentStep = 0,
                totalSteps = 3,
                milestoneDescriptions = new string[]
                {
                    "Consult Attorney Claire Vance at the High Court.",
                    "Examine market monopoly concentration metrics (HHI > 2500).",
                    "Present statutory evidence to the magistrate."
                },
                targetDataset = "datasets/court_records.csv"
            });

            // Quest 3: Metro Health Epidemic Outlier (Doctor)
            activeQuests.Add(new QuestRecord
            {
                questId = "doctor_outlier_03",
                questTitle = "The St. Jude Ward Anomaly",
                associatedNpcTag = "Doctor",
                state = QuestState.NotStarted,
                currentStep = 0,
                totalSteps = 3,
                milestoneDescriptions = new string[]
                {
                    "Speak with Dr. Marcus Reid at Central Hospital.",
                    "Identify respiratory triage cluster anomalies across district zip codes.",
                    "Authorize emergency serum allocation based on statistical variance."
                },
                targetDataset = "datasets/patient_vitals.csv"
            });
        }

        /// <summary>
        /// Retrieves the active quest state for an NPC tag (e.g. Banker, Lawyer, Doctor).
        /// </summary>
        public QuestRecord GetActiveQuestForNpc(string npcTag)
        {
            return activeQuests.Find(q => q.associatedNpcTag.Equals(npcTag, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Retrieves a quest record by ID.
        /// </summary>
        public QuestRecord GetQuest(string questId)
        {
            return activeQuests.Find(q => q.questId.Equals(questId, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Flags a milestone step as complete and advances the quest progress tracker.
        /// </summary>
        public bool FlagMilestoneStep(string taskIdOrQuestId)
        {
            QuestRecord quest = activeQuests.Find(q => 
                q.questId.Equals(taskIdOrQuestId, StringComparison.OrdinalIgnoreCase) ||
                q.targetDataset.Contains(taskIdOrQuestId));

            if (quest == null && activeQuests.Count > 0)
            {
                // Fallback: match by active in-progress quest
                quest = activeQuests.Find(q => q.state == QuestState.InProgress);
            }

            if (quest != null)
            {
                quest.isMilestoneFlagged = true;
                quest.currentStep = Mathf.Min(quest.currentStep + 1, quest.totalSteps);
                if (quest.currentStep >= quest.totalSteps)
                {
                    quest.state = QuestState.Completed;
                }
                else
                {
                    quest.state = QuestState.InProgress;
                }

                Debug.Log($"[ClassicRPG QuestTracker] Quest '{quest.questTitle}' advanced to Step {quest.currentStep}/{quest.totalSteps}. State: {quest.state}");
                onQuestUpdated?.Invoke(quest);
                onMilestoneAdvanced?.Invoke(quest.questId, quest.currentStep);
                return true;
            }

            Debug.LogWarning($"[ClassicRPG QuestTracker] No active quest found matching target identifier: {taskIdOrQuestId}");
            return false;
        }

        /// <summary>
        /// Formats active quests summary for HUD display.
        /// </summary>
        public string GetQuestSummary(string questId)
        {
            var q = GetQuest(questId);
            if (q == null) return "No active objectives.";
            string stepText = q.currentStep < q.milestoneDescriptions.Length ? q.milestoneDescriptions[q.currentStep] : "Objective Complete";
            return $"[{q.questTitle}] Step {q.currentStep + 1}/{q.totalSteps}: {stepText}";
        }
    }
}
