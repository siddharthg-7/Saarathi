import re
from typing import Tuple, Optional

# Keywords that signal historical retrieval or contextual memory questions
MEMORY_QUERY_PATTERNS = [
    r"\bwhat (was|were|did|is) my\b",
    r"\bwhat did i (say|write|decide|mention|plan|think|note)\b",
    r"\bstartup idea\b",
    r"\bproject\b",
    r"\bgoal(s)?\b",
    r"\bpreference(s)?\b",
    r"\bdo you remember\b",
    r"\bremind me what\b",
    r"\blast (month|week|year|semester)\b",
    r"\bwhy did i (change|reschedule|cancel|postpone)\b",
    r"\bwhen do i prefer\b",
    r"\bwhat am i building\b",
    r"\bnotes? about\b",
    r"\bbrain dump\b",
]

# Patterns where the user explicitly instructs Kairo to commit something to memory
EXPLICIT_MEMORY_PATTERNS = [
    r"^remember that\s+(.*)",
    r"^please remember\s+(.*)",
    r"^don't forget that\s+(.*)",
    r"^keep in mind that\s+(.*)",
    r"^save (this|preference|note):\s*(.*)",
    r"^i prefer\s+(.*)",
    r"^my preference is\s+(.*)",
]

# Simple execution commands that should NOT trigger expensive vector retrieval
SIMPLE_COMMAND_PATTERNS = [
    r"^create task",
    r"^add task",
    r"^postpone",
    r"^delete task",
    r"^start (focus|timer)",
    r"^stop (focus|timer)",
    r"^hello",
    r"^hi",
    r"^good (morning|afternoon|evening)",
    r"^help",
]

class MemoryIntentDetector:
    """Classifies user messages to determine whether long-term memory retrieval or explicit storage is needed."""

    @classmethod
    def requires_memory_retrieval(cls, message: str) -> bool:
        msg = message.strip().lower()
        if len(msg) < 4:
            return False

        # Fast rejection for pure commands
        for pat in SIMPLE_COMMAND_PATTERNS:
            if re.search(pat, msg):
                # Unless it also explicitly refers to past memories
                if not any(re.search(qp, msg) for qp in MEMORY_QUERY_PATTERNS):
                    return False

        # Check retrieval triggers
        for pattern in MEMORY_QUERY_PATTERNS:
            if re.search(pattern, msg):
                return True

        # Questions about past or identity usually benefit from context
        if "?" in msg and any(w in msg for w in ["i", "my", "we", "our", "saarathi", "kairo", "idea", "build"]):
            return True

        return False

    @classmethod
    def detect_explicit_memory(cls, message: str) -> Tuple[bool, Optional[str]]:
        """Returns (is_explicit, extracted_fact) if user asked Kairo to remember something."""
        msg = message.strip()
        for pattern in EXPLICIT_MEMORY_PATTERNS:
            match = re.search(pattern, msg, re.IGNORECASE)
            if match:
                fact = match.group(1).strip() if len(match.groups()) > 0 else msg
                return True, fact
        return False, None
