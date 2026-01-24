import asyncio
import logging
import json
import os

try:
    from engine.agents.technical import TechnicalAgent
    from engine.agents.fundamental import FundamentalAgent
    from engine.agents.sentiment import SentimentAgent
    from engine.agents.risk import RiskAgent
    from engine.rag.loader import RAGLoader
    from engine.rag.rss_loader import RSSLoader
    from engine.analyzer import TechnicalAnalyzer
    from engine.memory import MemoryService
except ImportError:
    from agents.technical import TechnicalAgent
    from agents.fundamental import FundamentalAgent
    from agents.sentiment import SentimentAgent
    from agents.risk import RiskAgent
    from rag.loader import RAGLoader
    from rag.rss_loader import RSSLoader
    from analyzer import TechnicalAnalyzer
    from memory import MemoryService


class MoEOrchestrator:
    def __init__(self):
        # Load Model Config
        config_path = os.path.join(
            os.path.dirname(__file__), "..", "config", "models.json"
        )
        try:
            with open(config_path, "r") as f:
                self.models = json.load(f)
        except Exception as e:
            logging.warning(f"Could not load models.json: {e}. Using defaults.")
            self.models = {}

        self.tech_agent = TechnicalAgent(
            model_name=self.models.get("TechnicalExpert", "gemini-1.5-flash")
        )
        self.fund_agent = FundamentalAgent(
            model_name=self.models.get("FundamentalExpert", "gemini-1.5-pro")
        )
        self.sent_agent = SentimentAgent(
            model_name=self.models.get("SentimentExpert", "gemini-1.5-flash")
        )
        self.risk_agent = RiskAgent(
            model_name=self.models.get("RiskManager", "gemini-1.5-flash")
        )

        self.rag = RAGLoader()
        self.rss = RSSLoader()
        self.analyzer = TechnicalAnalyzer()
        self.memory = MemoryService()

    async def get_consensus_signal(self, symbol: str, df, news: list = None):
        """
        Main entry point. Queries all experts and synthesizes a decision.
        """
        # 0. Fetch External Data if missing
        if not news:
            # Run in thread/executor if blocking, but fetch_news is synchronous requests mostly
            # For now, running sync is okay or we can offload
            news = self.rss.fetch_news()

        # 1. Prepare Data
        df = self.analyzer.analyze(df)
        tech_data = self.analyzer.get_technical_summary(df, symbol)
        macro_context = self.rag.get_summary_context()
        memory_context = self.memory.get_recent_performance(symbol)

        # 2. Parallel Agent Calls
        results = await asyncio.gather(
            self.tech_agent.analyze(tech_data),
            self.fund_agent.analyze(macro_context),
            self.sent_agent.analyze(news),
            self.risk_agent.analyze(
                {
                    "atr": tech_data.get("atr"),
                    "price_action_desc": tech_data.get("trend"),
                }
            ),
        )

        tech_res, fund_res, sent_res, risk_res = results

        # 3. Synthesis
        final_decision = await self._synthesize(
            symbol, tech_res, fund_res, sent_res, risk_res, memory_context
        )

        # Attach detailed breakdown for Frontend Visualization
        final_decision["agent_breakdown"] = {
            "technical": tech_res,
            "fundamental": fund_res,
            "sentiment": sent_res,
            "risk": risk_res,
            "memory": memory_context,
        }

        return final_decision

    async def _synthesize(self, symbol, tech, fund, sent, risk, memory):
        prompt = f"""
        Act as a Head Trader. Review the reports from your desk AND past performance:
        
        [Past Performance / Memory]:
        {memory}

        [Technical Analyst]: {tech.get("signal")} ({tech.get("confidence")}) - {tech.get("reasoning")}
        [Macro Strategist]: {fund.get("bias")} ({fund.get("confidence")}) - {fund.get("reasoning")}
        [Sentiment]: {sent.get("sentiment")} ({sent.get("confidence")}) - {sent.get("reasoning")}
        [Risk]: Max Leverage {risk.get("max_leverage")}, Advice: {risk.get("stop_loss_advice")}

        Task: Make a final trading decision for {symbol}.
        
        Output JSON:
        {{
            "action": "BUY" | "SELL" | "HOLD",
            "confidence": 0.0 to 1.0,
            "reasoning": "Synthesized logic citing specific experts. Be decisive.",
            "risk_parameters": {{ "leverage": int, "stop_loss": "string" }}
        }}
        """

        # We reuse the technical agent's connection for the final synthesis to save resources
        response = await self.tech_agent._call_llm_async(prompt)

        fallback = {
            "action": "HOLD",
            "confidence": 0.0,
            "reasoning": "Synthesis Failed",
            "risk_parameters": {"leverage": 1, "stop_loss": "N/A"},
        }

        if response:
            return self.tech_agent._clean_json(response) or fallback
        return fallback

    def set_global_model(self, model_name: str):
        """
        Updates the model for all agents.
        """
        logging.info(f"Orchestrator: Switching all agents to {model_name}")

        results = {
            "TechnicalExpert": self.tech_agent.update_model(model_name),
            "FundamentalExpert": self.fund_agent.update_model(model_name),
            "SentimentExpert": self.sent_agent.update_model(model_name),
            "RiskManager": self.risk_agent.update_model(model_name),
        }

        # Update internal config to persist (in memory only for now)
        for key in self.models:
            self.models[key] = model_name

        success_count = sum(results.values())
        return {
            "success": success_count > 0,
            "details": results,
            "message": f"Updated {success_count}/{len(results)} agents to {model_name}",
        }
