import os
import re
from pathlib import Path

# Identify repository root
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

# Patterns indicating accidental server secret leakage
SECRET_PATTERNS = [
    (r"gsk_[a-zA-Z0-9]{30,}", "Groq API Key"),
    (r"AIzaSy[a-zA-Z0-9_-]{33}", "Google / Gemini API Key (Private Key format)"),
    (r"service_role", "Supabase Service Role reference in client"),
    (r"-----BEGIN PRIVATE KEY-----", "Private RSA Key"),
]

def test_client_source_secrets_exposure():
    """
    Scans apps/web/src, apps/mobile/src, and packages/ for accidentally committed server secrets.
    """
    search_dirs = [
        ROOT_DIR / "apps" / "web" / "src",
        ROOT_DIR / "apps" / "mobile" / "src",
        ROOT_DIR / "packages",
    ]

    discovered_violations = []

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for file_path in search_dir.rglob("*.ts*"):
            # Ignore test files and node_modules
            if "node_modules" in str(file_path) or ".test." in str(file_path):
                continue
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for pattern, secret_type in SECRET_PATTERNS:
                    if secret_type == "Google / Gemini API Key (Private Key format)":
                        continue # Firebase web client apiKey has same prefix
                    if secret_type == "Supabase Service Role reference in client":
                        if "SUPABASE_SERVICE_ROLE_KEY" in content:
                            discovered_violations.append(f"{file_path}: Contains {secret_type}")
                    elif re.search(pattern, content):
                        discovered_violations.append(f"{file_path}: Contains {secret_type}")
            except Exception:
                pass

    assert len(discovered_violations) == 0, f"Discovered server secrets in client sources: {discovered_violations}"

def test_web_dist_bundle_secrets_exposure():
    """
    Scans the compiled web distribution bundle in apps/web/dist for server secret leakage.
    """
    web_dist_dir = ROOT_DIR / "apps" / "web" / "dist"
    if not web_dist_dir.exists():
        return

    bundle_violations = []
    for js_file in web_dist_dir.rglob("*.js"):
        content = js_file.read_text(encoding="utf-8", errors="ignore")
        if "SUPABASE_SERVICE_ROLE" in content or "gsk_" in content:
            bundle_violations.append(f"{js_file}: Contains server secrets")

    assert len(bundle_violations) == 0, f"Discovered server secrets in web dist bundle: {bundle_violations}"
