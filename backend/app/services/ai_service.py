import os
import json
import time
import httpx
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator, Tuple
from threading import Lock
from fastapi import HTTPException
from app.core.config import settings
from app.core.resilience.circuit_breaker import circuit_registry, CircuitBreakerOpenException
from app.core.resilience.backoff import retry_async
from app.core.resilience.error_classifier import classify_error, is_transient_error, ErrorCategory
from app.core.resilience.response_cache import llm_cache
from app.core.resilience.resilience_config import resilience_config
from app.services.stt.stt_service import stt_manager

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

async def _raw_call_groq(
    messages: List[Dict[str, str]],
    model: str = "openai/gpt-oss-120b",
    temperature: float = 0.7,
    response_format: Optional[Dict[str, Any]] = None
) -> str:
    """Internal raw HTTP call to Groq API with timeout and circuit tracking."""
    groq_cb = circuit_registry.get("groq")
    if not groq_cb.can_execute():
        health = groq_cb.get_health()
        raise CircuitBreakerOpenException("groq", health.get("openTimeRemainingSeconds", 30.0))

    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured.")
        return "Groq API Key not configured. (Mock response)"

    model_name = "openai/gpt-oss-120b" if ("llama-3.3" in model or "specdec" in model) else model
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

    start_time = time.time()
    try:
        timeout_sec = resilience_config.TIMEOUT_LLM_SECONDS
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            response = await client.post(url, headers=headers, json=payload)
            latency_ms = (time.time() - start_time) * 1000.0

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                groq_cb.record_success(latency_ms)
                return content
            else:
                logger.error(f"Groq API error {response.status_code}: {response.text}")
                err = HTTPException(status_code=response.status_code, detail=f"Groq API error: {response.text}")
                groq_cb.record_failure(err, latency_ms)
                raise err
    except httpx.RequestError as e:
        latency_ms = (time.time() - start_time) * 1000.0
        logger.error(f"HTTP request error calling Groq: {str(e)}")
        groq_cb.record_failure(e, latency_ms)
        raise HTTPException(status_code=500, detail=f"Failed to connect to Groq: {str(e)}")

async def call_groq_chat(
    messages: List[Dict[str, str]],
    model: str = "openai/gpt-oss-120b",
    temperature: float = 0.7,
    response_format: Optional[Dict[str, Any]] = None,
    cacheable: bool = False,
    cache_key: Optional[str] = None
) -> str:
    """
    Call Groq API with exponential backoff retry on transient errors and optional caching.
    """
    if cacheable and cache_key:
        cached = llm_cache.get(cache_key)
        if cached is not None:
            return cached

    async def _op():
        return await _raw_call_groq(messages, model, temperature, response_format)

    result = await retry_async(_op, operation_name="LLM:Groq")
    if cacheable and cache_key and result:
        llm_cache.set(cache_key, result)
    return result

async def call_groq_chat_stream(
    messages: List[Dict[str, str]],
    model: str = "openai/gpt-oss-120b",
    temperature: float = 0.7
) -> AsyncGenerator[str, None]:
    """
    Call Groq API and yield response chunks with circuit breaker protection.
    """
    groq_cb = circuit_registry.get("groq")
    if not groq_cb.can_execute():
        health = groq_cb.get_health()
        raise CircuitBreakerOpenException("groq", health.get("openTimeRemainingSeconds", 30.0))

    if not settings.GROQ_API_KEY:
        logger.info("GROQ_API_KEY is not configured, triggering fallback.")
        raise ValueError("GROQ_API_KEY not configured")

    model_name = "openai/gpt-oss-120b" if ("llama-3.3" in model or "specdec" in model) else model
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
    
    start_time = time.time()
    try:
        timeout_sec = resilience_config.TIMEOUT_LLM_SECONDS
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                latency_ms = (time.time() - start_time) * 1000.0
                if response.status_code != 200:
                    error_body = await response.aread()
                    logger.error(f"Groq stream error {response.status_code}: {error_body.decode('utf-8')}")
                    err = HTTPException(status_code=response.status_code, detail="Groq streaming failed")
                    groq_cb.record_failure(err, latency_ms)
                    raise err
                
                groq_cb.record_success(latency_ms)
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0].get("delta", {})
                            if "content" in delta and delta["content"]:
                                yield delta["content"]
                        except Exception as e:
                            logger.error(f"Error parsing streaming chunk: {e} for line: {line}")
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000.0
        groq_cb.record_failure(e, latency_ms)
        raise e

async def _raw_call_gemini(
    contents: List[Dict[str, Any]],
    system_instruction: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    temperature: float = 0.2
) -> str:
    """Internal raw HTTP call to Gemini API with token-bucket limiter and circuit breaker."""
    gemini_cb = circuit_registry.get("gemini")
    if not gemini_cb.can_execute():
        health = gemini_cb.get_health()
        raise CircuitBreakerOpenException("gemini", health.get("openTimeRemainingSeconds", 30.0))

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not configured.")
        return "Gemini API Key not configured. (Mock response)"

    # Enforce rate limit
    if not gemini_limiter.consume(1.0):
        logger.warning("Gemini API Rate limit exceeded.")
        err = HTTPException(
            status_code=429,
            detail="Gemini API rate limit exceeded. Please wait a moment before trying again."
        )
        gemini_cb.record_failure(err)
        raise err

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {"temperature": temperature}
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    start_time = time.time()
    try:
        timeout_sec = resilience_config.TIMEOUT_LLM_SECONDS
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            response = await client.post(url, headers=headers, json=payload)
            latency_ms = (time.time() - start_time) * 1000.0

            if response.status_code == 200:
                data = response.json()
                try:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    gemini_cb.record_success(latency_ms)
                    return text
                except (KeyError, IndexError) as e:
                    logger.error(f"Unexpected Gemini response structure: {data}")
                    err = HTTPException(status_code=502, detail="Invalid response structure from Gemini API")
                    gemini_cb.record_failure(err, latency_ms)
                    raise err
            else:
                logger.error(f"Gemini API error {response.status_code}: {response.text}")
                err = HTTPException(status_code=response.status_code, detail=f"Gemini API error: {response.text}")
                gemini_cb.record_failure(err, latency_ms)
                raise err
    except httpx.RequestError as e:
        latency_ms = (time.time() - start_time) * 1000.0
        logger.error(f"HTTP request error calling Gemini: {str(e)}")
        gemini_cb.record_failure(e, latency_ms)
        raise HTTPException(status_code=500, detail=f"Failed to connect to Gemini: {str(e)}")

async def call_gemini(
    contents: List[Dict[str, Any]],
    system_instruction: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    temperature: float = 0.2,
    cacheable: bool = False,
    cache_key: Optional[str] = None
) -> str:
    """
    Call Gemini API with exponential backoff retry on transient errors.
    """
    if cacheable and cache_key:
        cached = llm_cache.get(cache_key)
        if cached is not None:
            return cached

    async def _op():
        return await _raw_call_gemini(contents, system_instruction, model, temperature)

    result = await retry_async(_op, operation_name="LLM:Gemini")
    if cacheable and cache_key and result:
        llm_cache.set(cache_key, result)
    return result

async def call_resilient_chat_llm(
    messages: List[Dict[str, str]],
    system_instruction: Optional[str] = None,
    model: str = "llama-3.3-70b-specdec",
    temperature: float = 0.7,
    cacheable: bool = False,
    cache_key: Optional[str] = None
) -> Tuple[str, str]:
    """
    Resilient Unified LLM Invocation Pipeline:
    1. Check Response Cache (if cacheable).
    2. Try Primary Groq LLM with backoff retry on transient errors.
    3. On Groq failure / circuit open -> Fallback to Gemini with backoff retry.
    4. On Gemini failure -> Return safe degraded fallback response (Level 2 Degradation).
    Returns: (response_text, provider_used)
    """
    if cacheable and cache_key:
        cached = llm_cache.get(cache_key)
        if cached is not None:
            return cached, "cache"

    # 1. Try Primary Groq
    groq_cb = circuit_registry.get("groq")
    if groq_cb.can_execute():
        try:
            res = await call_groq_chat(messages, model=model, temperature=temperature)
            if res and res.strip():
                if cacheable and cache_key:
                    llm_cache.set(cache_key, res)
                return res, "groq"
        except Exception as e:
            category = classify_error(e)
            if category in (ErrorCategory.INVALID_REQUEST, ErrorCategory.VALIDATION_ERROR):
                # Never fallback on malformed client requests
                raise e
            logger.warning(f"[AI Fallback] Groq primary failed ({e}). Attempting Gemini fallback...")

    # 2. Try Fallback Gemini
    gemini_cb = circuit_registry.get("gemini")
    if gemini_cb.can_execute():
        try:
            gemini_contents = []
            for msg in messages:
                if msg.get("role") != "system":
                    gemini_contents.append({
                        "role": "model" if msg.get("role") == "assistant" else "user",
                        "parts": [{"text": msg.get("content", "")}]
                    })
            sys_prompt = system_instruction or next((m["content"] for m in messages if m.get("role") == "system"), None)
            res = await call_gemini(gemini_contents, system_instruction=sys_prompt, temperature=temperature)
            if res and res.strip():
                if cacheable and cache_key:
                    llm_cache.set(cache_key, res)
                return res, "gemini"
        except Exception as e:
            category = classify_error(e)
            if category in (ErrorCategory.INVALID_REQUEST, ErrorCategory.VALIDATION_ERROR):
                raise e
            logger.error(f"[AI Fallback] Gemini fallback failed: {e}")

    # 3. Graceful Degradation Level 2 Fallback
    logger.warning("[AI Degradation] Both Groq and Gemini unavailable. Returning safe deterministic response.")
    safe_reply = "Kairo is currently operating in offline mode. Core tasks and schedules remain safe."
    return safe_reply, "local_fallback"

async def transcribe_audio_deepgram(audio_data: bytes, content_type: str = "audio/wav") -> str:
    """
    Backward-compatible STT entry point delegating to resilient STT manager.
    """
    transcript, _ = await stt_manager.transcribe(audio_data, content_type=content_type)
    return transcript
