# 🎓 OneDesk (AuraCampus) — Smart Campus Management System

An all-in-one Smart Campus management platform engineered with the **MERN** stack (MongoDB, Express, React, Node.js + Vite & TailwindCSS).

---

## ✨ Features

- **🔐 Role-Based Authentication & Profiles**:
  - Teacher and Student roles with custom onboarding.
  - Enrollment number & email login support.
  - Secure password reset flow with tokenized email links.
  - Profile management and password updates.

- **📍 Dynamic QR Attendance with GPS Geofencing**:
  - Real-time rotating dynamic QR codes to prevent screenshot sharing.
  - **Pimpri Chinchwad Polytechnic** GPS Geofence lock (`Lat: 18.6508, Lng: 73.7663`) within 500m radius.
  - Mobile-friendly quick-scan landing page (`/attend/:token`).
  - Live attendance monitoring, defaulter detection (< 75%), and automated PDF export.

- **📅 Conflict-Free Timetable Management**:
  - Interactive weekly schedule grid for students and faculty.
  - Real-time timeslot overlap prevention across teachers and classes.
  - Subject management with custom color tagging.

- **📝 Assignments & Submissions**:
  - Assignment publishing with due date alerts and document attachments.
  - Student text & file submission portal.
  - Teacher grading dashboard with feedback and submission analytics.

- **🧠 Quiz Center & Analytics**:
  - Multi-year, subject-wise timed quizzes.
  - Instant scoring with answer breakdown.
  - Faculty performance analytics with score distribution charts and PDF report export.

- **📢 Campus Notices & Broadcasts**:
  - Filter notices by audience (All Campus, Students Only, Faculty Only).
  - Background email delivery via transactional mailer.

- **🔍 Campus Lost & Found**:
  - Searchable community board for lost and found items.
  - Real-time resolution tagging.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS v4, Lucide Icons, Recharts, Sonner, jsPDF, Html5Qrcode
- **Backend**: Node.js, Express, MongoDB Native Driver, JWT, BcryptJS, Dotenv
- **Deployment**: Vercel / Netlify (Frontend) + Railway / Render (Backend) + MongoDB Atlas

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MONGO_URL, JWT_SECRET, and PORT in .env
npm start
```

### 2. Frontend Setup
```bash
# In the project root:
npm install
cp .env.example .env
# Set VITE_BACKEND_URL in .env
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 🌐 Deployment Guide

### Deploy Backend (e.g. Render / Railway)
1. Set Root Directory to `backend`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `MONGO_URL`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random secure string.
   - `NODE_PORT`: `8002` (or hosting default `$PORT`).
   - `FRONTEND_URL`: Your live frontend URL.

### Deploy Frontend (e.g. Vercel)
1. Connect this repository to Vercel.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variables:
   - `VITE_BACKEND_URL`: Your live backend API URL (e.g. `https://your-backend.railway.app`).

---

## 📄 License
MIT License. Created by Atharva Teli.
