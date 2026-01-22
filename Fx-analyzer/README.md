# FX Analyzer Pro

Institutional-grade algorithmic trading terminal powered by Google Gemini AI.

## Features

- **Multi-Factor Analysis**: Combines Technical Indicators (RSI, MACD) with LLM-driven reasoning.
- **Risk Shield**: Real-time risk management (Daily Drawdown limits, Max Position controls).
- **Zero-Latency Execution**: Direct integration with Python engine via ZeroMQ.
- **Data Persistence**: SQLite database stores full signal history and trade logs.
- **Robustness**: Automatic rate-limit handling and caching for AI usage.

## Architecture

- **Frontend**: Next.js, TailwindCSS, Fraim Motion (UI)
- **Backend**: Node.js, Express, Socket.IO (Orchestration & Persistence)
- **Engine**: Python, Pandas, Gemini API (Analysis Core)
- **Database**: SQLite (Local storage)

## Prerequisites

- Node.js (v18+)
- Python (3.9+)
- Gemini API Key

## Quick Start

1. **Install Dependencies**:

   ```powershell
   # Root
   cd frontend; npm install
   cd ../backend; npm install
   
   # Python (Create venv first)
   cd ..
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment Setup**:
   - Ensure `GEMINI_API_KEY` is set in your environment variables.

3. **Run All Services**:

   ```powershell
   .\start.ps1
   ```

   This will launch three separate terminal windows for the Backend, Frontend, and Python Engine.

## Manual Startup

If you prefer running services individually:

1. **Backend**: `cd backend && npm start` (Port 4000)
2. **Frontend**: `cd frontend && npm run dev` (Port 3000)
3. **Engine**: `.\.venv\Scripts\python engine/bridge.py`

## Usage

- Access the dashboard at `http://localhost:3000`.
- Signals will appear automatically in the "Live Signals" section.
- Click "EXECUTE" to simulate a trade (validated by Risk Shield).
- View performance metrics in the "History" tab.
