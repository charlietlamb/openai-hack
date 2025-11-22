# Quick Start: Deploy to Vercel

## Fastest Way to Deploy

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Set Up Upstash Redis (Free Tier Available)
1. Go to https://console.upstash.com/
2. Create a Redis database
3. Copy the `REDIS_URL`

### 3. Deploy
```bash
cd backend
vercel login
vercel
```

### 4. Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables:

- `OPENAI_API_KEY` = your OpenAI API key
- `REDIS_URL` = your Upstash Redis URL (format: `redis://default:password@host:port`)

### 5. Redeploy
```bash
vercel --prod
```

## Important Notes

### Character Data File
The app needs access to `frontend/public/characters/data/all-characters.json`.

**Option A**: Deploy from project root (recommended)
- Set Vercel root directory to project root
- The file will be accessible

**Option B**: Copy character data to backend
- Copy `frontend/public/characters/data/all-characters.json` to `backend/data/`
- Update path in code if needed

**Option C**: Use environment variable
- Upload JSON to a CDN or storage
- Set `CHARACTERS_DATA_PATH` environment variable

### Prompt Files
If you have `prompts/introduction.txt`, `pre.txt`, `post.txt` files:
- Copy them to `backend/prompts/` directory, OR
- Set environment variables: `PROMPT_INTRODUCTION`, `PROMPT_PRE`, `PROMPT_POST`

## Testing Your Deployment

After deployment, test the health endpoint:
```bash
curl https://your-project.vercel.app/api/health
```

Then test a question:
```bash
curl -X POST https://your-project.vercel.app/api/question \
  -H "Content-Type: application/json" \
  -d '{"question": "Should I buy these shoes?"}'
```

## Troubleshooting

**Redis connection errors?**
- Verify `REDIS_URL` is set correctly
- Check Upstash dashboard for connection status

**Character data not found?**
- Verify the JSON file path is correct
- Check that file is included in deployment

**Function timeout?**
- Reduce concurrent requests in `promptCharacters` function
- Consider processing fewer characters per request

