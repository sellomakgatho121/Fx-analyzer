import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class LLMAnalyzer:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not found in environment.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def analyze_market_context(self, symbol, indicators, price_action):
        """
        Ask Gemini to reason about the market state based on TA indicators.
        """
        prompt = f"""
        Analyze the following Forex market data for {symbol}:
        - Technical Indicators: {indicators}
        - Recent Price Action: {price_action}

        Provide your analysis in JSON format with the following keys:
        - "sentiment": "BULLISH", "BEARISH", or "NEUTRAL"
        - "reasoning": A concise professional explanation of the trend.
        - "confidence_score": 0.0 to 1.0
        - "risk_factors": Primary risks for this trade.
        """

        try:
            response = self.model.generate_content(prompt)
            # Basic JSON extraction from response text
            txt = response.text
            start = txt.find('{')
            end = txt.rfind('}') + 1
            return json.loads(txt[start:end])
        except Exception as e:
            print(f"LLM Analysis failed: {e}")
            return {
                "sentiment": "NEUTRAL",
                "reasoning": "LLM Analysis Unavailable",
                "confidence_score": 0.5,
                "risk_factors": "Connection issues"
            }
