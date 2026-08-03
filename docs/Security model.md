# Security Model & Access Control: Saarathi & Kairo

This security model establishes the authentication, authorization, data protection, and API security protocols for **Saarathi**. Because the platform handles personal productivity data, voice notes, behavioral telemetry, and long-term vector memory, a defense-in-depth architecture is enforced across clients, the FastAPI backend, and cloud databases.

---

## 1. Authentication Architecture (Firebase Auth)

Authentication is centralized through **Firebase Auth**, providing secure token-based identity verification across mobile (Expo) and web (Vite React) clients.

* **Credential Handling:** Passwords and social tokens are handled entirely by Firebase Auth SDKs. Plaintext passwords are never stored in Firestore or backend databases.
* **Token Issuance:** Upon successful sign-in or registration via the modal, Firebase issues a short-lived JSON Web Token (**Firebase ID Token**).
* **Token Propagation:** Every protected request sent from the mobile or web client to the FastAPI backend includes this token in the header:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>

```



---

## 2. Backend Authorization & Middleware Verification

The **FastAPI Backend Gateway** enforces strict token verification on all protected endpoints using the **Firebase Admin SDK**.

### Token Verification Flow

1. **Interceptor:** FastAPI middleware intercepts incoming requests and extracts the `Authorization: Bearer <TOKEN>` header.
2. **Decoding:** The backend passes the token to `auth.verify_id_token(token)` via the Firebase Admin SDK.
3. **Identity Extraction:** If valid, the decoded claims (including the unique user ID `uid`) are attached to the request state (`request.state.uid`). If invalid or expired, FastAPI immediately returns a `401 Unauthorized` response.

```python
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        raise HTTPException(status_code=401, status_code="Invalid or expired authentication token")

```

---

## 3. Database Security Rules (Firestore & Supabase)

### A. Firestore Security Rules

Firestore security rules enforce strict row-level authorization, ensuring users can only read, write, or query documents matching their own authenticated `uid`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check ownership
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection: only owner can read/write their profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Tasks collection: user must own the 'uid' field
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
    }

    // All other user-scoped collections (habits, goals, brain_dump, analytics, etc.)
    match /{collection}/{documentId} {
      allow read, write: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
    }
  }
}

```

### B. Supabase PGVector Row-Level Security (RLS)

For long-term vector memory stored in Supabase PostgreSQL, Row-Level Security ensures vector embeddings are partitioned and queryable only by the matching user `uid`:

```sql
-- Enable RLS on vector embeddings table
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own vector embeddings
CREATE POLICY user_isolation_policy ON vector_embeddings
    FOR ALL
    USING (uid = current_setting('request.jwt.claim.sub', true));

```

---

## 4. API Security & Rate Limiting

To prevent API abuse, denial-of-service, or runaway LLM token loops with Groq and Deepgram, the backend incorporates safety mechanisms:

* **Redis-Backed Rate Limiting:** FastAPI uses Redis to track request frequencies per `uid`, throttling excessive calls to heavy endpoints (e.g., `/kairo/chat` or `/brain-dump/audio`).
* **Environment Secret Isolation:** Secret API keys (`GROQ_API_KEY`, `DEEPGRAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) reside exclusively in server-side environment variables and are never bundled into mobile or web client builds.
* **CORS Policy Restrictions:** FastAPI enforces a strict Cross-Origin Resource Sharing (CORS) policy, permitting requests only from authorized client domains and mobile origins.