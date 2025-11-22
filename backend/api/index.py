"""
Vercel serverless function entry point for Flask application.
"""
import sys
from pathlib import Path

# Add parent directory to path to import shared modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from generateResponses import app

# Vercel expects the app variable
# This will be automatically detected by Vercel's Python runtime
__all__ = ['app']

