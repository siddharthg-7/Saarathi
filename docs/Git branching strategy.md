# Git Branching Strategy: Saarathi & Kairo

This branching strategy defines the workflow for version control, code review, and continuous deployment across the **Saarathi** monorepo (Mobile, Web, and FastAPI Backend).

It is designed to ensure stability, isolate experimental machine learning models, and keep releases organized.

---

## 1. Core Branch Architecture

```
main (Production Release)
  ▲
  │ (Pull Request & Code Review)
  │
dev (Integration & Staging)
  ▲
  ├── feature/voice-brain-dump (React Native Mobile)
  ├── feature/web-dashboard (Vite React Web)
  ├── feature/xgboost-procrastination (FastAPI Backend / ML)
  └── fix/firestore-sync-race-condition (Shared State)

```

### Branch Definitions

* **`main`:**
* The production-ready branch.
* Code here is stable, fully tested, and deployed to production environments (mobile app stores and web hosting).
* Direct commits to `main` are strictly prohibited.


* **`dev`:**
* The primary integration and staging branch.
* All feature branches merge here first for cross-platform integration testing (verifying that mobile, web, and backend sync correctly together).


* **`feature/<name>`:**
* Short-lived branches created off `dev` for developing specific modules, UI screens, or machine learning pipelines.


* **`fix/<name>`:**
* Scoped branches created to resolve bugs, styling issues, or state synchronization errors.



---

## 2. Git Workflow for Daily Development

### Step 1: Create a Feature Branch

Always branch off the latest `dev` branch and use descriptive naming conventions:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/voice-brain-dump

```

### Step 2: Commit Using Conventional Commits

Write clean, atomic commits following conventional commit prefixes:

```bash
git add .
git commit -m "feat(mobile): integrate deepgram audio recording hook"

```

### Step 3: Push and Open a Pull Request (PR)

Push your branch to GitHub and open a Pull Request targeting the **`dev`** branch (not `main`):

```bash
git push origin feature/voice-brain-dump

```

### Step 4: Code Review & Merge

* Ensure TypeScript compilation and Python linting checks pass successfully.
* Verify that real-time Firestore sync and API payloads match the defined **API Contracts**.
* Once approved, merge into `dev` using **Squash and Merge** to maintain a clean git history.

---

## 3. Release & Deployment Flow

1. **Staging Validation (`dev`):** Once all features for an MVP sprint or update are merged into `dev`, test the end-to-end flow across mobile and web.
2. **Merging to Production (`main`):** Open a Pull Request from `dev` to `main`.
3. **Tagging Releases:** Tag the release on `main` using semantic versioning tags for tracking:
```bash
git tag -a v1.0.0 -m "Release v1.0.0: Core MVP with Voice Brain Dump & Kairo AI"
git push origin v1.0.0

```