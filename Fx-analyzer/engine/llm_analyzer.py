import os
import google.generativeai as genai
import logging
import time
import warnings
from dotenv import load_dotenv

# Suppress Gemini deprecation warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

# Load environment variables
load_dotenv()

class LLMAnalyzer:
    """
    Analyzes market data and technical signals using Google Gemini Flash.
    Includes adaptive exponential backoff for rate limits.
    """
    def __init__(self):
        self.cache = {} # (symbol, action) -> {data, timestamp}
        self.rate_limited_until = 0
        self.consecutive_errors = 0
        self.base_backoff = 5 # Start with 5 seconds
        self.max_backoff = 120 # Cap at 2 minutes
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logging.warning("GEMINI_API_KEY not found. LLM Analysis disabled.")
            self.model = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash') # Updated model name if applicable, keeping generic or user pref
                logging.info("LLM Analyzer initialized with Gemini")
            except Exception as e:
                logging.error(f"Failed to configure Gemini API: {e}")
                self.model = None

    def analyze_signal(self, symbol: str, action: str, technical_context: dict) -> dict:
        """
        Generates reasoning for a signal. Handles rate limits with adaptive backoff.
        """
        # 0. Check if LLM is disabled
        if not self.model:
            return self._get_fallback_response(symbol, action, technical_context, reason="LLM Disabled")

        # 1. Check Rate Limit Window
        if time.time() < self.rate_limited_until:
            wait_time = int(self.rate_limited_until - time.time())
            logging.warning(f"Rate limit active ({wait_time}s remaining). Using fallback for {symbol}.")
            return self._get_fallback_response(symbol, action, technical_context, reason="Rate Limited")

        prompt = self._construct_prompt(symbol, action, technical_context)
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_response(response.text)
            
            # Success - Reset backoff
            if self.consecutive_errors > 0:
                self.consecutive_errors = 0
                logging.info("LLM connection restored. Backoff reset.")
            
            # Update Cache
            self.cache[(symbol, action)] = {
                "data": result,
                "timestamp": time.time()
            }
            return result
            
        except Exception as e:
            error_msg = str(e)
            # Check for 429 or Quota Exceeded
            if "429" in error_msg or "ResourceExhausted" in error_msg or "Quota" in error_msg:
                self.consecutive_errors += 1
                # Exponential Backoff: 5s, 10s, 20s, 40s... cap at 120s
                backoff_delay = min(self.base_backoff * (2 ** (self.consecutive_errors - 1)), self.max_backoff)
                self.rate_limited_until = time.time() + backoff_delay
                
                logging.error(f"Gemini Rate Limit Hit! Backing off for {backoff_delay}s. (Attempt {self.consecutive_errors})")
                return self._get_fallback_response(symbol, action, technical_context, reason="Rate Limit Hit")
            else:
                logging.error(f"LLM Generation Error: {e}")
                return self._get_fallback_response(symbol, action, technical_context, reason="LLM Error")

    def _get_fallback_response(self, symbol, action, context, reason="Fallback"):
        """Returns a safe fallback response using cache or templates."""
        
        # Try Cache first (valid for 5 minutes)
        cache_key = (symbol, action)
        if cache_key in self.cache:
            cached_item = self.cache[cache_key]
            if time.time() - cached_item['timestamp'] < 300: # 5 mins TTL
                logging.info(f"Serving cached reasoning for {symbol} {action}")
                cached_data = cached_item["data"].copy()
                cached_data["reasoning"] += f" (Cached - {reason})"
                return cached_data
            else:
                del self.cache[cache_key] # Expired

        # Generate Template
        trend_desc = "bullish" if action == "BUY" else "bearish"
        rsi = context.get('rsi', 50)
        template_logic = f"Technical setup suggests {trend_desc} momentum for {symbol} (RSI: {rsi}). {reason} mode active, relying on technicals."
        
        return {
            "reasoning": template_logic,
            "confidence_score": 0.5, # Neutral confidence adjustment
            "risk_assessment": f"Medium ({reason})"
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
