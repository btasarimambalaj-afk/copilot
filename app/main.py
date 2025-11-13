from fastapi import FastAPI, WebSocket, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.models import Base, engine, SessionLocal, Visitor, Message, Conversation
from fastapi.responses import FileResponse
import os, uuid
from datetime import datetime, timedelta
import jwt

# Config from env
DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET = os.environ.get("JWT_SECRET", "changeme")
ADMIN_OTP = os.environ.get("ADMIN_OTP", "123456")
MEDIA_ROOT = os.environ.get("MEDIA_ROOT", "uploads")

os.makedirs(os.path.join(MEDIA_ROOT, "img"), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, "aud"), exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Support Chat - Mobil & Güvenli")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGINS", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT helpers
def create_token(identity: str) -> str:
    payload = {"sub": identity, "exp": datetime.utcnow() + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/admin/login")
async def admin_login(otp: str = Form(...)):
    if otp != ADMIN_OTP:
        raise HTTPException(status_code=403, detail="OTP invalid")
    token = create_token("admin")
    return {"token": token}

@app.post("/api/visitor/start")
async def start_conversation(display_name: str = Form(...), db: Session = Depends(get_db)):
    visitor = Visitor(display_name=display_name)
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    conv = Conversation(visitor_id=visitor.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"conversation_id": conv.id, "visitor_id": visitor.id}

@app.get("/api/messages/{conversation_id}")
async def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
    return [{"sender": m.sender, "type": m.type, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs]

@app.get("/api/_admin/visitors")
async def admin_visitors(token: str = "", db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="token required")
    verify_token(token)
    rows = db.query(Conversation.visitor_id, Conversation.id).all()
    results = []
    for vid, cid in rows:
        visitor = db.query(Visitor).filter(Visitor.id == vid).first()
        if visitor:
            results.append({"id": visitor.id, "name": visitor.display_name, "conversationId": cid})
    return results

@app.post("/api/upload")
async def upload_file(conversation_id: int = Form(...), sender: str = Form(...), type: str = Form(...), file: UploadFile = File(...)):
    # Validate type and size
    if type == "image":
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="Invalid image type")
        folder = "img"
        maxsize = 5 * 1024 * 1024
    elif type == "audio":
        if file.content_type not in ["audio/mpeg", "audio/wav", "audio/mp3"]:
            raise HTTPException(status_code=400, detail="Invalid audio type")
        folder = "aud"
        maxsize = 10 * 1024 * 1024
    else:
        raise HTTPException(status_code=400, detail="Unsupported type")
    data = await file.read()
    if len(data) > maxsize:
        raise HTTPException(status_code=400, detail="File too large")
    ext = file.filename.split(".")[-1]
    fname = f"{uuid.uuid4().hex}.{ext}"
    fpath = os.path.join(MEDIA_ROOT, folder, fname)
    with open(fpath, "wb") as f:
        f.write(data)
    url = f"/media/{folder}/{fname}"
    db = SessionLocal()
    msg = Message(conversation_id=conversation_id, sender=sender, type=type, content=url)
    db.add(msg)
    db.commit()
    db.close()
    return {"url": url}

@app.get("/media/{folder}/{fname}")
async def get_media(folder: str, fname: str):
    path = os.path.join(MEDIA_ROOT, folder, fname)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)

@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(ws: WebSocket, conversation_id: int):
    await ws.accept()
    if conversation_id not in clients:
        clients[conversation_id] = set()
    clients[conversation_id].add(ws)
    try:
        while True:
            data = await ws.receive_json()
            sender = data.get("sender")
            content = data.get("content")
            type_ = data.get("type", "text")
            if not sender or (type_ == "text" and (not content or len(content) > 1024)):
                await ws.send_json({"error": "Invalid message"})
                continue
            db = SessionLocal()
            msg = Message(conversation_id=conversation_id, sender=sender, type=type_, content=content)
            db.add(msg)
            db.commit()
            db.close()
            for client in list(clients.get(conversation_id, [])):
                try:
                    await client.send_json({"sender": sender, "type": type_, "content": content})
                except Exception:
                    pass
    finally:
        clients[conversation_id].remove(ws)
        if not clients[conversation_id]:
            del clients[conversation_id]