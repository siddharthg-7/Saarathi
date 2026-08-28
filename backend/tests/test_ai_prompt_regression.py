import json
import pytest
from app.services.prompt_orchestration import (
    orchestrate_chat_prompt,
    orchestrate_daily_brief_prompt,
    orchestrate_brain_dump_prompt,
)

def test_chat_prompt_orchestration_schema_and_grounding():
    tasks = [
        {"id": "t1", "title": "Refactor auth middleware", "status": "pending", "energyRequired": "High", "category": "Work"},
        {"id": "t2", "title": "Read 20 pages", "status": "in_progress", "energyRequired": "Low", "category": "Personal"},
    ]
    goals = [
        {"id": "g1", "title": "Build Saarathi OS", "status": "in_progress"}
    ]
    memory_context = "<retrieved_memory_data>User prefers deep focus blocks before 11 AM.</retrieved_memory_data>"

    prompt = orchestrate_chat_prompt(
        location="Office Desk",
        energy="High",
        focus_mode=True,
        goals=goals,
        tasks=tasks,
        memories_context=memory_context
    )

    # Verify context injection
    assert "Current Location: Office Desk" in prompt
    assert "Current Energy: High" in prompt
    assert "Focus Mode Active: Yes" in prompt
    assert "Refactor auth middleware" in prompt
    assert "Build Saarathi OS" in prompt
    assert "<retrieved_memory_data>" in prompt

    # Verify JSON action schema instructions exist in system prompt
    assert '"reply":' in prompt
    assert '"actions":' in prompt
    assert '"type": "CREATE_TASK"' in prompt
    assert '"type": "RESCHEDULE_TASK"' in prompt

def test_daily_brief_prompt_structure():
    tasks = [
        {"id": "t-pr", "title": "Review PRs", "status": "pending", "category": "Dev", "energyRequired": "Medium", "deadline": "2026-08-28T18:00:00Z"},
    ]
    goals = [
        {"id": "g-mvp", "title": "Complete Saarathi MVP", "status": "in_progress", "description": "Finish Phases 1-16"},
    ]

    prompt = orchestrate_daily_brief_prompt(tasks, goals)
    assert "Review PRs" in prompt
    assert "Complete Saarathi MVP" in prompt
    assert "optimalFocusWindow" in prompt
    assert "insights" in prompt

def test_brain_dump_prompt_structure():
    raw_transcript = "I need to schedule dentist appointment next Tuesday at 3 PM and also buy milk"
    prompt = orchestrate_brain_dump_prompt(raw_transcript)
    assert raw_transcript in prompt
    assert "extractedTasks" in prompt or "tasks" in prompt
