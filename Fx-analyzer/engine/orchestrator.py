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
    from engine.analyzer import TechnicalAnalyzer
except ImportError:
    from agents.technical import TechnicalAgent
    from agents.fundamental import FundamentalAgent
    from agents.sentiment import SentimentAgent
    from agents.risk import RiskAgent
    from rag.loader import RAGLoader
    from analyzer import TechnicalAnalyzer

class MoEOrchestrator:
    def __init__(self):
        # Load Model Config
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'models.json')
        try:
            with open(config_path, 'r') as f:
                self.models = json.load(f)
        except Exception as e:
            logging.warning(f"Could not load models.json: {e}. Using defaults.")
            self.models = {}

        self.tech_agent = TechnicalAgent(model_name=self.models.get("TechnicalExpert", "gemini-1.5-flash"))
        self.fund_agent = FundamentalAgent(model_name=self.models.get("FundamentalExpert", "gemini-1.5-pro"))
        self.sent_agent = SentimentAgent(model_name=self.models.get("SentimentExpert", "gemini-1.5-flash"))
        self.risk_agent = RiskAgent(model_name=self.models.get("RiskManager", "gemini-1.5-flash"))
        
        self.rag = RAGLoader()
        self.analyzer = TechnicalAnalyzer()
        
    async def get_consensus_signal(self, symbol: str, df, news: list = None):
        """
        Main entry point. Queries all experts and synthesizes a decision.
        """
        # 1. Prepare Data
        df = self.analyzer.analyze(df)
        tech_data = self.analyzer.get_technical_summary(df, symbol)
        macro_context = self.rag.get_summary_context()
        
        # 2. Parallel Agent Calls
        results = await asyncio.gather(
            self.tech_agent.analyze(tech_data),
            self.fund_agent.analyze(macro_context),
            self.sent_agent.analyze(news),
            self.risk_agent.analyze({'atr': tech_data.get('atr'), 'price_action_desc': tech_data.get('trend')})
        )
        
        tech_res, fund_res, sent_res, risk_res = results
        
        # 3. Synthesis
        final_decision = await self._synthesize(symbol, tech_res, fund_res, sent_res, risk_res)
        
        return final_decision

    async def _synthesize(self, symbol, tech, fund, sent, risk):
        prompt = f"""
        Act as a Head Trader. Review the reports from your desk:

        [Technical Analyst]: {tech.get('signal')} ({tech.get('confidence')}) - {tech.get('reasoning')}
        [Macro Strategist]: {fund.get('bias')} ({fund.get('confidence')}) - {fund.get('reasoning')}
        [Sentiment]: {sent.get('sentiment')} ({sent.get('confidence')}) - {sent.get('reasoning')}
        [Risk]: Max Leverage {risk.get('max_leverage')}, Advice: {risk.get('stop_loss_advice')}

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
            "risk_parameters": {"leverage": 1, "stop_loss": "N/A"}
        }

        if response:
            return self.tech_agent._clean_json(response) or fallback
        return fallback
