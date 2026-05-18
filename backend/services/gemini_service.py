import google.generativeai as genai
import os
import json
import logging
# Import the custom Legal Query Optimizer you just created
from backend.services.legal_processor import LegalQueryOptimizer

logger = logging.getLogger(__name__)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Instantiate the optimizer module globally
query_optimizer = LegalQueryOptimizer()

generation_config = {
  "temperature": 0.3,
  "top_p": 0.8,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json",
}

chat_config = {
  "temperature": 0.5,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",
    generation_config=generation_config
)

chat_model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",
    generation_config=chat_config
)

def analyze_document_with_gemini(document_text: str, retrieved_laws: list, language: str = "en") -> dict:
    context = "\n".join(retrieved_laws)
    
    lang_instruction = ""
    if language == "hi":
        lang_instruction = "IMPORTANT: You MUST translate all your analysis, summaries, and action points into Hindi (हिन्दी). Provide the values in Hindi, but keep the JSON keys strictly in English."

    prompt = f"""
    You are an expert Indian Legal AI. Analyze the following document text and relevant legal snippets.
    {lang_instruction}

    Document Text:
    {document_text}

    Relevant Laws:
    {context}

    Extract and structure the output strictly in JSON format matching this schema:
    {{
      "document_type": "FIR/Notice/Contract/etc.",
      "parties": [{{"name": "...", "role": "..."}}],
      "dates": [{{"type": "notice_date|response_deadline", "value": "YYYY-MM-DD"}}],
      "sections": ["Extract explicit legal sections/laws from Document, or apply from Relevant Laws"],
      "clauses": ["Extract key clauses/obligations from Document"],
      "summary": "A clear 2-3 sentence explanation of the document.",
      "risk_level": "Low|Medium|High",
      "urgency": "Immediate|Soon|Normal",
      "consequences": ["List of potential outcomes"],
      "recommended_timeline": "Respond within X days",
      "actions": [
        {{
          "priority": "high|medium|low",
          "action": "What to do next",
          "why": "Reason",
          "timeline": "When to do it"
        }}
      ]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # Clean potential markdown markdown wrapping if Gemini messes up
        import re
        match = re.search(r'
http://googleusercontent.com/immersive_entry_chip/0

---

### 💾 Step 3: Propose Changes and Create the Pull Request

Now that both files are saved in your editor:
1. Click the **Source Control** icon in the far-left sidebar menu of `github.dev` (it looks like a branch icon with a little circle).
2. You will see both `legal_processor.py` and `gemini_service.py` listed as changed files. 
3. Type a clear commit title in the message input box at the top, like: `feat: optimize legal queries and expand abbreviations for Gemini API chat`
4. Click the checkmark button or the dropdown commit button to create a new patch branch on your account.
5. It will prompt you to create a **Pull Request (PR)**. Click that!

Let me know once you reach the Pull Request description window, and I can give you the exact description markdown to write to impress the repository owner!