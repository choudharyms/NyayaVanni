import re

class LegalQueryOptimizer:
    """
    Handles preprocessing of user queries and applies strict system prompts 
    for accurate, citation-backed Indian legal responses using the Gemini API.
    """
    def __init__(self):
        # Strict guidelines to append to the system instructions
        self.legal_instruction = (
            "\n\n[SYSTEM INSTRUCTION: You must analyze the following user query strictly under "
            "the context of Indian Law (e.g., Bharatiya Nyaya Sanhita (BNS), Indian Penal Code (IPC), "
            "Civil Procedure Code (CPC)). For any claims or guidance provided, explicitly cite the "
            "relevant Sections, Articles, or landmark legal precedents. Do not give vague advice. "
            "End your response with a brief, professional legal disclaimer.]"
        )

    def clean_and_expand_query(self, query: str) -> str:
        """
        Cleans input noise and expands conversational legal shortforms 
        so the Gemini API models can parse key terminology accurately.
        """
        if not query:
            return ""

        # Normalize text casing
        cleaned = query.strip()

        # Map common legal abbreviations to their full expansions
        abbreviations = {
            r"\b[iI][pP][cC]\b": "Indian Penal Code",
            r"\b[cC][rR][pP][cC]\b": "Code of Criminal Procedure",
            r"\b[bB][nN][sS]\b": "Bharatiya Nyaya Sanhita",
            r"\b[cC][pP][cC]\b": "Code of Civil Procedure",
            r"\b[fF][iI][rR]\b": "First Information Report",
            r"\b[rR][tT][iI]\b": "Right to Information Act"
        }

        for pattern, replacement in abbreviations.items():
            cleaned = re.sub(pattern, replacement, cleaned)

        # Basic stripping of unnecessary special character clutter
        cleaned = re.sub(r"[^\w\s\-\.,\(\)]", "", cleaned)
        return cleaned

    def optimize_prompt(self, user_message: str) -> str:
        """
        Combines the cleaned query with structural system prompt constraints.
        """
        processed_query = self.clean_and_expand_query(user_message)
        return f"{processed_query}{self.legal_instruction}"