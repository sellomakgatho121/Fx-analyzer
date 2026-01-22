import zmq
import time
import json
import random
import logging
from datetime import datetime
import pandas as pd
from analyzer import TechnicalAnalyzer
from executor import MT5Executor
from llm_analyzer import LLMAnalyzer
from data_feed import DataFeed
import database # Local DB module

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
ZMQ_PORT = 5555
SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']

class EngineBridge:
    def __init__(self):
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.PUB)
        self.socket.bind(f"tcp://*:{ZMQ_PORT}")
        logging.info(f"ZeroMQ Publisher bound to port {ZMQ_PORT}")
        
        self.analyzer = TechnicalAnalyzer()
        self.executor = MT5Executor()
        self.llm = LLMAnalyzer()
        self.data_feed = DataFeed()
        
        # Initialize Database
        database.init_db()

    def run(self):
        logging.info("Engine Bridge Running...")
        try:
            while True:
                for symbol in SYMBOLS:
                    # 1. Fetch Data
                    df = self.data_feed.fetch_data(symbol)
                    
                    # 2. Analyze
                    analyzed_df = self.analyzer.analyze(df)
                    signal = self.analyzer.check_signals(analyzed_df, symbol)
                    
                    # 3. Publish Signal if found
                    if signal:
                        logging.info(f"Signal Found: {signal['symbol']} {signal['action']}")
                        
                        # --- LLM Enrichment ---
                        # Prepare context for LLM
                        context = {
                            "price": signal['price'],
                            "rsi": analyzed_df.iloc[-1]['RSI'] if 'RSI' in analyzed_df else 50,
                            "trend": "Bullish" if signal['action'] == 'BUY' else "Bearish" # Simplified
                        }
                        
                        llm_result = self.llm.analyze_signal(symbol, signal['action'], context)
                        
                        # Merge LLM results
                        signal['ai_reasoning'] = llm_result['reasoning']
                        signal['risk_factors'] = llm_result['risk_assessment']
                        # Blend confidence: 70% Technical, 30% LLM
                        signal['confidence'] = round(signal['confidence'] * 0.7 + llm_result['confidence_score'] * 0.3, 2)
                        
                        # Add tracking ID
                        signal['id'] = int(time.time() * 1000)
                        signal['source'] = 'PYTHON_ENGINE_LLM'
                        
                        # Store in DB
                        database.store_signal(signal)
                        logging.info(f"Signal stored in DB: {signal['id']}")
                        
                        self.socket.send_string(f"signal {json.dumps(signal)}")
                    
                    # 4. Publish Ticker/Price Update (simulated)
                    current_price = float(df.iloc[-1]['close'])
                    ticker = {
                        "symbol": symbol,
                        "price": current_price,
                        "timestamp": datetime.now().isoformat()
                    }
                    self.socket.send_string(f"ticker {json.dumps(ticker)}")
                    
                time.sleep(2) # Analyze every 2 seconds
                
        except KeyboardInterrupt:
            logging.info("Shutting down...")
        finally:
            self.data_feed.shutdown()
            self.executor.shutdown()
            self.socket.close()
            self.context.term()

if __name__ == "__main__":
    bridge = EngineBridge()
    bridge.run()
