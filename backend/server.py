from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
import json
import asyncio
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI(title="Infæmous Freight API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ============= ENUMS =============
class UserRole(str, Enum):
    ADMIN = "admin"
    SHIPPER = "shipper"
    CARRIER = "carrier"
    DRIVER = "driver"

class LoadStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    BOOKED = "booked"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class BidStatus(str, Enum):
    SUBMITTED = "submitted"
    WITHDRAWN = "withdrawn"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class AssignmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DisputeStatus(str, Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"
    FAILED = "failed"

# ============= PRICING PACKAGES =============
PREMIUM_PACKAGES = {
    "boost_7": {"name": "7-Day Boost", "price": 29.99, "days": 7, "description": "Featured listing for 7 days"},
    "boost_30": {"name": "30-Day Boost", "price": 79.99, "days": 30, "description": "Featured listing for 30 days"},
    "verified_carrier": {"name": "Verified Carrier Badge", "price": 149.99, "days": 365, "description": "Annual verified carrier status"},
}

TRANSACTION_FEE_PERCENT = 2.5  # 2.5% platform fee

# ============= MODELS =============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    role: UserRole = UserRole.SHIPPER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    display_name: Optional[str] = None
    role: UserRole
    company_name: Optional[str] = None
    phone: Optional[str] = None
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    home_city: Optional[str] = None
    home_state: Optional[str] = None
    is_verified: bool = False
    verified_until: Optional[str] = None
    rating: Optional[float] = None
    rating_count: int = 0
    created_at: str

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    home_city: Optional[str] = None
    home_state: Optional[str] = None

class LanePreference(BaseModel):
    pickup_state: str
    dropoff_state: str
    equipment: Optional[str] = None
    min_rate_cents: Optional[int] = None

class LoadCreate(BaseModel):
    pickup_city: str
    pickup_state: str
    pickup_date: str
    dropoff_city: str
    dropoff_state: str
    dropoff_date: str
    commodity: Optional[str] = None
    weight_lbs: Optional[int] = None
    equipment: Optional[str] = "van"
    target_rate_cents: Optional[int] = None
    notes: Optional[str] = None
    is_premium: bool = False

class LoadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_by: str
    created_by_name: Optional[str] = None
    status: LoadStatus
    pickup_city: str
    pickup_state: str
    pickup_date: str
    dropoff_city: str
    dropoff_state: str
    dropoff_date: str
    commodity: Optional[str] = None
    weight_lbs: Optional[int] = None
    equipment: Optional[str] = None
    target_rate_cents: Optional[int] = None
    notes: Optional[str] = None
    is_premium: bool = False
    premium_until: Optional[str] = None
    distance_miles: Optional[int] = None
    created_at: str
    updated_at: str

class LoadSearchParams(BaseModel):
    pickup_state: Optional[str] = None
    dropoff_state: Optional[str] = None
    equipment: Optional[str] = None
    min_rate: Optional[int] = None
    max_rate: Optional[int] = None
    pickup_date_from: Optional[str] = None
    pickup_date_to: Optional[str] = None

class BidCreate(BaseModel):
    load_id: str
    offer_rate_cents: int
    message: Optional[str] = None

class BidResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    load_id: str
    carrier_id: str
    carrier_name: Optional[str] = None
    carrier_rating: Optional[float] = None
    carrier_verified: bool = False
    status: BidStatus
    offer_rate_cents: int
    message: Optional[str] = None
    created_at: str

class BookingCreate(BaseModel):
    load_id: str
    bid_id: str

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    load_id: str
    shipper_id: str
    carrier_id: str
    driver_id: Optional[str] = None
    status: AssignmentStatus
    booked_rate_cents: int
    platform_fee_cents: int = 0
    escrow_status: PaymentStatus = PaymentStatus.PENDING
    created_at: str

class MessageCreate(BaseModel):
    thread_id: str
    body: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    thread_id: str
    sender_id: str
    sender_name: Optional[str] = None
    body: str
    created_at: str

class ThreadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    load_id: str
    created_at: str
    summary: Optional[str] = None

class RatingCreate(BaseModel):
    assignment_id: str
    rating: int  # 1-5
    comment: Optional[str] = None

class RatingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assignment_id: str
    rater_id: str
    rated_id: str
    rating: int
    comment: Optional[str] = None
    created_at: str

class DisputeCreate(BaseModel):
    assignment_id: str
    reason: str
    description: str

class DisputeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assignment_id: str
    raised_by: str
    reason: str
    description: str
    status: DisputeStatus
    resolution: Optional[str] = None
    created_at: str

class TrackingPing(BaseModel):
    assignment_id: str
    lat: float
    lng: float
    speed_mph: Optional[float] = None
    heading: Optional[float] = None

class DocumentUpload(BaseModel):
    assignment_id: str
    doc_type: str  # bol, pod, insurance, etc.
    filename: str

class RateCalculatorRequest(BaseModel):
    pickup_state: str
    dropoff_state: str
    equipment: str = "van"
    weight_lbs: Optional[int] = None

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    load_id: Optional[str] = None  # For premium listings

class AnalyticsResponse(BaseModel):
    total_loads: int
    total_revenue_cents: int
    avg_rate_cents: int
    loads_by_status: Dict[str, int]
    top_lanes: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]

# ============= AUTH HELPERS =============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# ============= WEBSOCKET MANAGER =============
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
    
    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ============= DISTANCE/RATE CALCULATOR =============
# Simplified distance matrix (state capitals approximation)
STATE_DISTANCES = {
    ("CA", "AZ"): 370, ("CA", "NV"): 270, ("CA", "TX"): 1200,
    ("TX", "OK"): 200, ("TX", "LA"): 270, ("TX", "NM"): 280,
    ("IL", "MI"): 280, ("IL", "IN"): 180, ("IL", "WI"): 150,
    ("NY", "PA"): 270, ("NY", "NJ"): 90, ("NY", "MA"): 200,
    ("FL", "GA"): 350, ("FL", "AL"): 400, ("FL", "SC"): 500,
    ("WA", "OR"): 175, ("WA", "ID"): 300, ("WA", "CA"): 750,
}

def get_distance(pickup_state: str, dropoff_state: str) -> int:
    """Get approximate distance between states"""
    key = (pickup_state.upper(), dropoff_state.upper())
    reverse_key = (dropoff_state.upper(), pickup_state.upper())
    if key in STATE_DISTANCES:
        return STATE_DISTANCES[key]
    if reverse_key in STATE_DISTANCES:
        return STATE_DISTANCES[reverse_key]
    return 500  # Default estimate

def calculate_rate(distance: int, equipment: str = "van", weight_lbs: int = None) -> dict:
    """Calculate estimated rate based on distance and equipment"""
    base_rate_per_mile = {
        "van": 2.50, "reefer": 3.00, "flatbed": 2.75,
        "step_deck": 2.85, "hotshot": 2.20
    }
    rate = base_rate_per_mile.get(equipment.lower(), 2.50)
    
    # Weight adjustments
    if weight_lbs and weight_lbs > 40000:
        rate *= 1.1
    
    total = int(distance * rate * 100)  # Convert to cents
    fuel_estimate = int(distance * 0.50 * 100)  # $0.50/mile fuel
    
    return {
        "distance_miles": distance,
        "rate_per_mile_cents": int(rate * 100),
        "estimated_rate_cents": total,
        "fuel_estimate_cents": fuel_estimate,
        "profit_estimate_cents": total - fuel_estimate
    }

# ============= AUTH ROUTES =============
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "display_name": user_data.display_name or user_data.email.split("@")[0],
        "role": user_data.role.value,
        "company_name": None,
        "phone": None,
        "dot_number": None,
        "mc_number": None,
        "home_city": None,
        "home_state": None,
        "is_verified": False,
        "verified_until": None,
        "rating": None,
        "rating_count": 0,
        "lane_preferences": [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user_data.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "display_name": user_doc["display_name"],
            "role": user_data.role.value
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "display_name": user.get("display_name"),
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

@api_router.put("/auth/profile")
async def update_profile(profile: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return UserResponse(**updated)

# ============= LANE PREFERENCES =============
@api_router.post("/preferences/lanes")
async def add_lane_preference(pref: LanePreference, user: dict = Depends(get_current_user)):
    pref_doc = {
        "id": str(uuid.uuid4()),
        **pref.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"lane_preferences": pref_doc}}
    )
    return {"ok": True, "preference": pref_doc}

@api_router.get("/preferences/lanes")
async def get_lane_preferences(user: dict = Depends(get_current_user)):
    return {"preferences": user.get("lane_preferences", [])}

@api_router.delete("/preferences/lanes/{pref_id}")
async def delete_lane_preference(pref_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"lane_preferences": {"id": pref_id}}}
    )
    return {"ok": True}

@api_router.get("/preferences/matched-loads")
async def get_matched_loads(user: dict = Depends(get_current_user)):
    """Get loads matching user's lane preferences"""
    prefs = user.get("lane_preferences", [])
    if not prefs:
        return {"loads": []}
    
    # Build OR query for all preferences
    or_conditions = []
    for pref in prefs:
        cond = {
            "pickup_state": pref["pickup_state"],
            "dropoff_state": pref["dropoff_state"],
            "status": "posted"
        }
        if pref.get("equipment"):
            cond["equipment"] = pref["equipment"]
        if pref.get("min_rate_cents"):
            cond["target_rate_cents"] = {"$gte": pref["min_rate_cents"]}
        or_conditions.append(cond)
    
    loads = await db.loads.find(
        {"$or": or_conditions},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"loads": loads}

# ============= LOADS ROUTES =============
@api_router.post("/loads", response_model=LoadResponse)
async def create_load(load_data: LoadCreate, user: dict = Depends(get_current_user)):
    load_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    distance = get_distance(load_data.pickup_state, load_data.dropoff_state)
    
    load_doc = {
        "id": load_id,
        "created_by": user["id"],
        "status": LoadStatus.POSTED.value,
        **load_data.model_dump(),
        "distance_miles": distance,
        "premium_until": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.loads.insert_one(load_doc)
    load_doc["created_by_name"] = user.get("display_name")
    return LoadResponse(**load_doc)

@api_router.get("/loads", response_model=List[LoadResponse])
async def list_loads(
    status: Optional[str] = None,
    pickup_state: Optional[str] = None,
    dropoff_state: Optional[str] = None,
    equipment: Optional[str] = None,
    min_rate: Optional[int] = None,
    max_rate: Optional[int] = None,
    pickup_date_from: Optional[str] = None,
    pickup_date_to: Optional[str] = None,
    limit: int = 100
):
    query = {"status": {"$in": ["posted", "booked", "in_transit", "delivered"]}}
    
    if status:
        query["status"] = status
    if pickup_state:
        query["pickup_state"] = pickup_state.upper()
    if dropoff_state:
        query["dropoff_state"] = dropoff_state.upper()
    if equipment:
        query["equipment"] = equipment.lower()
    if min_rate:
        query["target_rate_cents"] = {"$gte": min_rate}
    if max_rate:
        if "target_rate_cents" in query:
            query["target_rate_cents"]["$lte"] = max_rate
        else:
            query["target_rate_cents"] = {"$lte": max_rate}
    if pickup_date_from:
        query["pickup_date"] = {"$gte": pickup_date_from}
    if pickup_date_to:
        if "pickup_date" in query:
            query["pickup_date"]["$lte"] = pickup_date_to
        else:
            query["pickup_date"] = {"$lte": pickup_date_to}
    
    # Sort premium loads first, then by date
    loads = await db.loads.find(query, {"_id": 0}).sort([
        ("is_premium", -1),
        ("pickup_date", 1)
    ]).limit(limit).to_list(limit)
    
    # Batch fetch creator names (avoid N+1 queries)
    creator_ids = list(set(load["created_by"] for load in loads))
    if creator_ids:
        creators = await db.users.find({"id": {"$in": creator_ids}}, {"_id": 0, "id": 1, "display_name": 1}).to_list(len(creator_ids))
        creator_map = {c["id"]: c.get("display_name") for c in creators}
        for load in loads:
            load["created_by_name"] = creator_map.get(load["created_by"])
    
    return [LoadResponse(**load) for load in loads]

@api_router.get("/loads/my", response_model=List[LoadResponse])
async def my_loads(user: dict = Depends(get_current_user)):
    loads = await db.loads.find({"created_by": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for load in loads:
        load["created_by_name"] = user.get("display_name")
    return [LoadResponse(**load) for load in loads]

@api_router.get("/loads/{load_id}", response_model=LoadResponse)
async def get_load(load_id: str):
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    creator = await db.users.find_one({"id": load["created_by"]}, {"_id": 0, "display_name": 1})
    load["created_by_name"] = creator.get("display_name") if creator else None
    return LoadResponse(**load)

@api_router.put("/loads/{load_id}/status")
async def update_load_status(load_id: str, status: LoadStatus, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    assignment = await db.assignments.find_one({"load_id": load_id}, {"_id": 0})
    allowed = load["created_by"] == user["id"]
    if assignment:
        allowed = allowed or assignment["carrier_id"] == user["id"] or assignment.get("driver_id") == user["id"]
    
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.loads.update_one({"id": load_id}, {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    # If delivered, trigger escrow release
    if status == LoadStatus.DELIVERED and assignment:
        await db.assignments.update_one(
            {"id": assignment["id"]},
            {"$set": {"escrow_status": PaymentStatus.RELEASED.value}}
        )
    
    return {"ok": True, "status": status.value}

# ============= RATE CALCULATOR =============
@api_router.post("/calculator/rate")
async def calculate_load_rate(req: RateCalculatorRequest):
    distance = get_distance(req.pickup_state, req.dropoff_state)
    result = calculate_rate(distance, req.equipment, req.weight_lbs)
    return result

# ============= BIDS ROUTES =============
@api_router.post("/bids", response_model=BidResponse)
async def create_bid(bid_data: BidCreate, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": bid_data.load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load["status"] != "posted":
        raise HTTPException(status_code=400, detail="Load is not available for bidding")
    
    existing = await db.bids.find_one({"load_id": bid_data.load_id, "carrier_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You already bid on this load")
    
    bid_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    bid_doc = {
        "id": bid_id,
        "load_id": bid_data.load_id,
        "carrier_id": user["id"],
        "status": BidStatus.SUBMITTED.value,
        "offer_rate_cents": bid_data.offer_rate_cents,
        "message": bid_data.message,
        "created_at": now,
        "updated_at": now
    }
    
    await db.bids.insert_one(bid_doc)
    bid_doc["carrier_name"] = user.get("display_name")
    bid_doc["carrier_rating"] = user.get("rating")
    bid_doc["carrier_verified"] = user.get("is_verified", False)
    return BidResponse(**bid_doc)

@api_router.get("/loads/{load_id}/bids", response_model=List[BidResponse])
async def get_load_bids(load_id: str, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    if load["created_by"] != user["id"]:
        bids = await db.bids.find({"load_id": load_id, "carrier_id": user["id"]}, {"_id": 0}).to_list(100)
    else:
        bids = await db.bids.find({"load_id": load_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Batch fetch carrier details (avoid N+1 queries)
    carrier_ids = list(set(bid["carrier_id"] for bid in bids))
    if carrier_ids:
        carriers = await db.users.find({"id": {"$in": carrier_ids}}, {"_id": 0, "id": 1, "display_name": 1, "rating": 1, "is_verified": 1}).to_list(len(carrier_ids))
        carrier_map = {c["id"]: c for c in carriers}
        for bid in bids:
            carrier = carrier_map.get(bid["carrier_id"], {})
            bid["carrier_name"] = carrier.get("display_name")
            bid["carrier_rating"] = carrier.get("rating")
            bid["carrier_verified"] = carrier.get("is_verified", False)
    
    return [BidResponse(**bid) for bid in bids]

@api_router.get("/bids/my", response_model=List[BidResponse])
async def my_bids(user: dict = Depends(get_current_user)):
    bids = await db.bids.find({"carrier_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for bid in bids:
        bid["carrier_name"] = user.get("display_name")
        bid["carrier_rating"] = user.get("rating")
        bid["carrier_verified"] = user.get("is_verified", False)
    return [BidResponse(**bid) for bid in bids]

# ============= ASSIGNMENTS (BOOKING) =============
@api_router.post("/assignments/book", response_model=AssignmentResponse)
async def book_load(booking: BookingCreate, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": booking.load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load["created_by"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only load owner can book")
    if load["status"] != "posted":
        raise HTTPException(status_code=400, detail="Load is not available")
    
    bid = await db.bids.find_one({"id": booking.bid_id, "load_id": booking.load_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    assignment_id = str(uuid.uuid4())
    thread_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    platform_fee = int(bid["offer_rate_cents"] * TRANSACTION_FEE_PERCENT / 100)
    
    assignment_doc = {
        "id": assignment_id,
        "load_id": booking.load_id,
        "shipper_id": user["id"],
        "carrier_id": bid["carrier_id"],
        "driver_id": None,
        "status": AssignmentStatus.ACTIVE.value,
        "booked_rate_cents": bid["offer_rate_cents"],
        "platform_fee_cents": platform_fee,
        "escrow_status": PaymentStatus.HELD.value,
        "created_at": now
    }
    
    thread_doc = {
        "id": thread_id,
        "load_id": booking.load_id,
        "created_at": now
    }
    
    await db.assignments.insert_one(assignment_doc)
    await db.message_threads.insert_one(thread_doc)
    await db.loads.update_one({"id": booking.load_id}, {"$set": {"status": LoadStatus.BOOKED.value, "updated_at": now}})
    await db.bids.update_one({"id": booking.bid_id}, {"$set": {"status": BidStatus.ACCEPTED.value, "updated_at": now}})
    await db.bids.update_many(
        {"load_id": booking.load_id, "id": {"$ne": booking.bid_id}},
        {"$set": {"status": BidStatus.REJECTED.value, "updated_at": now}}
    )
    
    return AssignmentResponse(**assignment_doc)

@api_router.get("/assignments/my", response_model=List[AssignmentResponse])
async def my_assignments(user: dict = Depends(get_current_user)):
    query = {"$or": [
        {"shipper_id": user["id"]},
        {"carrier_id": user["id"]},
        {"driver_id": user["id"]}
    ]}
    assignments = await db.assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [AssignmentResponse(**a) for a in assignments]

# ============= RATINGS =============
@api_router.post("/ratings", response_model=RatingResponse)
async def create_rating(rating_data: RatingCreate, user: dict = Depends(get_current_user)):
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    
    assignment = await db.assignments.find_one({"id": rating_data.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Determine who is being rated
    if user["id"] == assignment["shipper_id"]:
        rated_id = assignment["carrier_id"]
    elif user["id"] == assignment["carrier_id"]:
        rated_id = assignment["shipper_id"]
    else:
        raise HTTPException(status_code=403, detail="Not part of this assignment")
    
    # Check if already rated
    existing = await db.ratings.find_one({
        "assignment_id": rating_data.assignment_id,
        "rater_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already rated this assignment")
    
    rating_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    rating_doc = {
        "id": rating_id,
        "assignment_id": rating_data.assignment_id,
        "rater_id": user["id"],
        "rated_id": rated_id,
        "rating": rating_data.rating,
        "comment": rating_data.comment,
        "created_at": now
    }
    
    await db.ratings.insert_one(rating_doc)
    
    # Update user's average rating
    all_ratings = await db.ratings.find({"rated_id": rated_id}, {"rating": 1}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_ratings) / len(all_ratings)
    await db.users.update_one(
        {"id": rated_id},
        {"$set": {"rating": round(avg_rating, 2), "rating_count": len(all_ratings)}}
    )
    
    return RatingResponse(**rating_doc)

@api_router.get("/ratings/user/{user_id}", response_model=List[RatingResponse])
async def get_user_ratings(user_id: str):
    ratings = await db.ratings.find({"rated_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [RatingResponse(**r) for r in ratings]

# ============= DISPUTES =============
@api_router.post("/disputes", response_model=DisputeResponse)
async def create_dispute(dispute_data: DisputeCreate, user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": dispute_data.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if user["id"] not in [assignment["shipper_id"], assignment["carrier_id"]]:
        raise HTTPException(status_code=403, detail="Not part of this assignment")
    
    dispute_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    dispute_doc = {
        "id": dispute_id,
        "assignment_id": dispute_data.assignment_id,
        "raised_by": user["id"],
        "reason": dispute_data.reason,
        "description": dispute_data.description,
        "status": DisputeStatus.OPEN.value,
        "resolution": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.disputes.insert_one(dispute_doc)
    
    # Put escrow on hold
    await db.assignments.update_one(
        {"id": dispute_data.assignment_id},
        {"$set": {"escrow_status": PaymentStatus.HELD.value}}
    )
    
    return DisputeResponse(**dispute_doc)

@api_router.get("/disputes/my", response_model=List[DisputeResponse])
async def my_disputes(user: dict = Depends(get_current_user)):
    disputes = await db.disputes.find({"raised_by": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [DisputeResponse(**d) for d in disputes]

@api_router.put("/disputes/{dispute_id}/resolve")
async def resolve_dispute(dispute_id: str, resolution: str, user: dict = Depends(get_current_user)):
    # In production, this would be admin-only
    dispute = await db.disputes.find_one({"id": dispute_id}, {"_id": 0})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    await db.disputes.update_one(
        {"id": dispute_id},
        {"$set": {"status": DisputeStatus.RESOLVED.value, "resolution": resolution, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"ok": True, "status": "resolved"}

# ============= TRACKING =============
@api_router.post("/tracking/ping")
async def submit_tracking_ping(ping: TrackingPing, user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": ping.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if user["id"] not in [assignment["carrier_id"], assignment.get("driver_id")]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ping_doc = {
        "id": str(uuid.uuid4()),
        "assignment_id": ping.assignment_id,
        "lat": ping.lat,
        "lng": ping.lng,
        "speed_mph": ping.speed_mph,
        "heading": ping.heading,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tracking_pings.insert_one(ping_doc)
    
    # Broadcast to WebSocket
    await manager.broadcast(f"tracking_{ping.assignment_id}", {
        "type": "location_update",
        "data": ping_doc
    })
    
    return {"ok": True}

@api_router.get("/tracking/{assignment_id}")
async def get_tracking_history(assignment_id: str, user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if user["id"] not in [assignment["shipper_id"], assignment["carrier_id"], assignment.get("driver_id")]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    pings = await db.tracking_pings.find(
        {"assignment_id": assignment_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    return {"pings": pings}

@api_router.get("/tracking/{assignment_id}/latest")
async def get_latest_location(assignment_id: str, user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    ping = await db.tracking_pings.find_one(
        {"assignment_id": assignment_id},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {"location": ping}

# ============= DOCUMENTS =============
@api_router.post("/documents/upload")
async def upload_document(
    assignment_id: str,
    doc_type: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if user["id"] not in [assignment["shipper_id"], assignment["carrier_id"], assignment.get("driver_id")]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Read file content and encode as base64
    content = await file.read()
    encoded = base64.b64encode(content).decode('utf-8')
    
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc_doc = {
        "id": doc_id,
        "assignment_id": assignment_id,
        "uploaded_by": user["id"],
        "doc_type": doc_type,
        "filename": file.filename,
        "content_type": file.content_type,
        "content_base64": encoded,
        "created_at": now
    }
    
    await db.documents.insert_one(doc_doc)
    
    return {"ok": True, "document_id": doc_id, "filename": file.filename}

@api_router.get("/documents/{assignment_id}")
async def list_documents(assignment_id: str, user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    docs = await db.documents.find(
        {"assignment_id": assignment_id},
        {"_id": 0, "content_base64": 0}  # Exclude content for listing
    ).to_list(100)
    
    return {"documents": docs}

@api_router.get("/documents/{assignment_id}/{doc_id}")
async def get_document(assignment_id: str, doc_id: str, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "assignment_id": assignment_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc

# ============= MESSAGING =============
@api_router.get("/threads/by-load/{load_id}", response_model=ThreadResponse)
async def get_thread_by_load(load_id: str, user: dict = Depends(get_current_user)):
    thread = await db.message_threads.find_one({"load_id": load_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="No thread for this load")
    
    summary = await db.thread_summaries.find_one({"thread_id": thread["id"]}, {"_id": 0})
    thread["summary"] = summary.get("summary") if summary else None
    
    return ThreadResponse(**thread)

@api_router.get("/threads/{thread_id}/messages", response_model=List[MessageResponse])
async def get_thread_messages(thread_id: str, user: dict = Depends(get_current_user)):
    messages = await db.messages.find({"thread_id": thread_id}, {"_id": 0}).sort("created_at", 1).limit(200).to_list(200)
    
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "display_name": 1})
        msg["sender_name"] = sender.get("display_name") if sender else None
    
    return [MessageResponse(**msg) for msg in messages]

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(msg_data: MessageCreate, user: dict = Depends(get_current_user)):
    thread = await db.message_threads.find_one({"id": msg_data.thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    assignment = await db.assignments.find_one({"load_id": thread["load_id"]}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=403, detail="Thread not accessible")
    
    allowed = user["id"] in [assignment["shipper_id"], assignment["carrier_id"], assignment.get("driver_id")]
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to message")
    
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    msg_doc = {
        "id": msg_id,
        "thread_id": msg_data.thread_id,
        "sender_id": user["id"],
        "body": msg_data.body,
        "created_at": now
    }
    
    await db.messages.insert_one(msg_doc)
    
    # Broadcast via WebSocket
    await manager.broadcast(f"thread_{msg_data.thread_id}", {
        "type": "new_message",
        "data": {**msg_doc, "sender_name": user.get("display_name")}
    })
    
    msg_doc["sender_name"] = user.get("display_name")
    return MessageResponse(**msg_doc)

# ============= AI SUMMARIZER =============
@api_router.post("/threads/summarize")
async def summarize_thread(req: dict, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    thread_id = req.get("thread_id")
    thread = await db.message_threads.find_one({"id": thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    messages = await db.messages.find({"thread_id": thread_id}, {"_id": 0}).sort("created_at", 1).limit(200).to_list(200)
    
    if not messages:
        raise HTTPException(status_code=400, detail="No messages to summarize")
    
    transcript_lines = []
    for i, msg in enumerate(messages, 1):
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "display_name": 1})
        name = sender.get("display_name", "Unknown") if sender else "Unknown"
        transcript_lines.append(f"{i}. [{msg['created_at']}] {name}: {msg['body']}")
    
    transcript = "\n".join(transcript_lines)
    
    prompt = f"""Summarize this freight thread. Output:
- Key decisions
- Rates/terms
- Next actions
- Risks/issues
Be concise and businesslike.

THREAD:
{transcript}"""
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"thread-summarizer-{thread_id}",
            system_message="You are a freight logistics assistant that summarizes conversation threads."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        summary_text = response
        
        now = datetime.now(timezone.utc).isoformat()
        await db.thread_summaries.update_one(
            {"thread_id": thread_id},
            {"$set": {"thread_id": thread_id, "summary": summary_text, "model": "gpt-4o-mini", "updated_at": now}},
            upsert=True
        )
        
        return {"ok": True, "thread_id": thread_id, "summary": summary_text}
    except Exception as e:
        logging.error(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= PAYMENTS =============
@api_router.get("/packages")
async def list_packages():
    return {"packages": PREMIUM_PACKAGES}

@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    if req.package_id not in PREMIUM_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PREMIUM_PACKAGES[req.package_id]
    
    stripe_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    success_url = f"{req.origin_url}/payments/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/payments/cancel"
    
    metadata = {
        "user_id": user["id"],
        "package_id": req.package_id,
        "load_id": req.load_id or ""
    }
    
    checkout_req = CheckoutSessionRequest(
        amount=package["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_req)
    
    # Create payment transaction record
    tx_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "package_id": req.package_id,
        "load_id": req.load_id,
        "amount_cents": int(package["price"] * 100),
        "currency": "usd",
        "status": "pending",
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(tx_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if tx and tx["payment_status"] != "paid" and status.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}}
        )
        
        # Apply package benefits
        package_id = tx.get("package_id")
        if package_id and package_id in PREMIUM_PACKAGES:
            package = PREMIUM_PACKAGES[package_id]
            now = datetime.now(timezone.utc)
            expires = now + timedelta(days=package["days"])
            
            if package_id == "verified_carrier":
                await db.users.update_one(
                    {"id": tx["user_id"]},
                    {"$set": {"is_verified": True, "verified_until": expires.isoformat()}}
                )
            elif tx.get("load_id"):
                await db.loads.update_one(
                    {"id": tx["load_id"]},
                    {"$set": {"is_premium": True, "premium_until": expires.isoformat()}}
                )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
        
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if tx and tx["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
        
        return {"ok": True}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"ok": False, "error": str(e)}

@api_router.get("/payments/my")
async def my_payments(user: dict = Depends(get_current_user)):
    txs = await db.payment_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"transactions": txs}

# ============= ANALYTICS =============
@api_router.get("/analytics/dashboard")
async def get_analytics(user: dict = Depends(get_current_user)):
    # Get user's loads/assignments for analytics
    if user["role"] == "shipper":
        loads = await db.loads.find({"created_by": user["id"]}, {"_id": 0}).to_list(1000)
        assignments = await db.assignments.find({"shipper_id": user["id"]}, {"_id": 0}).to_list(1000)
    else:
        loads = []
        assignments = await db.assignments.find({"carrier_id": user["id"]}, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total_loads = len(loads)
    total_revenue = sum(a.get("booked_rate_cents", 0) for a in assignments)
    avg_rate = total_revenue // len(assignments) if assignments else 0
    
    # Loads by status
    status_counts = {}
    for load in loads:
        s = load.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1
    
    # Top lanes
    lane_counts = {}
    for load in loads:
        lane = f"{load.get('pickup_state', '?')} → {load.get('dropoff_state', '?')}"
        lane_counts[lane] = lane_counts.get(lane, 0) + 1
    top_lanes = sorted(lane_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Monthly trends (simplified)
    monthly = {}
    for a in assignments:
        month = a.get("created_at", "")[:7]
        if month:
            if month not in monthly:
                monthly[month] = {"count": 0, "revenue": 0}
            monthly[month]["count"] += 1
            monthly[month]["revenue"] += a.get("booked_rate_cents", 0)
    
    return {
        "total_loads": total_loads,
        "total_revenue_cents": total_revenue,
        "avg_rate_cents": avg_rate,
        "loads_by_status": status_counts,
        "top_lanes": [{"lane": l, "count": c} for l, c in top_lanes],
        "monthly_trends": [{"month": m, **d} for m, d in sorted(monthly.items())]
    }

@api_router.get("/analytics/market")
async def get_market_analytics():
    """Public market analytics"""
    # Get all posted loads for market analysis
    loads = await db.loads.find(
        {"status": {"$in": ["posted", "booked"]}},
        {"_id": 0, "pickup_state": 1, "dropoff_state": 1, "target_rate_cents": 1, "equipment": 1}
    ).to_list(1000)
    
    # Average rates by equipment
    equip_rates = {}
    for load in loads:
        eq = load.get("equipment", "van")
        rate = load.get("target_rate_cents", 0)
        if eq not in equip_rates:
            equip_rates[eq] = {"total": 0, "count": 0}
        equip_rates[eq]["total"] += rate
        equip_rates[eq]["count"] += 1
    
    avg_by_equipment = {
        eq: d["total"] // d["count"] if d["count"] > 0 else 0
        for eq, d in equip_rates.items()
    }
    
    # Hot lanes
    lane_counts = {}
    for load in loads:
        lane = f"{load.get('pickup_state', '?')} → {load.get('dropoff_state', '?')}"
        lane_counts[lane] = lane_counts.get(lane, 0) + 1
    hot_lanes = sorted(lane_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_available": len([l for l in loads if l.get("status") == "posted"]),
        "avg_rate_by_equipment": avg_by_equipment,
        "hot_lanes": [{"lane": l, "count": c} for l, c in hot_lanes]
    }

# ============= WEBSOCKET ENDPOINTS =============
@app.websocket("/ws/messages/{thread_id}")
async def websocket_messages(websocket: WebSocket, thread_id: str):
    await manager.connect(websocket, f"thread_{thread_id}")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"thread_{thread_id}")

@app.websocket("/ws/tracking/{assignment_id}")
async def websocket_tracking(websocket: WebSocket, assignment_id: str):
    await manager.connect(websocket, f"tracking_{assignment_id}")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"tracking_{assignment_id}")

# ============= HEALTH CHECK =============
@api_router.get("/")
async def root():
    return {"message": "Infæmous Freight API", "status": "running", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
