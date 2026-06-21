from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas.prediction_schema import DiabetesInput
from services.prediction_service import predict_diabetes

app = FastAPI()

# Allow React connection

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():

    return {

        "message":"Diabetes Prediction API"

    }

@app.post("/predict")
def prediction(data:DiabetesInput):


    result = predict_diabetes(data)


    return result
