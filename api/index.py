import sys
import os

# Add the project root to the python path so it can find the backend module
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app.main import app
