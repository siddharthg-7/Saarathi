# Product Requirements Document (PRD): Saarathi & Kairo

## 1. Executive Summary & Vision

### 1.1 Project Overview

**Saarathi** (powered by its AI assistant, **Kairo**) is an AI-powered Personal Productivity Operating System designed to move beyond traditional, static task managers. Rather than merely storing lists, Saarathi acts as an intelligent companion that unifies task management, calendar scheduling, voice brain-dumping, habit tracking, and behavioral analytics.

### 1.2 Vision Statement

> *"Saarathi is an AI-powered productivity operating system that learns, adapts, and grows with you. Powered by Kairo, it transforms scattered thoughts into actionable plans, predicts procrastination before it happens, optimizes your schedule around your energy, and becomes your long-term productivity companion."*

### 1.3 Target Audience

* Students, software developers, and professionals managing high-context workloads.
* Users seeking proactive guidance, automatic task structuring, and psychological feedback loops to combat procrastination and burnout.

---

## 2. Product Scope & Architecture

### 2.1 Multi-Platform Ecosystem

* **Mobile App:** Built with **React Native (Expo)**, optimized for iOS and Android, leveraging native voice pipelines and local notifications.
* **Web Dashboard:** Built with **Vite + React.js**, optimized for desktop browsers to provide deep analytical charts, workspace tracking, and extended Kairo chat sessions.
* **Shared Logic Layer:** 70–80% of business logic (Zustand state management, API clients, TypeScript types, and validation schemas) is shared across platforms via a monorepo design.

### 2.2 System Architecture Pipeline

```
[React Native / React Web Client]
       │
       ├──► [Firebase Authentication & Firestore] (Real-time Sync & State)
       │
       └──► [FastAPI Python Backend Gateway]
                 ├──► [Deepgram STT / TTS] (Voice Engine)
                 ├──► [Groq API / Llama 3.3] (LLM Reasoning & Task Extraction)
                 ├──► [Supabase PGVector] (Long-Term Vector Memory)
                 └──► [Scikit-Learn / XGBoost] (Behavioral ML Models)

```

---

## 3. Core Functional Modules & Requirements

### Module 1: Smart Task Management

* **Rich Schema Attributes:** Every task record contains Task Name, Estimated Time, Energy Required, Category, Difficulty, Importance, Urgency, AI Summary, Voice Recording attachments, Tags, Context, Mood, Location, Completion Confidence, Predicted Delay Score, and Habit Relations.
* **CRUD Operations:** Create, read, update, and delete tasks with real-time Firestore synchronization across mobile and web clients.

### Module 2: Kairo (AI Assistant) & Natural Language Intake

* **Conversational Planning:** Users can input raw text or natural phrasing (e.g., *"I have an interview tomorrow morning, need to revise DBMS, finish frontend, go gym"*).
* **Automated Structuring:** Kairo automatically decomposes inputs into discrete structured tasks with assigned priorities, deadlines, estimated durations, and energy levels.

### Module 3: Brain Dump Mode (Voice-to-Task Pipeline)

* **Audio Capture:** Record up to 2-minute voice notes.
* **Processing Flow:** Audio stream $\rightarrow$ **Deepgram STT** $\rightarrow$ **Groq (Llama 3.3)** (Task Extraction, Priority/Deadline Detection, Duplicate Removal) $\rightarrow$ **Firestore Database**.

### Module 4: Procrastination & Energy Prediction Engine

* **Machine Learning Telemetry:** Tracks historical completion times, postponements, focus sessions, energy levels, and contextual metadata (day, time, location).
* **Predictive Models:** Utilizes **Random Forest / XGBoost** to calculate completion, delay, and skip probabilities.
* **Energy Clustering:** **KMeans** clustering identifies optimal productivity windows (Morning, Afternoon, Night) to reorder task lists automatically.

### Module 5: Smart Scheduler & Context Awareness

* **Time-Blocking:** Automatically maps tasks against user calendars, deadlines, estimated durations, and energy levels.
* **Context Switching:** Automatically surfaces contextual tasks based on user location/environment (e.g., showing assignments/labs at College, workouts/reading at Home).

### Module 6: Focus Mode & Habit Engine

* **Focus Mode:** Minimalist UI layout featuring a built-in Pomodoro timer, ambient music triggers, and distraction-blocking elements.
* **Habit Engine:** Tracks streaks, completion percentages, failure ratios, and historical trends for long-term self-improvement.

### Module 7: Analytics Dashboard & Daily Briefing

* **Comprehensive Metrics:** Interactive charts visualizing completed tasks, average focus duration, deep work hours, energy trends, and procrastination heatmaps using Plotly/Victory Native.
* **The Daily Brief:** Every morning, Kairo greets the user with an intelligent daily summary reviewing past performance, predicted focus windows, and proactive scheduling suggestions.

---

## 4. Non-Functional Requirements

* **Performance:** Real-time client updates under 200ms via Firestore snapshot listeners; API response handling optimized via asynchronous FastAPI execution and Celery workers.
* **Security & Authentication:** Secure authentication handling via Firebase Auth; encrypted token management and environment-isolated API secrets.
* **Scalability:** Stateless FastAPI backend architecture designed to scale horizontally alongside Supabase vector storage and Firestore cloud infrastructure.
* **Reliability:** Graceful degradation fallbacks for AI/ML inference pipelines when API rate limits or network latencies occur.

---

## 5. Development Roadmap & Phased Execution

* **Phase 1 – Core MVP (2–3 weeks):**
* Firebase Authentication configuration.
* CRUD operations for tasks and subtasks.
* Basic local and remote notification hooks.
* Initial responsive UI setup for React Native (Expo) and Vite React (Web).


* **Phase 2 – AI Foundation:**
* Groq-powered AI integration and natural language task parsing.
* Deepgram STT/TTS voice integration pipeline.
* Supabase PGVector setup for long-term memory retrieval.


* **Phase 3 – ML Intelligence:**
* FastAPI telemetry logging infrastructure.
* Scikit-Learn/XGBoost training scripts for procrastination and energy prediction models.
* Kairo conversational context engine integration.


* **Phase 4 – Personal Operating System Polish:**
* Daily Briefing engine and advanced analytics dashboard visualization.
* Goal decomposition architecture and habit coaching feedback loops.