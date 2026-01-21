import pandas as pd
import numpy as np

from llm_analyzer import LLMAnalyzer

class Analyzer:
    def __init__(self):
        self.llm = LLMAnalyzer()

    def calculate_indicators(self, df):
        # ... (unchanged) ...
        return df # Keep original flow, simplified here for context

    def generate_signal(self, df):
        """
        Determine if buy/sell signal exists based on indicators + LLM reasoning.
        """
        last_row = df.iloc[-1]
        indicators = {
            "rsi": last_row['rsi'],
            "macd": last_row['macd'],
            "sma_20": last_row['sma_20']
        }
        
        # Get LLM Reasoning
        ai_insight = self.llm.analyze_market_context("EURUSD", indicators, f"Current Price: {last_row['close']}")
        
        # Hybrid Logic: TA Trigger + LLM Confirmation
        action = "HOLD"
        ta_action = "HOLD"
        
        if last_row['rsi'] < 30 and last_row['macd'] > last_row['signal_line']:
            ta_action = "BUY"
        elif last_row['rsi'] > 70 and last_row['macd'] < last_row['signal_line']:
            ta_action = "SELL"
            
        if ta_action == ai_insight['sentiment']:
            action = ta_action
        
        return {
            "action": action,
            "confidence": ai_insight['confidence_score'],
            "price": last_row['close'],
            "ai_reasoning": ai_insight['reasoning'],
            "risk_factors": ai_insight['risk_factors']
        }
