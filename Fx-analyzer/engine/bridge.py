import asyncio
import zmq
import zmq.asyncio
import time
import json
import logging
from datetime import datetime
import pandas as pd
# Assuming running from root as python -m engine.bridge or setting PYTHONPATH
try:
    from engine.analyzer import TechnicalAnalyzer
    from engine.executor import MT5Executor
    from engine.orchestrator import MoEOrchestrator
    from engine.data_feed import DataFeed
    from engine.calendar_service import CalendarService
    from engine import database
except ImportError:
    # Fallback for running inside engine/ dir
    from analyzer import TechnicalAnalyzer
    from executor import MT5Executor
    from orchestrator import MoEOrchestrator
    from data_feed import DataFeed
    from calendar_service import CalendarService
    import database

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
ZMQ_PORT = 5555
SYMBOLS = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD',
    'BTCUSD', 'ETHUSD',
    'US30', 'US500',
    'AAPL', 'TSLA'
]

class AsyncEngineBridge:
    def __init__(self):
        self.context = zmq.asyncio.Context()
        self.socket = self.context.socket(zmq.PUB)
        self.socket.bind(f"tcp://*:{ZMQ_PORT}")
        logging.info(f"ZeroMQ Publisher bound to port {ZMQ_PORT}")
        
        self.analyzer = TechnicalAnalyzer()
        self.executor = MT5Executor()
        self.moe = MoEOrchestrator() # Replaces LLMAnalyzer
        self.data_feed = DataFeed()
        self.calendar = CalendarService()
        
        # Initialize Database
        database.init_db()

        # Command Socket (REP)
        self.cmd_socket = self.context.socket(zmq.REP)
        self.cmd_socket.bind("tcp://*:5556")
        
    async def listen_commands(self):
        """
        Listens for commands from Node.js interface async.
        """
        logging.info("Command Socket (REP) listening on 5556")
        while True:
            try:
                msg = await self.cmd_socket.recv_json()
                cmd = msg.get('cmd')
                
                response = {"status": "error", "message": "Unknown command"}
                
                if cmd == 'SET_LLM_MODEL':
                    # TODO: Implement dynamic runtime switching for specific agents
                    # For now, we just acknowledge receipt or maybe reload config
                    model = msg.get('model')
                    # This would require re-init of agents or set_model method on them
                    response = {"status": "ok", "message": f"Global Model update to {model} received (pending impl)"}
                
                elif cmd == 'GET_MODELS':
                    # Return current config
                    response = {"status": "ok", "models": self.moe.models}

                await self.cmd_socket.send_json(response)
                
            except Exception as e:
                logging.error(f"Command Error: {e}")
                
    async def generate_daily_briefing(self):
        """
        Generates a pre-day analysis briefing.
        """
        logging.info("Generating Daily Briefing...")
        briefing_data = self.calendar.get_todays_events()
        
        scan_results = []
        for symbol in SYMBOLS[:5]:
            df = self.data_feed.fetch_data(symbol)
            analysis = self.analyzer.analyze_daily(df)
            if analysis:
                scan_results.append({
                    "symbol": symbol,
                    "trend": analysis['trend'],
                    "price": analysis['price']
                })
        
        briefing = {
            "type": "DAILY_BRIEFING",
            "date": briefing_data['date'],
            "events": briefing_data['events'],
            "market_scan": scan_results
        }
        
        await self.socket.send_string(f"notification {json.dumps(briefing)}")
        logging.info("Daily Briefing Sent")

    async def run_loop(self):
        logging.info("Engine Bridge Running...")
        
        # Initial Briefing
        await asyncio.sleep(2)
        await self.generate_daily_briefing()
        
        try:
            while True:
                for symbol in SYMBOLS:
                    # 1. Fetch
                    df = self.data_feed.fetch_data(symbol)
                    
                    # 2. Analyze Technicals (Fast check first)
                    analyzed_df = self.analyzer.analyze(df)
                    signal = self.analyzer.check_signals(analyzed_df, symbol)
                    
                    # 3. If Signal -> Engage MoE
                    if signal:
                        logging.info(f"Signal Triggered: {symbol} {signal['action']}")
                        
                        # Call MoE Consensus (Async)
                        # We pass 'df' which the TechnicalAgent will re-analyze, 
                        # but we could optimize by passing pre-calced data.
                        # For now, following the test_moe pattern:
                        moe_result = await self.moe.get_consensus_signal(symbol, analyzed_df)
                        
                        # Merge Results
                        signal['ai_reasoning'] = moe_result.get('reasoning')
                        signal['risk_factors'] = f"Lev: {moe_result.get('risk_parameters', {}).get('leverage')}x"
                        signal['confidence'] = moe_result.get('confidence', 0.5)
                        
                        # Re-evaluate Action based on Consensus
                        # If MoE says HOLD/NEUTRAL but Tech said BUY, we might kill the trade
                        # or just downgrade confidence.
                        if moe_result.get('action') == 'HOLD':
                            logging.info(f"MoE vetoed {symbol} trade.")
                            continue # Skip publishing

                        # Store & Publish
                        signal['id'] = int(time.time() * 1000)
                        signal['source'] = 'MOE_ENGINE'
                        
                        database.store_signal(signal)
                        logging.info(f"MoE Signal Published: {signal['id']}")
                        
                        await self.socket.send_string(f"signal {json.dumps(signal)}")
                    
                    # 4. Ticker Update
                    current_price = float(df.iloc[-1]['close'])
                    ticker = {
                        "symbol": symbol,
                        "price": current_price,
                        "timestamp": datetime.now().isoformat()
                    }
                    await self.socket.send_string(f"ticker {json.dumps(ticker)}")
                    
                await asyncio.sleep(2) 
                
        except asyncio.CancelledError:
            logging.info("Loop cancelled")
        finally:
            self.data_feed.shutdown()
            self.executor.shutdown()

    async def main(self):
        # Run Command Listener and Main Loop concurrently
        await asyncio.gather(
            self.listen_commands(),
            self.run_loop()
        )

if __name__ == "__main__":
    bridge = AsyncEngineBridge()
    try:
        asyncio.run(bridge.main())
    except KeyboardInterrupt:
        logging.info("Shutting down...")
