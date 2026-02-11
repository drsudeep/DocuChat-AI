from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import sqlite3
import hashlib
import jwt
import shutil
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
import json
from transformers import pipeline

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
UPLOAD_DIR = ROOT_DIR / 'uploads'
VECTOR_STORE_DIR = ROOT_DIR / 'vector_stores'
DB_PATH = ROOT_DIR / 'chatbot.db'

UPLOAD_DIR.mkdir(exist_ok=True)
VECTOR_STORE_DIR.mkdir(exist_ok=True)

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len
)

qa_model = None

def get_qa_model():
    global qa_model
    if qa_model is None:
        qa_model = pipeline("text2text-generation", model="google/flan-t5-small")
    return qa_model

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        created_at TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        chunk_count INTEGER DEFAULT 0,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sources TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    
    conn.commit()
    conn.close()

init_db()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    uploaded_at: str

class ChatRequest(BaseModel):
    question: str
    document_ids: Optional[List[str]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]

class ChatHistoryItem(BaseModel):
    id: str
    question: str
    answer: str
    sources: List[dict]
    created_at: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    return payload

@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE email = ?', (request.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    password_hash = hash_password(request.password)
    created_at = datetime.now(timezone.utc).isoformat()
    
    cursor.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (user_id, request.email, password_hash, request.full_name, 'user', created_at)
    )
    conn.commit()
    conn.close()
    
    token = create_token(user_id, request.email, 'user')
    return AuthResponse(
        token=token,
        user={'id': user_id, 'email': request.email, 'full_name': request.full_name, 'role': 'user'}
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?', (request.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(request.password, user[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user[0], user[1], user[4])
    return AuthResponse(
        token=token,
        user={'id': user[0], 'email': user[1], 'full_name': user[3], 'role': user[4]}
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, full_name, role FROM users WHERE id = ?', (current_user['user_id'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {'id': user[0], 'email': user[1], 'full_name': user[2], 'role': user[3]}

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

@api_router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if file.content_type not in ['application/pdf', 'text/plain']:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    doc_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{doc_id}{file_ext}"
    
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    if file.content_type == 'application/pdf':
        text = extract_text_from_pdf(str(file_path))
    else:
        text = extract_text_from_txt(str(file_path))
    
    chunks = text_splitter.split_text(text)
    
    embeddings = embedding_model.encode(chunks)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    
    user_vector_dir = VECTOR_STORE_DIR / current_user['user_id']
    user_vector_dir.mkdir(exist_ok=True)
    
    faiss.write_index(index, str(user_vector_dir / f"{doc_id}.faiss"))
    
    with open(user_vector_dir / f"{doc_id}_chunks.pkl", 'wb') as f:
        pickle.dump(chunks, f)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        '''INSERT INTO documents (id, user_id, filename, file_path, file_type, file_size, chunk_count, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (doc_id, current_user['user_id'], file.filename, str(file_path), 
         file.content_type, file.size or 0, len(chunks), datetime.now(timezone.utc).isoformat())
    )
    conn.commit()
    conn.close()
    
    return DocumentResponse(
        id=doc_id,
        filename=file.filename,
        file_type=file.content_type,
        file_size=file.size or 0,
        chunk_count=len(chunks),
        uploaded_at=datetime.now(timezone.utc).isoformat()
    )

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        'SELECT id, filename, file_type, file_size, chunk_count, uploaded_at FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC',
        (current_user['user_id'],)
    )
    docs = cursor.fetchall()
    conn.close()
    
    return [
        DocumentResponse(
            id=doc[0],
            filename=doc[1],
            file_type=doc[2],
            file_size=doc[3],
            chunk_count=doc[4],
            uploaded_at=doc[5]
        )
        for doc in docs
    ]

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT file_path FROM documents WHERE id = ? AND user_id = ?', (doc_id, current_user['user_id']))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    
    cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    conn.commit()
    conn.close()
    
    file_path = Path(doc[0])
    if file_path.exists():
        file_path.unlink()
    
    user_vector_dir = VECTOR_STORE_DIR / current_user['user_id']
    faiss_path = user_vector_dir / f"{doc_id}.faiss"
    chunks_path = user_vector_dir / f"{doc_id}_chunks.pkl"
    
    if faiss_path.exists():
        faiss_path.unlink()
    if chunks_path.exists():
        chunks_path.unlink()
    
    return {'message': 'Document deleted successfully'}

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_vector_dir = VECTOR_STORE_DIR / current_user['user_id']
    
    if not user_vector_dir.exists():
        raise HTTPException(status_code=400, detail="No documents uploaded yet")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if request.document_ids:
        doc_ids = request.document_ids
    else:
        cursor.execute('SELECT id FROM documents WHERE user_id = ?', (current_user['user_id'],))
        doc_ids = [row[0] for row in cursor.fetchall()]
    
    if not doc_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="No documents available")
    
    query_embedding = embedding_model.encode([request.question])[0]
    
    all_results = []
    for doc_id in doc_ids:
        faiss_path = user_vector_dir / f"{doc_id}.faiss"
        chunks_path = user_vector_dir / f"{doc_id}_chunks.pkl"
        
        if not faiss_path.exists() or not chunks_path.exists():
            continue
        
        index = faiss.read_index(str(faiss_path))
        with open(chunks_path, 'rb') as f:
            chunks = pickle.load(f)
        
        cursor.execute('SELECT filename FROM documents WHERE id = ?', (doc_id,))
        doc_name = cursor.fetchone()[0]
        
        distances, indices = index.search(np.array([query_embedding]).astype('float32'), k=min(3, len(chunks)))
        
        for i, idx in enumerate(indices[0]):
            all_results.append({
                'chunk': chunks[idx],
                'score': float(distances[0][i]),
                'document': doc_name,
                'doc_id': doc_id
            })
    
    conn.close()
    
    if not all_results:
        raise HTTPException(status_code=400, detail="No relevant information found")
    
    all_results.sort(key=lambda x: x['score'])
    top_results = all_results[:5]
    
    context = "\n\n".join([r['chunk'] for r in top_results])
    prompt = f"""Based on the following context, answer the question.

Context:
{context}

Question: {request.question}

Answer:"""
    
    model = get_qa_model()
    answer = model(prompt, max_length=200, do_sample=False)[0]['generated_text']
    
    sources = [{
        'document': r['document'],
        'excerpt': r['chunk'][:200] + '...' if len(r['chunk']) > 200 else r['chunk']
    } for r in top_results[:3]]
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    chat_id = str(uuid.uuid4())
    cursor.execute(
        'INSERT INTO chat_history (id, user_id, question, answer, sources, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (chat_id, current_user['user_id'], request.question, answer, json.dumps(sources), datetime.now(timezone.utc).isoformat())
    )
    conn.commit()
    conn.close()
    
    return ChatResponse(answer=answer, sources=sources)

@api_router.get("/chat/history", response_model=List[ChatHistoryItem])
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        'SELECT id, question, answer, sources, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        (current_user['user_id'],)
    )
    history = cursor.fetchall()
    conn.close()
    
    return [
        ChatHistoryItem(
            id=h[0],
            question=h[1],
            answer=h[2],
            sources=json.loads(h[3]) if h[3] else [],
            created_at=h[4]
        )
        for h in history
    ]

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