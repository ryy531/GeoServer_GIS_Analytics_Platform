# MainApi.py - Main application file

# --- Import necessary libraries ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Import the router objects from our new router files
from .routers import analysis, features

# --- Initialize FastAPI app ---
# command activate venv environment :  .\venv\Scripts\activate


# Server start command: python -m uvicorn Scripts.MainApi:app --reload
app = FastAPI()

# --- Database Engine ---
# The database engine is created here and shared with the routers.


# --- CORS Middleware Configuration ---
# This allows the frontend (running on port 5173) to communicate with the backend.
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",  # Common port for VS Code Live Server
    "http://localhost:5173",
    "null",  # Allows requests from local HTML files (file://)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
# This is where we connect the endpoints from our router files to the main app.
app.include_router(features.router)
app.include_router(analysis.router)


# --- Root Endpoint ---
# A simple endpoint to confirm that the API is running.
@app.get("/")
def read_root():
    """A simple root endpoint to confirm the API is running."""
    return {"message": "Welcome to the Geo-Education-Atlas API!"}
