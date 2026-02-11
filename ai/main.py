from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Configure CORS to allow requests from the frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Load(BaseModel):
    origin: str
    destination: str
    weight: float
    miles: float


@app.post("/optimize")
def optimize(load: Load):
    profit = (load.weight * 1.4) - (load.miles * 0.6)
    return {
        "recommended": profit > 500,
        "estimated_profit": round(profit, 2)
    }
