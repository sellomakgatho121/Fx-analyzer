# PRD: FX Analyzer

## Goal Description
A high-performance Forex analysis application designed to provide accurate signals and precise order placement for MetaTrader 5 (MT5). The app aims to bridge the gap between complex analysis and seamless execution.

## System Requirements
- **Real-time Data Processing:** Low-latency streaming of FX pair data.
- **Signal Accuracy:** Multi-indicator technical analysis combined with **LLM-powered sentiment and pattern reasoning**.
- **Free Institutional Grade Analysis:** Leveraging free-tier Google Gemini Flash for high-context market reasoning.
- **Order Precision:** Direct integration with MT5 for millisecond-accurate execution.
- **User Interface:** Premium, futuristic dashboard with dynamic charts and real-time alerts.

## Tech Stack
- **Frontend:** Next.js, Vanilla CSS (Premium Aesthetics), Chart.js/HighCharts.
- **Backend:** Node.js (API Layer), Python (Analysis Engine & MT5 Integration).
- **LLM Provider:** Google Gemini Flash API (Free Tier).
- **Communication:** WebSockets for real-time updates.
- **Broker Integration:** MetaTrader 5 Python API.

## Roadmap
1. **Foundation:** Setup Next.js and Python environments.
2. **Analysis:** Implement Technical Analysis (TA) library in Python.
3. **Connectivity:** Establish MT5 connection and order placement logic.
4. **UI:** Build the Neon-style dashboard.
5. **Execution:** End-to-end signal-to-order flow testing.
