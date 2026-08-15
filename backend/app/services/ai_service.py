import os
import time
import httpx
import logging
from typing import List, Dict, Any, Optional
from threading import Lock
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

class TokenBucketRateLimiter:
    def __init__(self, capacity: float = 10.0, refill_rate: float = 0.1667):
        """
        Token Bucket Rate Limiter.
        Capacity: Max tokens (burst size).
        Refill Rate: Tokens added per second. (0.1667 tokens/sec is ~10 tokens/min)
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_update = time.time()
        self.lock = Lock()

    def consume(self, tokens_to_consume: float = 1.0) -> bool:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.last_update = now
            
            # Add new tokens based on elapsed time
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            
            if self.tokens >= tokens_to_consume:
                self.tokens -= tokens_to_consume
                return True
            return False

# Initialize a global Gemini rate limiter (10 requests per minute)
gemini_limiter = TokenBucketRateLimiter(capacity=10.0, refill_rate=10.0 / 60.0)

async def call_groq_chat(
    messages: List[Dict[str, str]],
    model: str = "llama-3.3-70b-specdec", # Fallback to standard Groq model
    temperature: float = 0.7,
    response_format: Optional[Dict[str, Any]] = None
) -> str:
    """
    Call Groq API with Llama 3.3.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured.")
        return "Groq API Key not configured. (Mock response)"

    # We use llama-3.3-70b-versatile as standard model
    # Wait, let's use a very standard model like llama-3.3-70b-versatile or llama3-8b-8192
    model_name = "llama-3.3-70b-versatile" if "llama-3.3" in model else model
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature
    }
    if response_format:
        payload["response_format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.error(f"Groq API error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Groq API error: {response.text}")
    except httpx.RequestError as e:
        logger.error(f"HTTP request error calling Groq: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Groq: {str(e)}")

async def call_groq_chat_stream(
    messages: List[Dict[str, str]],
    model: str = "llama-3.3-70b-specdec",
    temperature: float = 0.7
):
    """
    Call Groq API with Llama 3.3 and yield response chunks.
    """
    if not settings.GROQ_API_KEY:
        logger.info("GROQ_API_KEY is not configured, triggering fallback.")
        raise ValueError("GROQ_API_KEY not configured")

    model_name = "llama-3.3-70b-versatile" if "llama-3.3" in model else model
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
        "stream": True
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error(f"Groq API error {response.status_code}: {error_text}")
                raise RuntimeError(f"Groq API error {response.status_code}: {error_text.decode('utf-8', errors='ignore')}")

            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                if line == "data: [DONE]":
                    break
                if line.startswith("data: "):
                    try:
                        import json
                        data = json.loads(line[6:])
                        delta = data["choices"][0]["delta"]
                        if "content" in delta:
                            yield delta["content"]
                    except Exception as e:
                        logger.error(f"Error parsing streaming chunk: {e} for line: {line}")

async def call_gemini(
    contents: List[Dict[str, Any]],
    system_instruction: Optional[str] = None,
    model: str = "gemini-1.5-flash",
    temperature: float = 0.2
) -> str:
    """
    Call Gemini API with token-bucket rate limiting.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not configured.")
        return "Gemini API Key not configured. (Mock response)"

    # Enforce rate limit
    if not gemini_limiter.consume(1.0):
        logger.warning("Gemini API Rate limit exceeded. Try again later.")
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit exceeded. Please wait a moment before trying again."
        )

    # Gemini 1.5 API URL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    
    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError) as e:
                    logger.error(f"Unexpected Gemini response structure: {data}")
                    raise HTTPException(status_code=502, detail="Invalid response structure from Gemini API")
            else:
                logger.error(f"Gemini API error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Gemini API error: {response.text}")
    except httpx.RequestError as e:
        logger.error(f"HTTP request error calling Gemini: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Gemini: {str(e)}")

async def transcribe_audio_deepgram(audio_data: bytes, content_type: str = "audio/wav") -> str:
    """
    Transcribe audio bytes using Deepgram STT API.
    """
    if not settings.DEEPGRAM_API_KEY:
        logger.warning("DEEPGRAM_API_KEY is not configured.")
        raise HTTPException(status_code=500, detail="Deepgram API Key is not configured.")

    url = "https://api.deepgram.com/v1/listen?smart_format=true"
    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": content_type
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, content=audio_data)
            if response.status_code == 200:
                data = response.json()
                try:
                    transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
                    return transcript
                except (KeyError, IndexError) as e:
                    logger.error(f"Unexpected Deepgram response structure: {data}")
                    raise HTTPException(status_code=502, detail="Invalid response structure from Deepgram API")
            else:
                logger.error(f"Deepgram API error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Deepgram API error: {response.text}")
    except httpx.RequestError as e:
        logger.error(f"HTTP request error calling Deepgram: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Deepgram: {str(e)}")
