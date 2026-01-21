const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- In-Memory Data Store ---
const signalHistory = [];
const tradeHistory = [];

// --- Helper Functions ---
const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'USDCAD'];
const basePrices = {
    'EURUSD': 1.0865,
    'GBPUSD': 1.2678,
    'USDJPY': 155.42,
    'AUDUSD': 0.6534,
    'USDCHF': 0.8876,
    'USDCAD': 1.3521,
};

const aiReasonings = {
    BUY: [
        "RSI oversold at 28 with bullish divergence on 4H timeframe. MACD histogram turning positive.",
        "Price testing strong support at 38.2% Fibonacci retracement. Volume profile indicates accumulation.",
        "Double bottom formation confirmed on 1H chart. Bullish engulfing candle at key support.",
        "Oversold conditions met with hidden bullish divergence. Smart money accumulation detected.",
        "Price bouncing off 200 EMA with strong bullish momentum. Institutional order flow positive.",
    ],
    SELL: [
        "RSI overbought at 74 with bearish divergence on 4H timeframe. MACD crossing below signal.",
        "Price rejected from 61.8% Fibonacci resistance. Distribution pattern forming.",
        "Head and shoulders pattern confirmed. Neckline break with volume confirmation.",
        "Overbought conditions with bearish engulfing at resistance. Smart money distribution phase.",
        "Triple top formation at key resistance. Momentum indicators showing weakness.",
    ],
};

const riskFactors = [
    "High volatility expected due to upcoming FOMC meeting.",
    "NFP data release in 2 hours - exercise caution.",
    "EUR/USD correlation with risk sentiment elevated.",
    "Low liquidity period - wider spreads expected.",
    "Central bank speech scheduled - potential volatility spike.",
    "Market positioning extremely one-sided - reversal risk.",
];

// --- Signal Verification Engine ---
function calculateSignalScore(signal) {
    let score = 0;
    const breakdown = {
        technical: 0,
        ai: 0,
        risk: 0,
        market: 0
    };

    // 1. Technical Confluence (Max 40)
    // Simulated check: if indicators align with action
    if (signal.indicators.trend === (signal.action === 'BUY' ? 'Upward' : 'Downward')) {
        score += 20;
        breakdown.technical += 20;
    }
    // RSI check
    const rsi = signal.indicators.rsi;
    if ((signal.action === 'BUY' && rsi < 40) || (signal.action === 'SELL' && rsi > 60)) {
        score += 10;
        breakdown.technical += 10;
    }
    // MACD confirmation (simplified)
    if (Math.random() > 0.3) {
        score += 10;
        breakdown.technical += 10;
    }

    // 2. AI Confidence (Max 30)
    // Directly map confidence to score portion
    const aiScore = Math.floor(signal.confidence * 0.3 * 100);
    score += aiScore;
    breakdown.ai = aiScore;

    // 3. Risk/Reward (Max 20)
    // Randomize for simulation
    const rrScore = Math.floor(Math.random() * 20);
    score += rrScore;
    breakdown.risk = rrScore;

    // 4. Market Conditions (Max 10)
    const marketScore = Math.floor(Math.random() * 10);
    score += marketScore;
    breakdown.market = marketScore;

    // Determine verification level
    let level = 'LOW';
    if (score >= 80) level = 'HIGH';
    else if (score >= 50) level = 'MEDIUM';

    return {
        score,
        level,
        breakdown,
        verified: score >= 80,
        timestamp: new Date().toISOString()
    };
}

function generateSignal() {
    const symbol = symbols[Math.floor(Math.random() * 3)]; // Focus on majors
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const confidence = (Math.random() * 0.2 + 0.75); // 75% - 95%
    const basePrice = basePrices[symbol] || 1.0;
    const price = (basePrice + (Math.random() - 0.5) * 0.005).toFixed(5);

    const reasoning = aiReasonings[action][Math.floor(Math.random() * aiReasonings[action].length)];
    const risk = riskFactors[Math.floor(Math.random() * riskFactors.length)];

    const indicators = {
        rsi: Math.floor(action === 'BUY' ? Math.random() * 20 + 20 : Math.random() * 20 + 65),
        macd: action === 'BUY' ? 'Bullish Cross' : 'Bearish Cross',
        trend: action === 'BUY' ? 'Upward' : 'Downward',
    };

    const signal = {
        id: Date.now(),
        symbol: symbol.slice(0, 3) + '/' + symbol.slice(3),
        action,
        confidence: parseFloat(confidence.toFixed(2)),
        price,
        timestamp: new Date().toISOString(),
        ai_reasoning: reasoning,
        risk_factors: risk,
        indicators,
    };

    // Calculate Verification Score
    signal.verification = calculateSignalScore(signal);

    return signal;
}

function generateTickerData() {
    return Object.entries(basePrices).map(([symbol, basePrice]) => {
        const change = (Math.random() - 0.5) * 0.002;
        const newPrice = basePrice + change;
        const changePercent = ((change / basePrice) * 100).toFixed(2);

        return {
            symbol: symbol.slice(0, 3) + '/' + symbol.slice(3),
            price: newPrice.toFixed(symbol === 'USDJPY' ? 2 : 5),
            change: `${parseFloat(changePercent) >= 0 ? '+' : ''}${changePercent}%`,
            positive: parseFloat(changePercent) >= 0,
        };
    });
}

// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send initial data
    socket.emit('ticker-update', generateTickerData());
    socket.emit('signal-history', signalHistory.slice(-10));

    // Signal stream (every 5-15 seconds for realistic feel)
    const signalInterval = setInterval(() => {
        if (Math.random() > 0.4) { // 60% chance of signal
            const signal = generateSignal();
            signalHistory.push(signal);
            if (signalHistory.length > 100) signalHistory.shift();

            socket.emit('fx-signal', signal);
            console.log(`📊 Signal emitted: ${signal.action} ${signal.symbol} @ ${signal.price}`);
        }
    }, Math.random() * 5000 + 5000); // 5-10 seconds

    // Ticker updates (every 2 seconds)
    const tickerInterval = setInterval(() => {
        socket.emit('ticker-update', generateTickerData());
    }, 2000);

    // Handle trade execution request
    socket.on('execute-trade', (tradeData) => {
        console.log('📈 Trade execution requested:', tradeData);

        // Simulate execution delay
        setTimeout(() => {
            const executedTrade = {
                ...tradeData,
                executedAt: new Date().toISOString(),
                status: 'filled',
                executionPrice: tradeData.price,
            };

            tradeHistory.push(executedTrade);
            socket.emit('trade-executed', executedTrade);
            console.log('✅ Trade executed:', executedTrade);
        }, 500);
    });

    socket.on('disconnect', () => {
        clearInterval(signalInterval);
        clearInterval(tickerInterval);
        console.log('❌ Client disconnected:', socket.id);
    });
});

// --- REST API Endpoints ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        connections: io.engine.clientsCount,
    });
});

app.get('/api/signals', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(signalHistory.slice(-limit));
});

app.get('/api/trades', (req, res) => {
    res.json(tradeHistory);
});

app.get('/api/ticker', (req, res) => {
    res.json(generateTickerData());
});

// --- Server Start ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🚀 FX Analyzer Bridge Server running on port ${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log(`   REST API:  http://localhost:${PORT}/api/health\n`);
});
