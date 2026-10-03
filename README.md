# CareFlow — Smart Patient Appointment & Live Queue Management

CareFlow is a full-stack healthcare appointment and real-time hospital queue management application designed for seamless patient navigation, multilingual voice assistance powered by Sarvam AI, and persistent data storage powered by MongoDB Atlas.

---

## Features

- **Doctor & Department Discovery**: Multi-specialty directory with language, department, and availability filters.
- **Appointment Booking**: Real-time slot reservation with conflict detection, token generation, and wait time calculation.
- **Hospital Arrival Check-in**: One-click arrival status updates synchronized directly with hospital queue counters.
- **Live Queue Tracking**: Real-time token progress, patients ahead, doctor status, and estimated wait times.
- **Indoor Hospital Navigation**: Step-by-step wayfinding across blocks, wings, floors, and consultation rooms.
- **Appointment Preparation**: Pre-consultation checklists, required medical reports, and department-specific guidelines.
- **Multilingual Voice Assistant**: Indic language conversational support powered server-side by Sarvam AI.
- **Senior Mode & Accessibility**: High-contrast, large touch targets, simplified layouts, and persistent settings.

---

## Vercel Deployment Guide

Deploy CareFlow to Vercel with zero-configuration serverless execution:

### 1. Database & AI Keys Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and database named `careflow`.
2. Obtain your MongoDB connection string (`MONGODB_URI`).
3. Obtain your [Sarvam AI](https://sarvam.ai) API key (`SARVAM_API_KEY`).

### 2. Deploy to Vercel
1. Push this repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Framework Preset to **Vite** (auto-detected).
4. Configure the environment variables in the Vercel project settings:
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/careflow?retryWrites=true&w=majority`
   - `SARVAM_API_KEY`: `your_sarvam_api_key_here`
5. Click **Deploy**.

### 3. Verification Post-Deployment
1. Verify the health check: `GET https://your-project.vercel.app/api/health`
2. Test doctor and department discovery on the homepage.
3. Test booking an appointment and receiving a token.
4. Test arrival check-in and live queue tracking.
5. Test multilingual voice/text search with Sarvam AI.

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run local development server (Express + Vite on Port 3000)
npm run dev

# Build for production
npm run build
```

---

## Environment Variables

| Variable | Description | Location |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string | Server-side only |
| `SARVAM_API_KEY` | Sarvam AI API key for NLU & STT | Server-side only |
| `PORT` | Local server port (default: 3000) | Local development only |
