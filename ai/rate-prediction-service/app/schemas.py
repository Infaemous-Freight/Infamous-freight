from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RatePredictionRequest(BaseModel):
    origin_state: str = Field(..., min_length=2)
    destination_state: str = Field(..., min_length=2)
    distance_miles: float = Field(..., gt=0)
    equipment_type: str = Field(..., min_length=1)
    weight_lbs: float = Field(default=0.0, ge=0)
    fuel_index: float = Field(default=0.0, ge=0)


class RatePredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    predicted_rate_usd: float
    currency: str = "USD"
    model_version: str
