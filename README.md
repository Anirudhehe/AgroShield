## Multilingual (offline) — hi + kn

This project includes an offline-capable multilingual MVP supporting English (embedded), Hindi (`hi`) and Kannada (`kn`). The frontend caches translation bundles and long disease descriptions into IndexedDB for offline use, and a Service Worker pre-caches locale files and manifest.

How it works

- Core UI strings in English are embedded in `src/i18n.js` for immediate render.
- Additional locale bundles are available under `public/locales/{lng}/translation.json` and per-disease description JSON files at `public/locales/{lng}/disease_descriptions/{disease_id}.json`.
- The `locales-manifest.json` (root `public`) is versioned and helps clients determine updated bundles.
- When a user switches language, `src/i18n.js -> loadLocale(lng)` attempts to read the bundle from IndexedDB first, then fetch from network and cache it.
- Per-disease long descriptions are lazy-loaded and cached into IndexedDB by `src/utils/i18nCache.js`.
- The Service Worker `public/sw.js` pre-caches the manifest and core translation files and updates cache in background on network responses.

Backend support

- Flask exposes `/locales-manifest.json` and `/api/disease/<disease_id>?lang=xx` which returns the localized disease JSON when available (falls back to English).

Human verification and safety

- Treatment/dosage fields include a `human_verified` boolean in the JSON. Until `true`, the frontend displays the `⚠️ Verify with agronomist` badge and does NOT auto-publish machine-only translations for treatment/dosage content.

Adding a new language

1. Add `public/locales/{new_lng}/translation.json` (UI strings) and `public/locales/{new_lng}/disease_descriptions/*.json` (per-disease long text).
2. Update `public/locales-manifest.json` with new entry and bump version.
3. Optionally add language to `src/components/LanguageSwitcher.js`.

Tests

- Unit tests in `frontend/src/__tests__/i18n.test.js` validate IndexedDB caching helpers.
- E2E tests should simulate the following:
  - Load online, switch to `hi`, confirm strings and disease description are cached.
  - Go offline and verify `hi` UI and disease description still shown.

Security note

- Always show `verify_badge` for any treatment/dosage that is not `human_verified: true`.

# AgroShield

AgroShield is a full-stack application designed to assist in crop disease prediction and management. It leverages machine learning and a user-friendly interface to help farmers and agricultural professionals identify crop diseases and take preventive actions.

## Features

- **Crop Disease Prediction:** Upload images of crops to get instant disease predictions using a trained ResNet model.
- **Modern Frontend:** React-based frontend for seamless user experience.
- **RESTful Backend:** Python Flask backend serving the ML model and handling API requests.
- **Easy Deployment:** Simple setup for both backend and frontend.

## Project Structure

```
AgroShield/
├── backend/
│   ├── AgroShield_Classes.py
│   ├── app.py
│   ├── requirements.txt
│   └── model/
│       └── best_resnet_model.pth
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       └── components/
│           └── PredictionForm.js
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will typically run on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Usage

- Open the frontend in your browser.
- Upload a crop image using the provided form.
- View the prediction and suggested actions.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.
