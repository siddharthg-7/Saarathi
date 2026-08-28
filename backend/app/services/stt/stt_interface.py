from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class STTProvider(ABC):
    """
    Abstract Base Class for Speech-to-Text Providers.
    Allows Saarathi and Kairo to be resilient to STT provider outages by swapping or falling back.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the STT provider (e.g. 'gemini_transcribe', 'deepgram', 'whisper')."""
        pass

    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        mode: str = "smart", # "smart" | "verbatim"
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> str:
        """
        Transcribes raw audio bytes into text.
        Supports 'smart' formatting (filler reduction, date normalization) and 'verbatim' exact mode.
        Raises an exception on non-recoverable provider failure.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is configured and available."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Returns provider capabilities (e.g. streaming, smart_format, supported codecs)."""
        pass

    async def detect_language(self, audio_data: bytes, content_type: str = "audio/wav") -> str:
        """
        Optional automatic language detection.
        Defaults to auto-detecting or returning 'auto'.
        """
        return "auto"
