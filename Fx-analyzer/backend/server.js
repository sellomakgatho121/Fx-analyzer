const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const zmq = require('zeromq');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// --- Database Connection ---
const dbPath = path.resolve(__dirname, '../fx_analyzer.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('📁 Connected to SQLite database:', dbPath);
});

// DB Helpers (Promisified)
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});

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

// --- ZeroMQ Subscriber (Python Bridge) ---
async function startZMQ() {
    const sock = new zmq.Subscriber();

    try {
        sock.connect("tcp://127.0.0.1:5555");
        sock.subscribe("signal");
        sock.subscribe("ticker");
        console.log("🔌 Connected to Python Engine via ZeroMQ");

        for await (const [topic, message] of sock) {
            const topicStr = topic.toString();
            const msgStr = message.toString();

            try {
                const data = JSON.parse(msgStr);

                if (topicStr === 'signal') {
                    // Signal is already stored in DB by Python
                    // Just emit to frontend for live updates
                    io.emit('fx-signal', data);
                    console.log(`📊 [PY-SIGNAL] ${data.symbol} ${data.action} @ ${data.price}`);
                } else if (topicStr === 'ticker') {
                    if (basePrices[data.symbol.replace('/', '')]) {
                        basePrices[data.symbol.replace('/', '')] = data.price;
                    }
                }
            } catch (e) {
                console.error("Error parsing ZMQ message:", e);
            }
        }
    } catch (err) {
        console.error("ZMQ Connection Error:", err);
    }
}

startZMQ();

// --- WebSocket Connection Handling ---
io.on('connection', async (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send initial data
    socket.emit('ticker-update', generateTickerData());

    // Fetch recent history from DB
    try {
        const rows = await dbAll('SELECT * FROM signals ORDER BY timestamp DESC LIMIT 10');
        // Transform DB rows back to API format (merging raw_data if available)
        const history = rows.map(r => {
            try {
                return { ...JSON.parse(r.raw_data), id: r.id };
            } catch (e) {
                return r; // Fallback
            }
        });
        socket.emit('signal-history', history.reverse()); // Frontend expects oldest -> newest usually
    } catch (e) {
        console.error("Error fetching history:", e);
    }

    const tickerInterval = setInterval(() => {
        socket.emit('ticker-update', generateTickerData());
    }, 2000);

    // --- Risk Management Settings ---
    let riskSettings = {
        maxDailyDrawdown: 500, // USD
        maxOpenPositions: 3,
        maxRiskPerTrade: 2, // Percent
        tradingEnabled: true
    };

    // Calculate current stats from DB
    async function getDailyStats() {
        const today = new Date().toISOString().split('T')[0];
        try {
            // Need to store PL in trades table properly. 
            // The table schema has: pl REAL check database.py
            const trades = await dbAll("SELECT pl, status FROM trades WHERE timestamp LIKE ? || '%'", [today]);

            const profitLoss = trades.reduce((acc, t) => acc + (t.pl || 0), 0);
            const openPositions = trades.filter(t => t.status === 'open').length; // Check 'open' casing in DB logic

            return { profitLoss, openPositions };
        } catch (e) {
            console.error("Stats DB Error:", e);
            return { profitLoss: 0, openPositions: 0 };
        }
    }

    // Handle trade execution request
    socket.on('execute-trade', async (tradeData) => {
        console.log('📈 Trade execution requested:', tradeData);

        // 1. RISK SHIELD CHECK
        if (!riskSettings.tradingEnabled) {
            socket.emit('trade-rejected', { reason: 'Trading is globally disabled via Risk Shield.' });
            return;
        }

        const stats = await getDailyStats();

        // Check Max Open Positions (Simulated)
        // With DB, we could count real open positions. For now, trust stats.
        if (stats.openPositions >= riskSettings.maxOpenPositions) {
            socket.emit('trade-rejected', { reason: `Max open positions (${riskSettings.maxOpenPositions}) reached.` });
            return;
        }

        // Check Daily Drawdown
        if (stats.profitLoss <= -riskSettings.maxDailyDrawdown) {
            socket.emit('trade-rejected', { reason: `Daily drawdown limit ($${riskSettings.maxDailyDrawdown}) reached.` });
            return;
        }

        // Simulate execution delay
        setTimeout(async () => {
            // Simulated P/L for the trade (Random win/loss for history tracking)
            const isWin = Math.random() > 0.4; // 60% win rate
            const tradePL = isWin ? (Math.random() * 50 + 10) : -(Math.random() * 30 + 10);
            const timestamp = new Date().toISOString();

            const executedTrade = {
                ...tradeData,
                executedAt: timestamp,
                status: 'closed', // Auto-close for simulation
                executionPrice: tradeData.price,
                pl: parseFloat(tradePL.toFixed(2)),
                plType: isWin ? 'profit' : 'loss'
            };

            // Store in DB
            try {
                // Table: trades (timestamp, symbol, action, entry_price, status) + need to add PL column in DB schema?
                // database.py schema: pl REAL exists.
                await dbRun(`
                   INSERT INTO trades (timestamp, symbol, action, entry_price, pl, status)
                   VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    timestamp,
                    executedTrade.symbol,
                    executedTrade.action,
                    executedTrade.price,
                    executedTrade.pl,
                    executedTrade.status
                ]);

                socket.emit('trade-executed', executedTrade);
                console.log('✅ Trade executed & stored:', executedTrade);

                // Emit updated stats
                io.emit('risk-stats-update', await getDailyStats());

            } catch (e) {
                console.error("DB Insert Error:", e);
                socket.emit('trade-rejected', { reason: 'Database error during execution.' });
            }
        }, 500);
    });

    // Handle Risk Settings Updates from Frontend
    socket.on('update-risk-settings', (newSettings) => {
        riskSettings = { ...riskSettings, ...newSettings };
        console.log('🛡️ Risk Settings Updated:', riskSettings);
        io.emit('risk-settings-updated', riskSettings);
    });

    // --- LLM Multi-Model Handling ---
    const zmqReq = new zmq.Request();
    let zmqReqConnected = false;

    async function sendCommand(payload) {
        if (!zmqReqConnected) {
            console.log("Connecting to Engine Command Socket...");
            zmqReq.connect("tcp://127.0.0.1:5556");
            zmqReqConnected = true;
        }
        try {
            await zmqReq.send(JSON.stringify(payload));
            const [result] = await zmqReq.receive();
            return JSON.parse(result.toString());
        } catch (e) {
            console.error("ZMQ Command Failed:", e);
            return { status: "error", message: "Engine Unreachable" };
        }
    }

    socket.on('get-llm-models', async () => {
        const result = await sendCommand({ cmd: 'GET_MODELS' });
        if (result.status === 'ok') {
            socket.emit('llm-models-list', result.models);
        }
    });

    socket.on('switch-llm-model', async (modelName) => {
        console.log('Switching LLM to:', modelName);
        const result = await sendCommand({ cmd: 'SET_LLM_MODEL', model: modelName });

        // Notify all clients of the change
        if (result.status === 'ok') {
            io.emit('notification', { type: 'success', title: 'Model Switched', message: result.message });
            io.emit('model-changed', modelName);
        } else {
            socket.emit('notification', { type: 'error', title: 'Switch Failed', message: result.message });
        }
    });

    socket.on('disconnect', () => {
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
        db: db ? 'connected' : 'disconnected'
    });
});

app.get('/api/signals', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    try {
        const rows = await dbAll('SELECT * FROM signals ORDER BY timestamp DESC LIMIT ?', [limit]);
        const signals = rows.map(r => {
            try {
                return { ...JSON.parse(r.raw_data), id: r.id };
            } catch (e) { return r; }
        });
        res.json(signals);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/trades', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM trades ORDER BY timestamp DESC LIMIT 50');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/ticker', (req, res) => {
    res.json(generateTickerData());
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalTradesObj = await dbAll('SELECT COUNT(*) as count FROM trades');
        const totalTrades = totalTradesObj[0].count;

        const winningTradesObj = await dbAll('SELECT COUNT(*) as count FROM trades WHERE pl > 0');
        const winningTrades = winningTradesObj[0].count;

        const totalProfitObj = await dbAll('SELECT SUM(pl) as total FROM trades');
        const totalProfit = totalProfitObj[0].total || 0;

        const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;

        res.json({
            totalTrades,
            winningTrades,
            totalProfit: totalProfit.toFixed(2),
            winRate: parseFloat(winRate)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Server Start ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🚀 FX Analyzer Bridge Server running on port ${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log(`   REST API:  http://localhost:${PORT}/api/health\n`);
});
