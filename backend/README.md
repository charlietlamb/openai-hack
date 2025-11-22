# Character Response Backend

Flask backend for generating character responses using OpenAI GPT models.

## Local Development

### Prerequisites

- Python 3.11+
- Redis server (or Upstash Redis URL)
- OpenAI API key

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export REDIS_URL="redis://localhost:6379"  # or your Redis URL
```

3. Start Redis (if running locally):
```bash
redis-server
```

4. Run the Flask app:
```bash
python app.py
```

The server will start on `http://localhost:5037`

## API Endpoints

- `POST /api/question` - Ask a question to 100 characters
- `POST /api/conversation` - Have a conversation with a specific character
- `GET /api/characters` - Get all cached character data
- `GET /api/characters/<id>` - Get specific character data
- `GET /api/health` - Health check endpoint

## Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Project Structure

- `app.py` - Main Flask application
- `api/index.py` - Vercel serverless function entry point
- `generateResponses.py` - Original script (kept for reference)
- `requirements.txt` - Python dependencies
- `vercel.json` - Vercel configuration

