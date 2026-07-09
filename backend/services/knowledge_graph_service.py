import re
import uuid
from typing import Dict, List


class LegalKnowledgeGraphBuilder:
    """
    Builds structured legal knowledge graphs
    from analyzed legal document text.
    """

    def __init__(self):
        pass

    def extract_entities(self, text: str) -> Dict:
        """
        Extract structured legal entities using regex and keyword heuristics.

        Scans the input text for parties, dates, obligations, clauses,
        legal terms, and financial terms using pattern matching and
        predefined keyword lists.

        Args:
            text: Raw legal document text to extract entities from.

        Returns:
            A dictionary with keys 'parties', 'dates', 'obligations',
            'clauses', 'legal_terms', and 'financial_terms', each
            containing a list of unique extracted string values.
        """

        entities = {
            "parties": [],
            "dates": [],
            "obligations": [],
            "clauses": [],
            "legal_terms": [],
            "financial_terms": [],
        }

        # -------------------------
        # Parties
        # -------------------------
        party_patterns = [
            r"between\s+([A-Z][A-Za-z\s]+)\s+and\s+([A-Z][A-Za-z\s]+)",
            r"party\s+[A-Z]",
            r"employee",
            r"employer",
            r"lessor",
            r"lessee",
            r"buyer",
            r"seller",
        ]

        for pattern in party_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)

            if isinstance(matches, list):
                for match in matches:
                    if isinstance(match, tuple):
                        entities["parties"].extend(match)
                    else:
                        entities["parties"].append(match)

        # -------------------------
        # Dates
        # -------------------------
        date_pattern = r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
        entities["dates"] = re.findall(date_pattern, text)

        # -------------------------
        # Obligations
        # -------------------------
        obligation_keywords = [
            "shall",
            "must",
            "required to",
            "obligated to",
            "agrees to",
        ]

        sentences = re.split(r"(?<=[.!?])\s+", text)

        for sentence in sentences:
            for keyword in obligation_keywords:
                if keyword.lower() in sentence.lower():
                    entities["obligations"].append(sentence.strip())
                    break

        # -------------------------
        # Clauses
        # -------------------------
        clause_pattern = r"(Clause\s+\d+[\.:]?\s*[A-Za-z\s]*)"
        entities["clauses"] = re.findall(clause_pattern, text)

        # -------------------------
        # Legal Terms
        # -------------------------
        legal_terms = [
            "indemnity",
            "liability",
            "confidentiality",
            "termination",
            "jurisdiction",
            "arbitration",
            "breach",
        ]

        for term in legal_terms:
            if term.lower() in text.lower():
                entities["legal_terms"].append(term)

        # -------------------------
        # Financial Terms
        # -------------------------
        money_pattern = r"(₹\s?\d+(?:,\d+)*(?:\.\d{2})?)"
        entities["financial_terms"] = re.findall(money_pattern, text)

        # Remove duplicates
        for key in entities:
            entities[key] = list(
                set(
                    [
                        item.strip()
                        for item in entities[key]
                        if item and isinstance(item, str)
                    ]
                )
            )

        return entities

    def build_relationships(self, entities: Dict) -> List[Dict]:
        """
        Build graph edges between extracted legal entities.

        Creates directed relationships between clauses, obligations,
        dates, and parties to form a structured knowledge graph.

        Args:
            entities: Dictionary of extracted entities as returned
                by extract_entities().

        Returns:
            A list of relationship dictionaries, each containing
            'source_label', 'target_label', and 'relationship' keys.
        """

        relationships = []  

        # Clause -> Obligation
        for clause in entities["clauses"]:
            for obligation in entities["obligations"]:
                relationships.append(
                    {
                        "source_label": clause,
                        "target_label": obligation,
                        "relationship": "contains obligation",
                    }
                )

        # Obligation -> Deadline
        for obligation in entities["obligations"]:
            for date in entities["dates"]:
                relationships.append(
                    {
                        "source_label": obligation,
                        "target_label": date,
                        "relationship": "has deadline",
                    }
                )

        # Party -> Obligation
        for party in entities["parties"]:
            for obligation in entities["obligations"]:
                relationships.append(
                    {
                        "source_label": party,
                        "target_label": obligation,
                        "relationship": "responsible for",
                    }
                )

        return relationships

    def generate_graph(self, text: str) -> Dict:
        """
        Generate a complete knowledge graph from legal document text.

        Extracts entities and builds relationships, then constructs
        a graph payload with unique node IDs and labeled edges.

        Args:
            text: Raw legal document text to process.

        Returns:
            A dictionary containing:
                - nodes: List of node dicts with 'id', 'label', and 'type'.
                - edges: List of edge dicts with 'id', 'source', 'target',
                  and 'label'.
        """

        entities = self.extract_entities(text)
        relationships = self.build_relationships(entities)

        nodes = []
        edges = []

        node_map = {}

        # -------------------------
        # Build Nodes
        # -------------------------
        for entity_type, values in entities.items():
            for value in values:
                node_id = str(uuid.uuid4())

                node = {"id": node_id, "label": value, "type": entity_type}

                nodes.append(node)
                node_map[value] = node_id

        # -------------------------
        # Build Edges
        # -------------------------
        for relation in relationships:

            source_id = node_map.get(relation["source_label"])
            target_id = node_map.get(relation["target_label"])

            if source_id and target_id:
                edges.append(
                    {
                        "id": str(uuid.uuid4()),
                        "source": source_id,
                        "target": target_id,
                        "label": relation["relationship"],
                    }
                )

        return {"nodes": nodes, "edges": edges}
