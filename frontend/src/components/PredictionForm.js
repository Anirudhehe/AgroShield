import React, { useState, useEffect } from "react";
import axios from "axios";

// NOTE: This URL must be updated once deployed (e.g., on Render)
const API_URL = "http://127.0.0.1:5000/predict";

function PredictionForm() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [diseaseInfo, setDiseaseInfo] = useState({});

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResult(null); // Clear previous result
      setError(null);
      // Create a URL for image preview
      setImagePreview(URL.createObjectURL(uploadedFile));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setLoadingMessage("Analyzing image...");
    setResult(null);
    setError(null);

    // Simulate loading message updates
    const messages = [
      "Analyzing image...",
      "Detecting disease patterns...",
      "Scanning leaves...",
      "Calculating confidence...",
      "Preparing recommendations...",
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 800);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(msgInterval);

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(
          response.data.error || "Prediction failed with unknown server error."
        );
      }
    } catch (err) {
      clearInterval(msgInterval);
      console.error("API Call Error:", err);
      setError("Could not connect to the API. Check the server status.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch disease descriptions JSON from public folder
  useEffect(() => {
    let mounted = true;
    fetch("/disease_descriptions.json")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setDiseaseInfo(data);
      })
      .catch((err) => {
        console.warn("Could not load disease descriptions:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const getDescriptionFor = (label) => {
    if (!label) return null;
    return diseaseInfo[label] || diseaseInfo["default"] || null;
  };

  // Basic sanitizer: escape HTML, remove simple markdown bold/italic markers, preserve newlines
  const escapeHtml = (unsafe) => {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const renderSuggestionHtml = (text) => {
    if (!text) return "";
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.*?)\*\*/g, "$1");
    out = out.replace(/\*(.*?)\*/g, "$1");
    out = out.replace(/\r\n|\r|\n/g, "<br/>\n");
    return out;
  };

  // Helper: get disease severity based on name
  const getSeverity = (diseaseName) => {
    if (!diseaseName)
      return { level: "unknown", color: "#999999", label: "Unknown" };
    const name = diseaseName.toLowerCase();
    if (name.includes("healthy")) {
      return { level: "healthy", color: "#4CAF50", label: "🟢 Healthy" };
    } else if (
      name.includes("blight") ||
      name.includes("late") ||
      name.includes("rust") ||
      name.includes("virus")
    ) {
      return { level: "severe", color: "#D32F2F", label: "🔴 Severe" };
    } else if (name.includes("spot") || name.includes("scab")) {
      return { level: "moderate", color: "#FF9800", label: "🟠 Moderate" };
    } else {
      return { level: "mild", color: "#FFC107", label: "🟡 Mild" };
    }
  };

  // Helper: copy to clipboard
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} suggestion copied to clipboard!`);
  };

  // Helper: reset form
  const handleTryAgain = () => {
    setFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setLoadingMessage("Initializing...");
  };

  return (
    <div className="container">
      <h1>AgroShield</h1>

      <div className="main-content">
        {/* LEFT PANEL: Upload & Image Preview */}
        <div className="left-panel">
          {/* File Upload Form */}
          <form onSubmit={handleSubmit} className="form-upload">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              id="file-upload"
              disabled={loading}
            />
            <label htmlFor="file-upload">
              Drag & drop an image here, or click to select
            </label>

            <button
              type="submit"
              disabled={!file || loading}
              className="btn-predict"
            >
              {loading ? "Analyzing..." : "Analyze Image"}
            </button>
          </form>

          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview">
              <h2>Preview</h2>
              <div style={{ textAlign: "center" }}>
                <div
                  className="image-card"
                  style={{ display: "inline-block", width: "100%" }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "400px",
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Results Display */}
        <div className="right-panel">
          {/* Error Message */}
          {error && <div className="error-message">Error: {error}</div>}

          {/* Results Display */}
          {result && (
            <div className="results">
              {/* Severity Badge */}
              <div className="result-header">
                <div
                  className="severity-badge"
                  style={{
                    backgroundColor: getSeverity(result.prediction).color,
                  }}
                >
                  {getSeverity(result.prediction).label}
                </div>
              </div>

              <h2>{result.prediction}</h2>

              {/* Description fetched from JSON */}
              <div style={{ marginTop: 0 }}>
                {(() => {
                  const info = getDescriptionFor(result.prediction);
                  if (!info)
                    return (
                      <p style={{ color: "#777" }}>
                        No description available for this disease.
                      </p>
                    );
                  return (
                    <div className="disease-description">
                      <strong>{info.title}</strong>
                      <p>{info.description}</p>
                    </div>
                  );
                })()}
              </div>

              <div className="suggestion-box">
                <h3>Treatment Suggestions</h3>

                <div className="suggestion-cards">
                  {/* Single card containing both suggestions stacked */}
                  <div className="suggestion-card">
                    <div className="suggestion-entry suggestion-entry--chemical">
                      <h4>🧪 Chemical/Synthetic</h4>
                      <div
                        className="suggestion-text"
                        dangerouslySetInnerHTML={{
                          __html: renderSuggestionHtml(result.suggestion),
                        }}
                      />
                      <button
                        className="copy-btn"
                        onClick={() =>
                          copyToClipboard(result.suggestion, "Chemical")
                        }
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>

                    <hr className="suggestion-separator" />

                    <div className="suggestion-entry suggestion-entry--organic">
                      <h4>🌿 Organic Alternative</h4>
                      <div
                        className="suggestion-text"
                        dangerouslySetInnerHTML={{
                          __html: renderSuggestionHtml(
                            result.organic_suggestion
                          ),
                        }}
                      />
                      <button
                        className="copy-btn"
                        onClick={() =>
                          copyToClipboard(result.organic_suggestion, "Organic")
                        }
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-try-again" onClick={handleTryAgain}>
                  🔄 Analyze Another Image
                </button>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p className="loading-message">{loadingMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictionForm;
