from flask import Flask, request, jsonify, send_file, send_from_directory, abort
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
from torchvision.models import resnet18
import torchvision.transforms as transforms
import io
import os
from AgroShield_Classes import CLASSES, FERTILIZER_SUGGESTIONS, ORGANIC_SUGGESTIONS

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION & MODEL LOADING ---

NUM_CLASSES = len(CLASSES)
MODEL_PATH = 'model/best_resnet_model.pth' 
DEVICE = torch.device("cpu") # Render's standard services do not offer GPU

# Define the transformation pipeline (MUST match training transformations)
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def load_model(path, num_classes, device):
    """Recreates the model architecture and loads the state_dict."""
    model = resnet18(weights=None) # Start with uninitialized weights
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    
    # Load state dictionary, mapping it to CPU
    model.load_state_dict(torch.load(path, map_location=device))
    model.to(device)
    model.eval()
    return model

# Load the model once when the application starts
try:
    MODEL = load_model(MODEL_PATH, NUM_CLASSES, DEVICE)
    print("PyTorch Model loaded successfully on CPU.")
except Exception as e:
    print(f"ERROR: Could not load model. Check path and structure. Error: {e}")
    MODEL = None

# --- API ENDPOINT ---
@app.route('/', methods=['GET'])
def home():
    if MODEL:
        return jsonify({
            'status': 'OK',
            'message': 'AgroShield API is running and model is loaded.',
            'model_device': str(DEVICE)
        }), 200
    else:
        return jsonify({
            'status': 'ERROR',
            'message': 'AgroShield API is running, but the model failed to load.',
            'details': 'Check the server console for model loading errors.'
        }), 503

@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL:
        return jsonify({'error': 'Model not available.'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    try:
        # Read image bytes and open with PIL
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Preprocess and prepare tensor
        tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)
        
        # Prediction
        with torch.no_grad():
            outputs = MODEL(tensor)
            _, predicted = torch.max(outputs, 1)
            predicted_class = CLASSES[predicted.item()]
            
        # Get Suggestions
        suggestion = FERTILIZER_SUGGESTIONS.get(predicted_class, "N/A")
        organic_suggestion = ORGANIC_SUGGESTIONS.get(predicted_class, "N/A")

        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'disease_id': predicted_class,
            'suggestion': suggestion,
            'organic_suggestion': organic_suggestion
        })

    except Exception as e:
        # Log the detailed error on the server side
        print(f"Prediction failed with error: {e}") 
        return jsonify({'error': 'Internal server error during prediction.'}), 500


# --- Localization endpoints (serve manifest and localized disease descriptions)
@app.route('/locales-manifest.json', methods=['GET'])
def locales_manifest():
    # Prefer a manifest in a configured static path (frontend/public)
    manifest_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'locales-manifest.json')
    if os.path.exists(manifest_path):
        return send_file(manifest_path, mimetype='application/json')
    return jsonify({'error': 'manifest not found'}), 404


@app.route('/api/disease/<disease_id>', methods=['GET'])
def api_disease(disease_id):
    """Return localized disease payload if available. Query param `lang` optional."""
    lang = request.args.get('lang', 'en')
    # path under frontend/public/locales/{lang}/disease_descriptions/{id}.json
    base = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'locales')
    # sanitize disease_id
    safe_id = disease_id.replace('..', '').replace('/', '')
    file_path = os.path.join(base, lang, 'disease_descriptions', f"{safe_id}.json")
    if not os.path.exists(file_path):
        # fallback to english
        file_path = os.path.join(base, 'en', 'disease_descriptions', f"{safe_id}.json")
        if not os.path.exists(file_path):
            return jsonify({'error': 'disease description not found'}), 404
    try:
        return send_file(file_path, mimetype='application/json')
    except Exception as e:
        print('serve disease file error', e)
        return jsonify({'error': 'failed to read file'}), 500

# --- Start Server ---
# Gunicorn handles the running on Render, but this is for local testing
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)