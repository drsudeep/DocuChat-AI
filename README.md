# DocuChatAI – Chat With Your PDF Using AI

A complete full-stack AI application that allows users to upload PDF documents and ask questions in natural language. The system extracts content from PDFs, performs semantic search using vector embeddings, and generates intelligent answers using NLP models.

---

##  Features

###  Authentication

* User Register & Login (JWT Based)
* Secure password hashing
* Protected API routes
* User-specific document storage

###  AI Document Q&A

* Upload and process PDF files
* Ask questions in natural language
* Context-aware answers from document
* Semantic search using embeddings
* Fast retrieval with FAISS vector DB

###  Document Processing

* PDF text extraction
* Automatic chunking
* Embedding generation
* Vector storage for quick search

### 💬 Chat Interface

* Interactive chat UI
* Question history
* Real-time responses
* Clean and simple design

---

##  Application Screenshots

### 1️⃣ Homepage

Main landing page of DocuChatAI where users can understand features and navigate to login or signup.

![](https://github.com/drsudeep/DocuChat-AI/blob/master/home%20page%201.png?raw=true)

![](`https://github.com/drsudeep/DocuChat-AI/blob/master/home%20page%202.png?raw=true)


---

### 2️⃣ Signup Page

New users can create an account with email and password.

![](https://github.com/drsudeep/DocuChat-AI/blob/master/signup%20page.png?raw=true)



---

### 3️⃣ Login Page

Secure authentication interface.

![](https://github.com/drsudeep/DocuChat-AI/blob/master/signin%20page.png?raw=true)

---

### 4️⃣ Upload PDF

Upload any document to analyze and chat with.

![](https://github.com/drsudeep/DocuChat-AI/blob/master/upload%20pdf%20page.png?raw=true)

---

### 5️⃣ Ask Questions

Interactive chat interface to ask queries from PDF.

![](https://github.com/drsudeep/DocuChat-AI/blob/master/ask%20question%20page.png?raw=true)

---

### 6️⃣ AI Response

Generated answer based on document context.

![](ttps://github.com/drsudeep/DocuChat-AI/blob/master/ai%20response%20page.png?raw=true)

---

##  Tech Stack

### Backend

* Python
* FastAPI
* Sentence-Transformers
* FAISS
* PyPDF
* SQLite
* JWT Authentication

### Frontend

* React JS
* Axios
* Tailwind CSS
* Context API

---

##  Installation

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 📂 Project Structure

```
DocuChatAI/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── chatbot.db
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── screenshots/
│   ├── homepage.png
│   ├── signup.png
│   ├── login.png
│   ├── upload.png
│   ├── chat.png
│   └── result.png
│
└── README.md
```

---

##  How It Works

1. User signs up and logs in
2. Uploads PDF document
3. System extracts text
4. Text converted to embeddings
5. Stored in FAISS vector DB
6. User asks question
7. AI finds relevant content
8. Answer generated from document

---

##  Future Enhancements

* Support for multiple PDFs
* OCR for scanned documents
* Multi-language support
* Voice input
* PDF summary generation
* Role-based access
* Cloud deployment

---

## About

DocuChatAI transforms static PDF documents into interactive knowledge bases, enabling students and professionals to get instant answers without manual searching.

---

## Languages

* JavaScript – Frontend
* Python – Backend
* HTML/CSS – UI


