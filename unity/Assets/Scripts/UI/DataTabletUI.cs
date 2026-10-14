using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace DataCity.Integration
{
    /// <summary>
    /// Manages the in-game Data Tablet UI overlay.
    /// Strictly single-threaded and WebGL-compatible using UnityWebRequest.
    /// </summary>
    public class DataTabletUI : MonoBehaviour
    {
        [Header("Tablet UI Containers")]
        [SerializeField] private GameObject tabletCanvas;
        [SerializeField] private Text titleText;
        [SerializeField] private Text descriptionText;
        [SerializeField] private Text datasetStatsText;
        [SerializeField] private InputField sqlInputField;
        [SerializeField] private Button executeButton;
        [SerializeField] private Button submitButton;
        [SerializeField] private Button closeButton;

        [Header("Table Output Grid")]
        [SerializeField] private Transform tableHeaderContainer;
        [SerializeField] private Transform tableRowContainer;
        [SerializeField] private GameObject cellHeaderPrefab;
        [SerializeField] private GameObject cellRowPrefab;

        private string currentDatasetPath;
        private string currentTaskId;
        private List<string[]> loadedCsvRows = new List<string[]>();

        private void Awake()
        {
            if (tabletCanvas != null) tabletCanvas.SetActive(false);
            if (closeButton != null) closeButton.onClick.AddListener(CloseTablet);
            if (submitButton != null) submitButton.onClick.AddListener(OnSubmitClicked);
        }

        /// <summary>
        /// Opens the tablet, immobilizes player, and fetches dataset via WebGL-compatible UnityWebRequest.
        /// </summary>
        public void OpenTablet(string datasetPath, string taskId)
        {
            currentDatasetPath = datasetPath;
            currentTaskId = taskId;

            if (tabletCanvas != null) tabletCanvas.SetActive(true);
            if (titleText != null) titleText.text = $"DATA TABLET — TASK: {taskId.ToUpper()}";

            StartCoroutine(FetchDatasetRoutine(datasetPath));
        }

        public void CloseTablet()
        {
            if (tabletCanvas != null) tabletCanvas.SetActive(false);
            var bridge = FindObjectOfType<DataCityNarrativeBridge>();
            if (bridge != null)
            {
                bridge.BlockPlayerMovement(false);
            }
        }

        private void OnSubmitClicked()
        {
            // Simple validation: user wrote a query with completed status filter
            string sql = sqlInputField != null ? sqlInputField.text.ToUpper() : "";
            bool isCorrect = sql.Contains("WHERE") && sql.Contains("STATUS = 'COMPLETED'");

            var bridge = FindObjectOfType<DataCityNarrativeBridge>();
            if (bridge != null)
            {
                bridge.OnDataTaskSubmitted(isCorrect, isCorrect ? "Banker_Success" : "Banker_Retry");
            }
        }

        /// <summary>
        /// Single-threaded asynchronous CSV/JSON loader conforming strictly to WebGL browser export.
        /// </summary>
        private IEnumerator FetchDatasetRoutine(string path)
        {
            string url = path.StartsWith("http") ? path : Application.streamingAssetsPath + "/" + path;
            using (UnityWebRequest req = UnityWebRequest.Get(url))
            {
                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[DataTablet] Failed to fetch dataset from {url}: {req.error}");
                    if (datasetStatsText != null) datasetStatsText.text = $"Error loading dataset: {req.error}";
                    yield break;
                }

                string csvData = req.downloadHandler.text;
                ParseAndDisplayCSV(csvData);
            }
        }

        private void ParseAndDisplayCSV(string csvContent)
        {
            loadedCsvRows.Clear();
            string[] lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            if (lines.Length == 0) return;

            string[] headers = lines[0].Split(',');
            for (int i = 1; i < Mathf.Min(lines.Length, 100); i++)
            {
                loadedCsvRows.Add(lines[i].Split(','));
            }

            if (datasetStatsText != null)
            {
                datasetStatsText.text = $"Dataset loaded: {lines.Length - 1} records, {headers.Length} columns.";
            }

            Debug.Log($"[DataTablet] Successfully parsed CSV with {lines.Length} lines.");
        }
    }
}
