# Deployment Guide (Render)

This guide walks you through deploying AgroShield (Full Stack) on Render.com.

## Prerequisites
1.  Push your latest code to GitHub.

## 1. Backend Deployment (Flask)
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository `AgroShield`.
4.  **Root Directory**: `backend`
5.  **Runtime**: `Python 3`
6.  **Build Command**: `pip install -r requirements.txt`
7.  **Start Command**: `gunicorn app:app`
8.  Click **Create Web Service**.
9.  **Copy the URL** of your deployed backend (e.g., `https://agroshield-backend.onrender.com`).

## 2. Frontend Deployment (React)
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Static Site**.
3.  Connect your GitHub repository `AgroShield`.
4.  **Root Directory**: `frontend`
5.  **Build Command**: `npm install && npm run build`
6.  **Publish Directory**: `build`
7.  **Environment Variables**:
    -   Key: `REACT_APP_API_URL`
    -   Value: `https://agroshield-backend.onrender.com/predict` (Paste your backend URL + `/predict`)
8.  Click **Create Static Site**.

## 3. Verify
open the frontend URL provided by Render. Upload an image and verify it connects to the backend!
