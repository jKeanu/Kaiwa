[![kaiwa_readme_image](https://github.com/user-attachments/assets/8ce75b45-94c6-426d-aa28-e1c069a0235c)](https://kaiwachat.com)

# Kaiwa - Real-Time Chat Application
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A real-time chat app where users can message friends privately or in groups, customize their profiles, and securely reset passwords via email. The platform supports live notifications, friend management, and profile picture uploads, delivering a seamless messaging experience mirroring modern chat applications.

> ℹ️ This project includes an optional Redis-based user presence feature (see bottom of README).

## 🌐 Live Demo  
**➤ https://kaiwachat.com**

## ✨ Features  
- **🔐 JWT Authentication** – Secure login/register with refresh token-based auth.  
- **💬 Real-time messaging** – Instant updates via WebSockets (Socket.io).  
- **👥 Friend System** – Add/remove friends, send requests.  
- **🗨️ Group & Private Chats** – Create rooms or DM users.  
- **🖼️ Profile Management** – Update names, passwords, and **profile pictures** (AWS S3 + CloudFront).  
- **🔑 Password Reset** – Token sent via email for security.  

## 💻 Tech Stack  
- **Frontend**: React, TypeScript, Vite  
- **Backend**: Node.js, Express, REST API, Socket.io  
- **Styling**: SASS
- **Database**: MongoDB  
- **Cloud**:  
  - **AWS**: S3, CloudFront, CloudWatch, Route 53  
  - **Google Cloud**: Memorystore (Redis), Compute Engine  
- **Utilities**: Mailjet, Postman  

## 🚀 Quick Start
### Prerequisites
- Node.js (v18+)  
- MongoDB Atlas  
- AWS Account (for S3/CloudFront/CloudWatch)
- Sentry Account (for front-end error monitoring)
- SMTP/Mailjet for emails

### ⚙️ Configuration
Environment templates:
- Frontend: `client/.env.example` → `client/.env`
- Backend: `server/.env.example` → `server/.env`

### 🛠️ Installation
```bash
git clone https://github.com/jKeanu/Kaiwa.git
cd Kaiwa

# Frontend
cd client && npm install && npm run dev

# Backend (in new terminal)
cd server && npm install && npm run dev
```

## 🐳 Running with Docker

### Prerequisites
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 📦 Development
```bash
npm run docker:dev
```
This will:
- Run the Vite + React frontend at [http://localhost:5173](http://localhost:5173)
- Run the Express + Socket.IO backend at [http://localhost:3001](http://localhost:3001)


## Real-Time User Status (Redis)

This app originally supported real-time user presence tracking using Redis (e.g., online/offline status in chat). Due to the high cost of running Redis in production environments like Google Cloud Memorystore, this feature is **disabled in the main branch**.

➡️ To see the full implementation, switch to the [`feature/user-status-redis`](https://github.com/jKeanu/kaiwa/tree/feature/user-status-redis) branch.
