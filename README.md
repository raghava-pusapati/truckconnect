# 🚚 TruckConnect

<div align="center">

### Connecting Customers with Verified Truck Drivers Through a Secure & Scalable Logistics Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit-success?style=for-the-badge)](https://truckconnect-frontend.onrender.com/)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## 📖 About TruckConnect

TruckConnect is a **full-stack MERN logistics platform** that connects customers with verified truck drivers for seamless transportation services.

The platform enables customers to post transportation requirements while allowing truck drivers to register, upload verification documents, and manage their transportation requests. An admin panel ensures secure verification and approval workflows for maintaining platform reliability.

The project was built with scalability, security, and user experience in mind using modern web technologies.

---

# 🌐 Live Demo

## 🚀 https://truckconnect-frontend.onrender.com/

> **Note:** The project is hosted on **Render's free tier**, so the backend may take **30–60 seconds** to wake up during the first request.

---

# ✨ Features

## 👤 Customer Module

- Secure User Registration
- JWT Authentication
- Customer Login
- Post Transportation Requirements
- View Submitted Requests
- Manage Profile

---

## 🚛 Driver Module

- Driver Registration
- Secure Login
- Upload Verification Documents
- Profile Management
- Accept Transportation Requests
- View Assigned Loads

---

## 🛡️ Admin Module

- Driver Verification
- Approve / Reject Driver Applications
- View Registered Users
- Manage Platform Operations
- Monitor Uploaded Documents

---

## 🔐 Authentication

- JWT Authentication
- Protected Routes
- Password Encryption
- Secure API Access

---

## ☁️ Cloud Storage

- Cloudinary Integration
- Secure Image Upload
- Document Management

---

# 🛠️ Tech Stack

## Frontend

- React.js
- TypeScript
- Vite
- React Router DOM
- Axios

## Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication

## Database

- MongoDB
- Mongoose ODM

## Cloud Services

- Cloudinary

## Development Tools

- Git
- GitHub
- VS Code

---

# 🏗️ System Architecture

```text
                ┌─────────────────────────────┐
                │      React Frontend         │
                │     (TypeScript + Vite)     │
                └──────────────┬──────────────┘
                               │
                         REST API Requests
                               │
                ┌──────────────▼──────────────┐
                │      Express Backend        │
                │         Node.js API         │
                └──────────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         MongoDB         JWT Authentication   Cloudinary
         Database         Authorization       Image Storage
```

---

# 📂 Project Structure

```text
TruckConnect/

├── src/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── public/
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/raghava-pusapati/truckconnect.git

cd truckconnect
```

---

## Install Frontend Dependencies

```bash
npm install
```

---

## Install Backend Dependencies

```bash
cd backend

npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

# ▶️ Run the Project

## Start Frontend

```bash
npm run dev
```

---

## Start Backend

```bash
cd backend

npm run dev
```

---


---

# 🎯 Key Highlights

- ✅ MERN Stack Application
- ✅ JWT-Based Authentication
- ✅ Secure REST APIs
- ✅ MongoDB Integration
- ✅ Cloudinary Image Uploads
- ✅ Admin Approval Workflow
- ✅ Responsive User Interface
- ✅ Scalable Architecture

---

# 🚀 Future Enhancements

- 📍 Live GPS Tracking
- 💬 Customer & Driver Chat
- 🔔 Real-Time Notifications
- 💳 Online Payment Gateway
- 🤖 AI-Based Driver Recommendations
- 📱 Android & iOS Mobile Applications
- 📊 Analytics Dashboard

---

# 📚 Learning Outcomes

This project helped strengthen practical experience in:

- Full Stack Web Development
- MERN Stack
- REST API Development
- Authentication & Authorization
- MongoDB Schema Design
- Cloudinary Integration
- Backend Architecture
- Deployment & Hosting

---

# 🤝 Contributing

Contributions are welcome!

### Fork the repository

```bash
git fork
```

### Create a feature branch

```bash
git checkout -b feature/YourFeature
```

### Commit your changes

```bash
git commit -m "Added new feature"
```

### Push the branch

```bash
git push origin feature/YourFeature
```

### Create a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

## **Pusapati Raghavendra**

🎓 B.Tech – Computer Science (Data Science)

📧 Email: **23211a6797@bvrit.ac.in**

🔗 GitHub: **https://github.com/raghava-pusapati**

💼 LinkedIn: **https://linkedin.com/in/raghavendrapusapati**

---

<div align="center">

## ⭐ If you found this project helpful, please consider giving it a star!

### Thank you for visiting TruckConnect 🚚

</div>
