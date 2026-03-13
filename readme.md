# 🤖 TALKMATE - AI Chatbot SaaS – Backend

TalkMate is a production-ready, scalable backend system for a Web-based AI Chatbot application with authentication, role-based access control, real-time AI streaming, file upload support (AWS S3), and admin monitoring.

---

# 🚀 Tech Stack

* **Node.js** – Non-blocking runtime for handling concurrent chat requests
* **Express.js** – Lightweight and scalable API framework
* **MongoDB** – Flexible NoSQL database for chat storage
* **Mongoose** – Schema-based ODM for structured data modeling
* **JWT** – Secure stateless authentication
* **Passport (Google OAuth)** – Social login support
* **AWS S3** – Scalable cloud file storage
* **Multer + multer-s3** – File upload middleware
* **Server-Sent Events (SSE)** – Real-time AI response streaming
* **OpenAI API** – AI response generation
* **Redis** – Rate limiting & caching
* **Helmet** – Security headers protection
* **Winston** – Structured logging for production monitoring
* **CORS** – Cross-origin request handling

---

# 🏗 System Architecture

Frontend (React)  
⬇  
Express API  
⬇  
Authentication (JWT / Passport)  
⬇  
Chat Controller  
⬇  
OpenAI API (Streaming via SSE)  
⬇  
MongoDB (Conversation & Messages)  
⬇  
AWS S3 (File Storage)  

---

# 🔐 Authentication & Authorization

* Email & Password registration/login
* Google OAuth login
* JWT-based protected routes
* Role-based access control (user, admin, superadmin)
* Account status management (active / disabled)

---

# 💬 Chat System Features

* Real-time AI streaming using SSE
* Persistent conversation history
* Resume previous conversations
* Optional conversation naming
* Typing/loading indicators support
* Error handling for AI/API failures

---

# 📂 File Upload System

* Files uploaded via Multer
* Stored securely in AWS S3
* Metadata stored in MongoDB
* Optional private access via signed URLs
* Linked to conversation or specific message

---

# 📊 Admin Capabilities

* View total users
* View total chats
* Enable/disable accounts
* Basic usage monitoring

---

# 🗂 Database Design

## User

* name
* email (unique)
* passwordHash
* role (user | admin | superadmin)
* accountStatus
* lastLogin
* timestamps

## Conversation

* userId (reference)
* title (optional)
* timestamps

## Message

* conversationId (reference)
* sender (user | bot)
* content
* fileId (optional)
* timestamps

## FileUpload

* userId (reference)
* conversationId (optional reference)
* messageId (optional reference)
* fileType (pdf | image | text)
* fileUrl (AWS S3)
* timestamps

---

# 🛡 Security Considerations

* Environment variables for all secrets
* Helmet for HTTP security headers
* Rate limiting to prevent abuse
* Structured logging with Winston
* Role-based middleware protection
* Secure S3 access (private bucket + signed URLs)

---

# 📦 Environment Variables

```
PORT=
MONGO_URI=
JWT_SECRET=
OPENAI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
REDIS_URL=
```

---

# 🎯 Project Goals

* Build a scalable AI chatbot backend
* Follow production-level backend architecture
* Maintain clean separation of concerns
* Ensure security, scalability, and maintainability

---

# 📈 Future Improvements

* Subscription & billing integration
* Advanced analytics dashboard
* Token usage tracking
* Message search & filtering
* Soft delete & audit logs

---

# 👨‍💻 Author

Developed as a real-world production backend system for office use, following scalable SaaS architecture principles.
