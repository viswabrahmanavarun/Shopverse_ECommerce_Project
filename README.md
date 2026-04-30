# ShopifyX eCommerce Platform

ShopifyX is a modern, full-stack eCommerce application built with FastAPI (Python) and React (TypeScript).

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)
Navigate to the backend directory, activate your virtual environment, and start the development server.

```bash
cd backend
# Activate virtual environment
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run the application
uvicorn app.main:app --reload
```
The backend will be available at `http://localhost:8000`. You can visit `http://localhost:8000/docs` for the interactive API documentation.

### 2. Frontend Setup (React + Vite)
Navigate to the frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend
# Install dependencies
npm install
# Run the application
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 🛠️ Tech Stack
- **Backend**: FastAPI, MongoDB (Motor/Beanie), JWT Auth
- **Frontend**: React, TypeScript, Tailwind CSS (v4), Framer Motion, Zustand, React Query
- **Services**: Cloudinary (Image uploads), Razorpay (Payments)

## 🔐 Environment Variables
Ensure you have the following variables configured in your backend `.env` or `app/core/config.py`:
- `MONGODB_URL`
- `JWT_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
