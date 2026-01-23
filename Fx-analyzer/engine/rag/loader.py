import os
import glob
import logging
from typing import List, Dict

class RAGLoader:
    def __init__(self, data_dir: str = "data/research"):
        self.data_dir = data_dir
        # Ensure directory exists
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
            
    def load_documents(self) -> List[Dict[str, str]]:
        """
        Scans the data directory for text and pdf files.
        Returns a list of dicts: {'source': filename, 'content': text}
        """
        documents = []
        # Search for .txt files
        for filepath in glob.glob(os.path.join(self.data_dir, "**/*.txt"), recursive=True):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if content.strip():
                        documents.append({
                            "source": os.path.basename(filepath),
                            "content": content
                        })
            except Exception as e:
                logging.error(f"Error reading {filepath}: {e}")
                
        # TODO: Add PDF support here (requires pypdf or similar)
        
        return documents

    def get_summary_context(self) -> str:
        """
        Returns a concatenated string of all document contents, truncated or summarized.
        For now, we'll just concatenate the first 2000 chars of each doc to avoid blowing context.
        """
        docs = self.load_documents()
        if not docs:
            return "No research documents found."
            
        context_parts = []
        for doc in docs:
            # Simple truncation for now - in full version we'd use LLM summarization here
            snippet = doc['content'][:2000] 
            context_parts.append(f"--- SOURCE: {doc['source']} ---\n{snippet}\n")
            
        return "\n".join(context_parts)
