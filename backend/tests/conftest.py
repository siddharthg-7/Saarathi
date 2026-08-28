import os
import sys
from pathlib import Path

# Add backend root to sys.path so 'app' is resolvable across all pytest tests
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure test environment variables
os.environ["ENVIRONMENT"] = "development"
os.environ["FIREBASE_PROJECT_ID"] = "saarathi-test"
