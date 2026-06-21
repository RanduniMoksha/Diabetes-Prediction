import joblib
import numpy as np


model = joblib.load(
    "model/diabetes_model.pkl"
)

scaler = joblib.load(
    "model/scaler.pkl"
)



def predict_diabetes(data):

    values = np.array([
        data.pregnancies,
        data.glucose,
        data.blood_pressure,
        data.skin_thickness,
        data.insulin,
        data.bmi,
        data.diabetes_function,
        data.age
    ]).reshape(1,-1)


    # scale input
    values = scaler.transform(values)


    prediction = model.predict(values)


    probability = model.predict_proba(values)


    confidence = max(probability[0])*100


    if prediction[0] == 1:
        result = "Diabetes Risk"
    else:
        result = "No Diabetes Risk"



    return {

        "result":result,

        "confidence":round(confidence,2)

    }
