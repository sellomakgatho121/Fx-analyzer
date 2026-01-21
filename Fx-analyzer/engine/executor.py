import MetaTrader5 as mt5
import logging

class MT5Executor:
    """
    Handles connection to MetaTrader 5 and order execution.
    """
    def __init__(self):
        self.connected = False
        self.initialize()

    def initialize(self):
        try:
            if not mt5.initialize():
                logging.error(f"MT5 initialization failed: {mt5.last_error()}")
                self.connected = False
            else:
                logging.info("MT5 Initialized successfully")
                self.connected = True
        except Exception as e:
             logging.error(f"MT5 Init Exception: {e}")
             self.connected = False

    def shutdown(self):
        if self.connected:
            mt5.shutdown()

    def execute_order(self, symbol, action, volume=0.01, sl_pips=50, tp_pips=100):
        """
        Executes a market order.
        """
        if not self.connected:
            logging.warning("MT5 not connected, returning mock execution")
            return {"status": "mock_filled", "ticket": 12345678}

        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            logging.error(f"{symbol} not found")
            return {"status": "failed", "reason": "symbol_not_found"}

        if not symbol_info.visible:
            if not mt5.symbol_select(symbol, True):
                logging.error(f"Failed to select {symbol}")
                return {"status": "failed", "reason": "symbol_select_failed"}

        order_type = mt5.ORDER_TYPE_BUY if action == 'BUY' else mt5.ORDER_TYPE_SELL
        price = mt5.symbol_info_tick(symbol).ask if action == 'BUY' else mt5.symbol_info_tick(symbol).bid
        point = symbol_info.point

        sl = price - sl_pips * point if action == 'BUY' else price + sl_pips * point
        tp = price + tp_pips * point if action == 'BUY' else price - tp_pips * point

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "price": price,
            "sl": sl,
            "tp": tp,
            "deviation": 20,
            "magic": 234000,
            "comment": "FX Analyzer Pro",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logging.error(f"Order failed: {result.retcode}")
            return {"status": "failed", "reason": result.retcode}

        return {"status": "filled", "ticket": result.order}
