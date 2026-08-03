# Coding Standards & Best Practices: Saarathi & Kairo

To maintain high code quality, consistency, and type safety across the monorepo—spanning TypeScript (Mobile & Web) and Python (FastAPI Backend)—follow these rigorous coding standards.

---

## 1. TypeScript & Frontend Standards (Mobile & Web)

### A. Strict TypeScript Configuration

* **No `any` Types:** Avoid using `any`. Define explicit interfaces or types for all props, state variables, and API payloads in the shared `packages/types/` directory.
* **Null Safety:** Utilize optional chaining (`?.`) and nullish coalescing (`??`) to handle asynchronous data and Firestore documents safely.

### B. Component & File Structure

* **Functional Components:** Write all components as functional components using arrow functions with explicit return typing.
* **Separation of Concerns:** Keep business logic inside custom hooks or Zustand stores (`packages/store/`), leaving UI components focused purely on rendering and user interaction.
* **Naming Conventions:**
* Components & Files: **PascalCase** (e.g., `TaskCard.tsx`, `DailyBriefing.tsx`)
* Hooks: **camelCase** prefixed with `use` (e.g., `useTaskStore.ts`, `useAudioRecorder.ts`)
* Constants: **UPPER_SNAKE_CASE** (e.g., `DEFAULT_POMODORO_DURATION = 25`)



### C. Styling Standards

* **Mobile (NativeWind):** Use Tailwind utility classes via NativeWind. Avoid hardcoded inline style objects unless handling dynamic measurements (e.g., animated transforms).
* **Web (Tailwind CSS):** Keep class strings organized using logical grouping: layout (`flex`, `grid`), sizing (`w-full`, `h-auto`), spacing (`p-4`, `mb-2`), typography (`text-sm`, `font-medium`), and colors (`bg-gray-900 text-white`).

---

## 2. Python & FastAPI Backend Standards

### A. PEP 8 & Code Formatting

* **Style Guide:** Follow standard **PEP 8** guidelines. Use **Black** as the code formatter and **Flake8** or **Ruff** for linting.
* **Type Hinting:** Every function and method signature must include explicit Python type hints for arguments and return types.

```python
async def predict_task_skip_probability(task_id: str, postpone_count: int) -> float:
    """Calculates the skip probability for a given task using XGBoost."""
    ...

```

### B. Asynchronous Architecture

* **Async/Await:** Use `async/def` for all FastAPI route handlers, database calls (Firestore Async SDK / Supabase async client), and external API requests (Groq, Deepgram) to prevent thread blocking.

### C. Pydantic Data Validation

* **Request & Response Schemas:** Never accept raw dictionaries in FastAPI endpoints. Validate all incoming payloads and serialize outgoing responses using **Pydantic V2** models defined in `backend/app/models.py`.

---

## 3. Git & Version Control Standards

### A. Conventional Commits

Use semantic commit message prefixes to maintain a clean and understandable project history:

* `feat:` — Adding a new feature (e.g., `feat: integrate deepgram voice recording pipeline`)
* `fix:` — Fixing a bug or sync issue (e.g., `fix: resolve zustand persistence hydration bug`)
* `refactor:` — Code restructuring without feature changes (e.g., `refactor: extract ml inference into dedicated service`)
* `style:` — UI, styling, or formatting updates (e.g., `style: update glassmorphism card borders`)
* `docs:` — Documentation additions or updates (e.g., `docs: add api contract reference`)

### B. Branching Strategy

* `main` — Production-ready branch.
* `dev` — Integration branch for ongoing development.
* `feature/<feature-name>` — Scoped branches for specific modules (e.g., `feature/procrastination-predictor`).