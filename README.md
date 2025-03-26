<div align="center">
  <img src="https://github.com/user-attachments/assets/59acb2a0-3a0b-4535-9ca7-f41f25040107" style="border-radius:42px; max-width:90%; margin: 0 auto 44px;"/>
</div>

# Kaiwa - Real-Time Chat Application
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A real-time chat app where users can message friends privately or in groups, customize their profiles, and securely reset passwords via email. The platform supports live notifications, friend management, and profile picture uploads, delivering a seamless messaging experience mirroring modern chat applications.

## 🌐 Live Demo  
**➤ https://kaiwachat.com**

## 🚀 Quick Start
### Prerequisites
- Node.js (v18+)  
- MongoDB Atlas  
- AWS Account (for S3/CloudFront)  
- SMTP/Mailjet for emails

### ⚙️ Configuration
Environment templates:
- Frontend: `client/.env.example` → `client/.env`
- Backend: `server/.env.example` → `server/.env`

### 🛠️ Installation
```bash
git clone git@github.com:jKeanu/Kaiwa.git
cd Kaiwa

# Frontend
cd client && npm install && npm run dev

# Backend (in new terminal)
cd ../server && npm install && npm run dev
