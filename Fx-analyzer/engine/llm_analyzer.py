import os
import google.generativeai as genai
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMAnalyzer:
    """
    Analyzes market data and technical signals using Google Gemini Flash.
    """
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logging.warning("GEMINI_API_KEY not found in environment variables. LLM Analysis will be disabled/mocked.")
            self.model = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-3-flash-preview')
                logging.info("LLM Analyzer initialized with Gemini Flash")
            except Exception as e:
                logging.error(f"Failed to configure Gemini API: {e}")
                self.model = None

    def analyze_signal(self, symbol: str, action: str, technical_context: dict) -> dict:
        """
        Generates reasoning and confidence adjustment for a technical signal.
        """
        if not self.model:
            return {
                "reasoning": "LLM Analysis Disabled (No API Key)",
                "confidence_score": 0.5,
                "risk_assessment": "Unknown"
            }

        prompt = self._construct_prompt(symbol, action, technical_context)
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_response(response.text)
        except Exception as e:
            logging.error(f"LLM Generation Error: {e}")
            return {
                "reasoning": "LLM Error",
                "confidence_score": 0.0,
                "risk_assessment": "Error"
            }

    def _construct_prompt(self, symbol, action, context):
        return f"""
        Act as a refined implementation of a Forex Institutional Analyst.
        
        Analyze the following potential trade setup:
        - Symbol: {symbol}
        - Proposed Action: {action}
        - Technical Indicators:
          - Price: {context.get('price')}
          - RSI: {context.get('rsi')}
          - MACD: {context.get('macd')}
          - Market Trend: {context.get('trend')}
        
        Provide a JSON response with the following keys:
        - logic: A concise 1-sentence explanation of why this trade makes sense or not.
        - confidence: A score between 0.0 and 1.0 based on the confluence of factors.
        - risk: A short phrase describing the primary risk (e.g., "High Volatility", "Contra-trend").
        
        Do not output markdown code blocks. Just the raw JSON string.
        """

    def _parse_response(self, response_text):
        try:
            import json
            # Clean up potential markdown code blocks
            clean_text = response_text.replace('```json', '').replace('```', '').strip()
            data = json.loads(clean_text)
            return {
                "reasoning": data.get("logic", "No reasoning provided"),
                "confidence_score": float(data.get("confidence", 0.5)),
                "risk_assessment": data.get("risk", "Medium")
            }
        except Exception:
            return {
                "reasoning": response_text[:100] + "...", # Fallback to raw text if not JSON
                "confidence_score": 0.5,
                "risk_assessment": "Parser Error"
            }
