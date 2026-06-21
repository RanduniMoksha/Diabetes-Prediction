from pydantic import BaseModel


class DiabetesInput(BaseModel):

    pregnancies: float
    glucose: float
    blood_pressure: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_function: float
    age: float