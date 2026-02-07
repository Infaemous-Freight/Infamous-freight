from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'infamous-freight-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI(title="Infæmous Freight API")

# Create a router with the /api prefix
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
    created_at: str

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    home_city: Optional[str] = None
    home_state: Optional[str] = None

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
    created_at: str
    updated_at: str

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

class SummarizeRequest(BaseModel):
    thread_id: str

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

# ============= LOADS ROUTES =============
@api_router.post("/loads", response_model=LoadResponse)
async def create_load(load_data: LoadCreate, user: dict = Depends(get_current_user)):
    load_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    load_doc = {
        "id": load_id,
        "created_by": user["id"],
        "status": LoadStatus.POSTED.value,
        **load_data.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.loads.insert_one(load_doc)
    load_doc["created_by_name"] = user.get("display_name")
    return LoadResponse(**load_doc)

@api_router.get("/loads", response_model=List[LoadResponse])
async def list_loads(status: Optional[str] = None, limit: int = 100):
    query = {"status": {"$in": ["posted", "booked", "in_transit", "delivered"]}}
    if status:
        query["status"] = status
    
    loads = await db.loads.find(query, {"_id": 0}).sort("pickup_date", 1).limit(limit).to_list(limit)
    
    # Enrich with creator names
    for load in loads:
        creator = await db.users.find_one({"id": load["created_by"]}, {"_id": 0, "display_name": 1})
        load["created_by_name"] = creator.get("display_name") if creator else None
    
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
    
    # Check if user is owner or assigned carrier
    assignment = await db.assignments.find_one({"load_id": load_id}, {"_id": 0})
    allowed = load["created_by"] == user["id"]
    if assignment:
        allowed = allowed or assignment["carrier_id"] == user["id"] or assignment.get("driver_id") == user["id"]
    
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.loads.update_one({"id": load_id}, {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True, "status": status.value}

# ============= BIDS ROUTES =============
@api_router.post("/bids", response_model=BidResponse)
async def create_bid(bid_data: BidCreate, user: dict = Depends(get_current_user)):
    # Check load exists and is posted
    load = await db.loads.find_one({"id": bid_data.load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load["status"] != "posted":
        raise HTTPException(status_code=400, detail="Load is not available for bidding")
    
    # Check if already bid
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
    return BidResponse(**bid_doc)

@api_router.get("/loads/{load_id}/bids", response_model=List[BidResponse])
async def get_load_bids(load_id: str, user: dict = Depends(get_current_user)):
    # Check if user owns the load or is a bidder
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    if load["created_by"] != user["id"]:
        # Only show own bid
        bids = await db.bids.find({"load_id": load_id, "carrier_id": user["id"]}, {"_id": 0}).to_list(100)
    else:
        bids = await db.bids.find({"load_id": load_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for bid in bids:
        carrier = await db.users.find_one({"id": bid["carrier_id"]}, {"_id": 0, "display_name": 1})
        bid["carrier_name"] = carrier.get("display_name") if carrier else None
    
    return [BidResponse(**bid) for bid in bids]

@api_router.get("/bids/my", response_model=List[BidResponse])
async def my_bids(user: dict = Depends(get_current_user)):
    bids = await db.bids.find({"carrier_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for bid in bids:
        bid["carrier_name"] = user.get("display_name")
    return [BidResponse(**bid) for bid in bids]

# ============= ASSIGNMENTS (BOOKING) ROUTES =============
@api_router.post("/assignments/book", response_model=AssignmentResponse)
async def book_load(booking: BookingCreate, user: dict = Depends(get_current_user)):
    # Verify load ownership
    load = await db.loads.find_one({"id": booking.load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load["created_by"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only load owner can book")
    if load["status"] != "posted":
        raise HTTPException(status_code=400, detail="Load is not available")
    
    # Verify bid
    bid = await db.bids.find_one({"id": booking.bid_id, "load_id": booking.load_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    assignment_id = str(uuid.uuid4())
    thread_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create assignment
    assignment_doc = {
        "id": assignment_id,
        "load_id": booking.load_id,
        "shipper_id": user["id"],
        "carrier_id": bid["carrier_id"],
        "driver_id": None,
        "status": AssignmentStatus.ACTIVE.value,
        "booked_rate_cents": bid["offer_rate_cents"],
        "created_at": now
    }
    
    # Create message thread
    thread_doc = {
        "id": thread_id,
        "load_id": booking.load_id,
        "created_at": now
    }
    
    await db.assignments.insert_one(assignment_doc)
    await db.message_threads.insert_one(thread_doc)
    
    # Update load status
    await db.loads.update_one({"id": booking.load_id}, {"$set": {"status": LoadStatus.BOOKED.value, "updated_at": now}})
    
    # Update bid status
    await db.bids.update_one({"id": booking.bid_id}, {"$set": {"status": BidStatus.ACCEPTED.value, "updated_at": now}})
    
    # Reject other bids
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

# ============= MESSAGING ROUTES =============
@api_router.get("/threads/by-load/{load_id}", response_model=ThreadResponse)
async def get_thread_by_load(load_id: str, user: dict = Depends(get_current_user)):
    thread = await db.message_threads.find_one({"load_id": load_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="No thread for this load")
    
    # Get summary if exists
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
    # Verify thread exists
    thread = await db.message_threads.find_one({"id": msg_data.thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Verify user has access (is shipper, carrier, or driver)
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
    msg_doc["sender_name"] = user.get("display_name")
    return MessageResponse(**msg_doc)

# ============= THREAD SUMMARIZER (AI) =============
@api_router.post("/threads/summarize")
async def summarize_thread(req: SummarizeRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    thread = await db.message_threads.find_one({"id": req.thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    messages = await db.messages.find({"thread_id": req.thread_id}, {"_id": 0}).sort("created_at", 1).limit(200).to_list(200)
    
    if not messages:
        raise HTTPException(status_code=400, detail="No messages to summarize")
    
    # Build transcript
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
            session_id=f"thread-summarizer-{req.thread_id}",
            system_message="You are a freight logistics assistant that summarizes conversation threads."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        summary_text = response
        
        # Upsert summary
        now = datetime.now(timezone.utc).isoformat()
        await db.thread_summaries.update_one(
            {"thread_id": req.thread_id},
            {"$set": {"thread_id": req.thread_id, "summary": summary_text, "model": "gpt-4o-mini", "updated_at": now}},
            upsert=True
        )
        
        return {"ok": True, "thread_id": req.thread_id, "summary": summary_text}
    except Exception as e:
        logging.error(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= HEALTH CHECK =============
@api_router.get("/")
async def root():
    return {"message": "Infæmous Freight API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
