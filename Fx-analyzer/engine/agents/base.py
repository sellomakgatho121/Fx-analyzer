import os
import google.generativeai as genai
import logging
import time
import warnings
from dotenv import load_dotenv
import json

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
load_dotenv()


class BaseAgent:
    """
    Base class for all Expert Agents.
    Handles Gemini API connections, rate limiting, and basic JSON parsing.
    """

    def __init__(self, name: str, role: str, model_name: str = "gemini-1.5-flash"):
        self.name = name
        self.role = role
        self.model_name = model_name
        self.rate_limited_until = 0
        self.consecutive_errors = 0
        self.base_backoff = 5
        self.max_backoff = 120

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logging.warning(f"GEMINI_API_KEY not found. Agent {self.name} disabled.")
            self.model = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logging.info(f"Agent {self.name} initialized with {self.model_name}")
            except Exception as e:
                logging.error(f"Agent {self.name} failed to init: {e}")
                self.model = None

    def update_model(self, model_name: str):
        """
        Updates the LLM model used by this agent.
        """
        if model_name == self.model_name:
            return True  # No change needed

        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logging.warning(f"Cannot update model for {self.name}: API Key missing")
                return False

            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model_name)
            self.model_name = model_name
            logging.info(f"Agent {self.name} switched to {self.model_name}")
            return True
        except Exception as e:
            logging.error(f"Agent {self.name} failed to switch model: {e}")
            return False

    async def _call_llm_async(self, prompt: str) -> str:
        """
        Async wrapper for LLM call.
        Note: The google.generativeai library is synchronous, but we can run it in an executor
        or use the async version if available. For now, we'll assume sync call wrapped in async function
        to fit the orchestrator pattern, or use verify available async methods.
        Gemini python SDK has generate_content_async.
        """
        if not self.model:
            return None

        if time.time() < self.rate_limited_until:
            logging.warning(f"Agent {self.name} is rate limited.")
            return None

        try:
            # Using the async generation method
            response = await self.model.generate_content_async(prompt)

            # Reset backoff on success
            if self.consecutive_errors > 0:
                self.consecutive_errors = 0
            return response.text

        except Exception as e:
            error_msg = str(e)
            if (
                "429" in error_msg
                or "ResourceExhausted" in error_msg
                or "Quota" in error_msg
            ):
                self.consecutive_errors += 1
                backoff = min(
                    self.base_backoff * (2 ** (self.consecutive_errors - 1)),
                    self.max_backoff,
                )
                self.rate_limited_until = time.time() + backoff
                logging.error(f"Agent {self.name} hit rate limit. Backoff {backoff}s.")
            else:
                logging.error(f"Agent {self.name} error: {e}")
            return None

    def _clean_json(self, text: str) -> dict:
        """Attempts to parse JSON from the LLM response."""
        try:
            clean_text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception:
            logging.warning(f"Agent {self.name} failed to parse JSON: {text[:50]}...")
            return None
