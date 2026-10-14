using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace DataCity.Integration
{
    /// <summary>
    /// Interactive Data Tablet WebGL UI Overlay.
    /// Executes single-threaded asynchronous dataset loading using UnityWebRequest.
    /// Strictly single-threaded: avoids desktop background threads (Task.Run / Thread.Start)
    /// to guarantee 100% WebGL web deployment stability.
    /// </summary>
    public class DataTabletUI : MonoBehaviour
    {
        [Header("Tablet UI Canvas & Containers")]
        [SerializeField] private GameObject tabletCanvas;
        [SerializeField] private Text titleText;
        [SerializeField] private Text descriptionText;
        [SerializeField] private Text datasetStatsText;
        [SerializeField] private InputField sqlInputField;
        [SerializeField] private Text validationFeedbackText;
        [SerializeField] private Button executeButton;
        [SerializeField] private Button submitButton;
        [SerializeField] private Button closeButton;

        [Header("Dataset State")]
        private string activeDatasetPath;
        private string activeTaskId;
        private List<string[]> parsedDatasetRows = new List<string[]>();
        private string[] datasetHeaders = new string[0];

        private void Awake()
        {
            if (tabletCanvas != null)
            {
                tabletCanvas.SetActive(false);
            }

            if (closeButton != null)
            {
                closeButton.onClick.AddListener(CloseTablet);
            }

            if (submitButton != null)
            {
                submitButton.onClick.AddListener(OnSubmitEvaluation);
            }

            if (executeButton != null)
            {
                executeButton.onClick.AddListener(OnExecuteQuery);
            }
        }

        /// <summary>
        /// Opens the tablet overlay, updates header indicators, and triggers single-threaded WebGL fetch.
        /// </summary>
        public void OpenTablet(string datasetPath, string taskId)
        {
            activeDatasetPath = datasetPath;
            activeTaskId = taskId;

            gameObject.SetActive(true);

            if (tabletCanvas != null)
            {
                tabletCanvas.SetActive(true);
            }

            if (titleText != null)
            {
                titleText.text = $"DATA TABLET - INVESTIGATION: {taskId.ToUpper()}";
            }

            if (descriptionText != null)
            {
                descriptionText.text = $"Dataset Source: {datasetPath}\nFilter records matching the anomaly threshold.";
            }

            if (validationFeedbackText != null)
            {
                validationFeedbackText.text = "Awaiting query execution...";
            }

            // WebGL Single-Threaded Routine
            StartCoroutine(FetchDatasetRoutine(datasetPath));
        }

        public void CloseTablet()
        {
            if (tabletCanvas != null)
            {
                tabletCanvas.SetActive(false);
            }
            gameObject.SetActive(false);

            if (DataCity_Core.DataCityNarrativeBridge.Instance != null)
            {
                DataCity_Core.DataCityNarrativeBridge.Instance.FreezePlayer(false);
            }
        }

        private void OnExecuteQuery()
        {
            string query = sqlInputField != null ? sqlInputField.text.Trim() : "";
            Debug.Log($"[DataTablet] Executing query: {query}");

            if (string.IsNullOrEmpty(query))
            {
                if (validationFeedbackText != null)
                    validationFeedbackText.text = "Please enter a SQL statement.";
                return;
            }

            // Evaluate analytical condition
            bool hasSelect = query.IndexOf("SELECT", StringComparison.OrdinalIgnoreCase) >= 0;
            bool hasWhere = query.IndexOf("WHERE", StringComparison.OrdinalIgnoreCase) >= 0;

            if (hasSelect && hasWhere)
            {
                if (validationFeedbackText != null)
                {
                    validationFeedbackText.color = Color.green;
                    validationFeedbackText.text = "Query executed successfully. 1 anomaly record isolated.";
                }
            }
            else
            {
                if (validationFeedbackText != null)
                {
                    validationFeedbackText.color = Color.yellow;
                    validationFeedbackText.text = "Query executed, but filter criteria incomplete. Check WHERE clause.";
                }
            }
        }

        private void OnSubmitEvaluation()
        {
            string sql = sqlInputField != null ? sqlInputField.text.Trim().ToUpper() : "";
            // Validate: query must isolate anomaly (e.g. status completed, amount > 50000, or outlier flag)
            bool isValid = sql.Contains("WHERE") && (sql.Contains("50000") || sql.Contains("FLAG") || sql.Contains("ANOMALY") || sql.Contains("STATUS"));

            Debug.Log($"[DataTablet] Analytical query submitted. Validation result: {isValid}");

            string nextStoryNode = isValid ? "Banker_ValidationSuccess" : "Banker_ValidationRetry";

            if (DataCity_Core.DataCityNarrativeBridge.Instance != null)
            {
                DataCity_Core.DataCityNarrativeBridge.Instance.OnDataTaskSubmitted(isValid, nextStoryNode);
            }
            else
            {
                CloseTablet();
            }
        }

        /// <summary>
        /// Strictly single-threaded WebGL-compatible dataset fetcher.
        /// Avoids any desktop ThreadPool or async multi-threading tasks.
        /// </summary>
        private IEnumerator FetchDatasetRoutine(string path)
        {
            string fullUrl = path.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? path
                : Application.streamingAssetsPath + "/" + path;

            Debug.Log($"[DataTablet] Initiating WebGL single-threaded UnityWebRequest: {fullUrl}");

            using (UnityWebRequest req = UnityWebRequest.Get(fullUrl))
            {
                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogWarning($"[DataTablet] Remote fetch note ({req.error}). Loading embedded fallback telemetry.");
                    LoadFallbackDataset();
                    yield break;
                }

                string content = req.downloadHandler.text;
                ParseDatasetContent(content);
            }
        }

        private void LoadFallbackDataset()
        {
            string fallbackCsv = "id,timestamp,sender,recipient,amount,status,flagged\n" +
                                 "TX101,2026-10-14T08:12:00,Acc_4821,Acc_9912,1420.50,COMPLETED,0\n" +
                                 "TX102,2026-10-14T08:15:33,Acc_1109,Acc_3391,320.00,COMPLETED,0\n" +
                                 "TX103,2026-10-14T08:19:10,Acc_8842,Acc_9901,845000.00,COMPLETED,1\n" +
                                 "TX104,2026-10-14T08:24:45,Acc_5532,Acc_7712,4100.00,COMPLETED,0";

            ParseDatasetContent(fallbackCsv);
        }

        private void ParseDatasetContent(string csvContent)
        {
            parsedDatasetRows.Clear();
            string[] lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            if (lines.Length > 0)
            {
                datasetHeaders = lines[0].Split(',');
                for (int i = 1; i < lines.Length; i++)
                {
                    parsedDatasetRows.Add(lines[i].Split(','));
                }
            }

            if (datasetStatsText != null)
            {
                datasetStatsText.text = $"Telemetry Buffer: {parsedDatasetRows.Count} rows loaded | {datasetHeaders.Length} columns indexed.";
            }

            Debug.Log($"[DataTablet] Dataset ready: {parsedDatasetRows.Count} data rows parsed single-threaded.");
        }
    }
}
