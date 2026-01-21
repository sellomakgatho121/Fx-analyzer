# 🚀 FX Analyzer Pro

> **Institutional-grade FX analysis and trading signals powered by Google Gemini AI**

![FX Analyzer Pro](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A premium, real-time Forex analysis application featuring AI-powered signal generation, TradingView-style charts, and MT5 integration capabilities.

## ✨ Features

### 🎨 Premium UI/UX
- **Deep Neo Design System** - Futuristic dark theme with neon accents
- **Animated Components** - Smooth micro-interactions with Framer Motion
- **Responsive Layout** - Mobile-first design approach
- **Real-time Ticker** - Smooth scrolling FX price updates

### 📊 Advanced Analytics
- **TradingView-style Charts** - Candlestick charts using Lightweight Charts v5
- **AI-Powered Signals** - Google Gemini Flash integration for market analysis
- **Multi-indicator TA** - RSI, MACD, SMA, EMA analysis
- **Confidence Scoring** - AI confidence levels for each signal

### ⚡ Real-time Features
- **WebSocket Streaming** - Live price and signal updates
- **Trade Execution Panel** - Advanced SL/TP calculators
- **Risk Management** - Position sizing and drawdown monitoring
- **Trade History** - Filterable performance tracking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Framer Motion |
| **Charts** | Lightweight Charts v5 |
| **Styling** | Vanilla CSS with custom design tokens |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express, Socket.io |
| **Real-time** | WebSocket |
| **AI** | Google Gemini Flash API |
| **Broker** | MetaTrader 5 Python API |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fx-analyzer.git
cd fx-analyzer
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

4. **Install Python Dependencies**
```bash
cd ../engine
pip install -r requirements.txt
```

5. **Configure Environment**
Create `engine/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

**Start Backend Server** (Terminal 1)
```bash
cd backend
node server.js
```
Server runs on `http://localhost:4000`

**Start Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

**Optional: Start Python Engine** (Terminal 3)
```bash
cd engine
python llm_analyzer.py
```

## 📁 Project Structure

```
fx-analyzer/
├── Docs/                    # Documentation
│   ├── PRD.md              # Product Requirements
│   ├── Project_Structure.md # Architecture
│   └── UI_UX_System.md     # Design System
├── frontend/                # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   └── styles/         # Global CSS
│   └── package.json
├── backend/                 # Node.js WebSocket Server
│   ├── server.js           # Main server file
│   └── package.json
└── engine/                  # Python Analysis Engine
    ├── analyzer.py         # Technical analysis
    ├── llm_analyzer.py     # AI reasoning
    ├── executor.py         # MT5 integration
    └── requirements.txt
```

## 🎨 Components

| Component | Description |
|-----------|-------------|
| `TickerBar` | Animated scrolling FX prices |
| `CandlestickChart` | Real-time trading chart |
| `SignalCard` | AI signal with reasoning |
| `TradePanel` | Trade setup & risk calculator |
| `HistoryTable` | Performance tracking |
| `StatsCard` | Animated statistics |

## 🔌 API Endpoints

### REST API
- `GET /api/health` - Server health check
- `GET /api/signals` - Recent signals history
- `GET /api/trades` - Trade history
- `GET /api/ticker` - Current ticker prices

### WebSocket Events
- `fx-signal` - New trading signal
- `ticker-update` - Price updates
- `execute-trade` - Trade execution request
- `trade-executed` - Execution confirmation

## 🔐 Environment Variables

### Backend
No environment variables required for demo mode.

### Python Engine
```env
GEMINI_API_KEY=your_api_key  # Required for AI analysis
```

Get your API key: [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🎯 Roadmap

- [ ] Real market data integration (Alpha Vantage, Yahoo Finance)
- [ ] MT5 live trading connection
- [ ] Multi-timeframe analysis dashboard
- [ ] Mobile app (React Native)
- [ ] Backtesting engine
- [ ] Social trading features
- [ ] Custom indicator builder

## 📸 Screenshots

> *Add screenshots of your application here*

## ⚠️ Disclaimer

**This software is for educational purposes only. DO NOT use this for live trading without proper testing and risk management. Trading forex carries substantial risk of loss and is not suitable for all investors.**

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, React, and Google Gemini AI**
