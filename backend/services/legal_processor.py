import re

class LegalQueryOptimizer:
    """
    Handles preprocessing of user queries and applies strict system prompts 
    for accurate, citation-backed Indian legal responses using the Gemini API.
    """
    def __init__(self):
        """Initialize the LegalQueryOptimizer with system prompt instructions.

        Sets up the legal_instruction string that enforces citation-backed
        responses under Indian law frameworks (BNS, IPC, CPC) when appended
        to user queries sent to the Gemini API.
        """
        # Strict guidelines to append to the system instructions
        self.legal_instruction = (
            "\n\n[SYSTEM INSTRUCTION: You must analyze the following user query strictly under "
            "the context of Indian Law (e.g., Bharatiya Nyaya Sanhita (BNS), Indian Penal Code (IPC), "
            "Civil Procedure Code (CPC)). For any claims or guidance provided, explicitly cite the "
            "relevant Sections, Articles, or landmark legal precedents. Do not give vague advice. "
            "End your response with a brief, professional legal disclaimer.]"
        )

    def clean_and_expand_query(self, query: str) -> str:
       """Clean input noise and expand conversational legal shortforms.

        Strips whitespace, expands common Indian legal abbreviations (e.g.
        IPC → Indian Penal Code, BNS → Bharatiya Nyaya Sanhita, FIR → First
        Information Report), and removes stray special characters so the
        Gemini API models can parse key terminology accurately.

        Args:
            query: Raw user input string, possibly containing abbreviations
                   or noisy punctuation.

        Returns:
            A cleaned and expanded query string, or an empty string if the
            input is falsy.
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
        """Combine the cleaned query with structural system prompt constraints.

        Passes the user message through clean_and_expand_query first, then
        appends the legal_instruction to enforce citation-backed, disclaimer-
        ended responses from the Gemini API.

        Args:
            user_message: Raw legal question from the user.

        Returns:
            A formatted string with the cleaned query followed by the system
            instruction block, ready to be sent to the Gemini API.
        """
        processed_query = self.clean_and_expand_query(user_message)
        return f"{processed_query}{self.legal_instruction}"