import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  cacheDiseaseDescription,
  getCachedDiseaseDescription,
} from "../utils/i18nCache";
import i18n from "../i18n";

// For number formatting
const formatUnit = (value, unit, locale = "en") => {
  if (typeof value === "number") {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(value)} ${unit}`;
  }
  return `${value} ${unit}`;
};

// NOTE: This URL must be updated once deployed (e.g., on Render)
const API_URL = "http://127.0.0.1:5000/predict";

function PredictionForm() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [diseaseInfo, setDiseaseInfo] = useState({});
  const [localizedDesc, setLocalizedDesc] = useState(null);
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState(null);

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

  // Helper to load localized disease description (from IDB or network)
  const getDiseaseDescription = useCallback(async (diseaseId, lng) => {
    if (!diseaseId || !lng) return null;
    setDescLoading(true);
    setDescError(null);
    setLocalizedDesc(null);
    try {
      // Try IndexedDB first
      let desc = await getCachedDiseaseDescription(lng, diseaseId);
      if (!desc) {
        // Fallback to fetch (URL-encode filename to handle spaces and special chars)
        const encodedId = encodeURIComponent(diseaseId);
        const res = await fetch(
          `/locales/${lng}/disease_descriptions/${encodedId}.json`,
          { cache: "force-cache" }
        );
        if (!res.ok) throw new Error("Not found");
        desc = await res.json();
        await cacheDiseaseDescription(lng, diseaseId, desc);
      }
      setLocalizedDesc(desc);
    } catch (e) {
      console.error(`Failed to load disease description for ${diseaseId}:`, e);
      setDescError(e.message || "Failed to load description");
      setLocalizedDesc(null);
    } finally {
      setDescLoading(false);
    }
  }, []);

  // When result or language changes, load localized description
  useEffect(() => {
    if (result && result.disease_id && i18n.language) {
      getDiseaseDescription(result.disease_id, i18n.language.split("-")[0]);
    } else {
      setLocalizedDesc(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, i18n.language]);

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1>{t("app_title")}</h1>
        <LanguageSwitcher />
      </div>

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
              {t(
                "choose_image",
                "Drag & drop an image here, or click to select"
              )}
            </label>

            <button
              type="submit"
              disabled={!file || loading}
              className="btn-predict"
            >
              {loading ? t("analyze_image") + "..." : t("analyze_image")}
            </button>
          </form>

          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview">
              <h2>{t("uploaded_photo", "Preview")}</h2>
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
          {error && (
            <div className="error-message">
              {t("error", "Error")}: {error}
            </div>
          )}

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

              {/* Localized Description and Suggestions */}
              <div style={{ marginTop: 0 }}>
                {descLoading && (
                  <p style={{ color: "#777" }}>{t("loading", "Loading...")}</p>
                )}
                {descError && (
                  <p style={{ color: "#d32f2f" }}>
                    {t(
                      "no_description",
                      "No description available for this disease."
                    )}
                  </p>
                )}
                {localizedDesc && (
                  <div className="disease-description">
                    <strong>{localizedDesc.title}</strong>
                    <p>{localizedDesc.description}</p>
                    {/* Safety badge for unverified translations */}
                    {localizedDesc.human_verified === false && (
                      <span
                        className="verify-badge"
                        style={{
                          color: "#d32f2f",
                          fontWeight: 600,
                          display: "inline-block",
                          marginTop: 4,
                        }}
                      >
                        {t("verify_badge")}
                      </span>
                    )}
                  </div>
                )}
                {!descLoading && !descError && !localizedDesc && (
                  <p style={{ color: "#777" }}>
                    {t(
                      "no_description",
                      "No description available for this disease."
                    )}
                  </p>
                )}
              </div>

              <div className="suggestion-box">
                <h3>{t("treatment_suggestions")}</h3>

                <div className="suggestion-cards">
                  {/* Single card containing both suggestions stacked */}
                  <div className="suggestion-card">
                    <div className="suggestion-entry suggestion-entry--chemical">
                      <h4>🧪 {t("chemical")}</h4>
                      <div
                        className="suggestion-text"
                        dangerouslySetInnerHTML={{
                          __html: renderSuggestionHtml(
                            (localizedDesc &&
                              localizedDesc.treatment &&
                              localizedDesc.treatment.chemical) ||
                              result.suggestion
                          ),
                        }}
                      />
                      <button
                        className="copy-btn"
                        onClick={() =>
                          copyToClipboard(
                            (localizedDesc &&
                              localizedDesc.treatment &&
                              localizedDesc.treatment.chemical) ||
                              result.suggestion,
                            t("chemical")
                          )
                        }
                        title={t("copy")}
                      >
                        📋 {t("copy")}
                      </button>
                    </div>

                    <hr className="suggestion-separator" />

                    <div className="suggestion-entry suggestion-entry--organic">
                      <h4>🌿 {t("organic")}</h4>
                      <div
                        className="suggestion-text"
                        dangerouslySetInnerHTML={{
                          __html: renderSuggestionHtml(
                            (localizedDesc &&
                              localizedDesc.treatment &&
                              localizedDesc.treatment.organic) ||
                              result.organic_suggestion
                          ),
                        }}
                      />
                      <button
                        className="copy-btn"
                        onClick={() =>
                          copyToClipboard(
                            (localizedDesc &&
                              localizedDesc.treatment &&
                              localizedDesc.treatment.organic) ||
                              result.organic_suggestion,
                            t("organic")
                          )
                        }
                        title={t("copy")}
                      >
                        📋 {t("copy")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-try-again" onClick={handleTryAgain}>
                  🔄 {t("analyze_another")}
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
