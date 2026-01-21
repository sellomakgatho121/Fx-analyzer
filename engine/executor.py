import MetaTrader5 as mt5
import time

class Executor:
    def __init__(self, symbol="EURUSD"):
        self.symbol = symbol
        if not mt5.initialize():
            print("MT5 initialize() failed")
            mt5.shutdown()

    def place_order(self, action, volume=0.1, price=None):
        """
        Place a market order in MT5.
        """
        order_type = mt5.ORDER_TYPE_BUY if action == "BUY" else mt5.ORDER_TYPE_SELL
        
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": self.symbol,
            "volume": volume,
            "type": order_type,
            "price": price or mt5.symbol_info_tick(self.symbol).ask if action == "BUY" else mt5.symbol_info_tick(self.symbol).bid,
            "magic": 123456,
            "comment": "FX Analyzer Signal",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        return result

    def close(self):
        mt5.shutdown()
