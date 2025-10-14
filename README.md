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
