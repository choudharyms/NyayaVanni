import re

MAX_QUERY_LENGTH = 4000

class LegalQueryOptimizer:
    """
    Handles preprocessing of user queries for accurate Indian legal responses.
    System instructions are provided separately (not appended to user input)
    to prevent prompt injection via user-crafted input.
    """
    SYSTEM_INSTRUCTION = (
        "You are an expert Indian Legal AI. You must analyze queries strictly under "
        "the context of Indian Law (e.g., Bharatiya Nyaya Sanhita (BNS), Indian Penal Code (IPC), "
        "Civil Procedure Code (CPC)). For any claims or guidance provided, explicitly cite the "
        "relevant Sections, Articles, or landmark legal precedents. Do not give vague advice. "
        "End your response with a brief, professional legal disclaimer."
    )

    HINDI_INSTRUCTION = (
        "IMPORTANT: You MUST respond entirely in the Hindi language (हिन्दी)."
    )

    @staticmethod
    def get_system_instruction(language: str = "en") -> str:
        if language == "hi":
            return LegalQueryOptimizer.SYSTEM_INSTRUCTION + "\n" + LegalQueryOptimizer.HINDI_INSTRUCTION
        return LegalQueryOptimizer.SYSTEM_INSTRUCTION

    def clean_and_expand_query(self, query: str) -> str:
        """
        Cleans input noise and expands conversational legal shortforms 
        so the Gemini API models can parse key terminology accurately.
        """
        if not query:
            return ""

        cleaned = query.strip()[:MAX_QUERY_LENGTH]

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

        # Strip characters commonly used in prompt injection attempts
        cleaned = re.sub(r"[^\w\s\-\.,\(\)!?]", "", cleaned)
        return cleaned

    def optimize_prompt(self, user_message: str) -> str:
        """
        Cleans and expands the user message. Does NOT append system instructions,
        which are provided separately via get_system_instruction().
        """
        return self.clean_and_expand_query(user_message)