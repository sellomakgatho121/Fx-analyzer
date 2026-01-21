import MetaTrader5 as mt5
import pandas as pd
import numpy as np
import random
from datetime import datetime
import logging

class DataFeed:
    """
    Handles data ingestion from MetaTrader 5 or generates mock data.
    """
    def __init__(self):
        self.use_mt5 = False
        self.initialize_mt5()

    def initialize_mt5(self):
        try:
            if mt5.initialize():
                logging.info("DataFeed: MT5 Initialized Successfully")
                self.use_mt5 = True
            else:
                logging.warning(f"DataFeed: MT5 Init Failed ({mt5.last_error()}), using MOCK data")
                self.use_mt5 = False
        except Exception as e:
            logging.error(f"DataFeed: MT5 Error {e}, using MOCK data")
            self.use_mt5 = False

    def fetch_data(self, symbol: str, timeframe=mt5.TIMEFRAME_M1, limit=500) -> pd.DataFrame:
        """
        Fetches OHLCV data. 
        """
        if self.use_mt5:
            rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, limit)
            if rates is not None and len(rates) > 0:
                df = pd.DataFrame(rates)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                return df[['time', 'open', 'high', 'low', 'close', 'tick_volume']]
            else:
                logging.warning(f"DataFeed: Failed to fetch {symbol} from MT5, falling back to mock")
                return self.generate_mock_data(symbol)
        
        return self.generate_mock_data(symbol)

    def generate_mock_data(self, symbol) -> pd.DataFrame:
        """
        Generates realistic mock data.
        """
        # Realistic starting prices
        base = 1.0800 if 'EUR' in symbol else 1.2600 if 'GBP' in symbol else 150.00
        if 'JPY' in symbol: base = 155.00
        
        data = []
        current = base + (random.random() - 0.5) * 0.1
        
        # Determine pip size
        pip_size = 0.01 if 'JPY' in symbol else 0.0001
        
        start_time = int(datetime.now().timestamp()) - (500 * 60) # 500 minutes ago
        
        for i in range(500):
            open_p = current
            # Random walk
            change = (random.random() - 0.5) * (pip_size * 10)
            close_p = open_p + change
            
            high_p = max(open_p, close_p) + random.random() * (pip_size * 5)
            low_p = min(open_p, close_p) - random.random() * (pip_size * 5)
            
            # Simulated time
            t = datetime.fromtimestamp(start_time + (i * 60))
            
            data.append({
                "time": t,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "tick_volume": random.randint(100, 1000)
            })
            current = close_p
            
        return pd.DataFrame(data)

    def shutdown(self):
        if self.use_mt5:
            mt5.shutdown()
