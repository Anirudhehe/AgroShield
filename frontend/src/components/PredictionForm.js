import React, { useState } from 'react';
import axios from 'axios';

// NOTE: This URL must be updated once deployed (e.g., on Render)
const API_URL = 'http://127.0.0.1:5000/predict'; 

function PredictionForm() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setResult(null);
    setError(null);

    const formData = new FormData();
    // 'file' must match the key used in Flask: request.files['file']
    formData.append('file', file); 

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
          setResult(response.data);
      } else {
          // Handles custom errors from Flask, e.g., Model not available (500 error)
          setError(response.data.error || 'Prediction failed with unknown server error.');
      }

    } catch (err) {
      console.error('API Call Error:', err);
      // Handle network errors or non-200 status codes
      setError('Could not connect to the API. Check the server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AgroShield Plant Scanner</h1>
      
      {/* 1. File Upload Form */}
      <form onSubmit={handleSubmit} className="form-upload">
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept="image/*" 
          id="file-upload"
          disabled={loading}
        />
        <label htmlFor="file-upload">Choose Image</label>
        
        <button type="submit" disabled={!file || loading} className="btn-predict">
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>

      {/* 2. Image Preview */}
      {imagePreview && (
        <div className="image-preview">
          <h2>Image to Analyze</h2>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }} />
        </div>
      )}

      {/* 3. Results Display */}
      {error && <div className="error-message">Error: {error}</div>}

      {result && (
        <div className="results">
          <h2>Prediction: {result.prediction}</h2>
          <div className="suggestion-box">
              <h3>Treatment Suggestions:</h3>
              
              {/* Chemical/Synthetic Suggestion */}
              <div className="suggestion-item">
                  <h4>🧪 Chemical/Synthetic</h4>
                  <p>{result.suggestion}</p>
              </div>
              
              {/* Organic Alternative Suggestion */}
              <div className="suggestion-item">
                  <h4>🌿 Organic Alternative (with Proportions)</h4>
                  <p>{result.organic_suggestion}</p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionForm;