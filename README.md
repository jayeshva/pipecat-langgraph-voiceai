# IntelliForm AI

IntelliForm AI is a full-stack AI-powered document digitization and citizen form assistant platform.

## 📁 Repository Structure

```text
intelliform-ai/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS frontend app
│   ├── src/              # React components, pages, and types
│   ├── index.html        # SPA HTML entry point
│   ├── vite.config.ts    # Vite configuration with /api proxy
│   └── package.json      # Frontend package configuration & dependencies
│
├── backend/              # Node.js + Express + Google Gemini AI backend API
│   ├── src/
│   │   └── server.ts     # Express server handling /api/analyze-form & /api/chat-assistant
│   ├── .env.example      # Environment variables template (GEMINI_API_KEY)
│   └── package.json      # Backend package configuration & dependencies
│
└── package.json          # Root workspace orchestrator
```

## 🚀 Quick Start

### 1. Install Dependencies

Install all dependencies across workspaces from the root directory:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in `backend/`:

```bash
cp backend/.env.example backend/.env
```

Add your Gemini API key in `backend/.env`:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 3. Run Development Mode

Run both Frontend & Backend concurrently from the root directory:

```bash
npm run dev
```

Or run them individually:

* **Frontend Dev Server** (runs on `http://localhost:5173`):
  ```bash
  npm run dev:frontend
  ```

* **Backend Dev Server** (runs on `http://localhost:3000`):
  ```bash
  npm run dev:backend
  ```

### 4. Build & Production

To build both frontend and backend for production:

```bash
npm run build
```

To start the production backend server:

```bash
npm start
```
