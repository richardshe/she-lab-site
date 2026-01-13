# Spot the Bot - Setup Guide

Complete setup instructions for deploying the "Spot the Bot" game on your static website with Cloudflare Workers backend.

## Table of Contents
1. [File Organization](#file-organization)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup (Cloudflare Worker)](#backend-setup-cloudflare-worker)
4. [Database Setup (D1)](#database-setup-d1)
5. [Testing Locally](#testing-locally)
6. [Deployment](#deployment)
7. [Adding Your Data](#adding-your-data)
8. [Troubleshooting](#troubleshooting)

---

## File Organization

Your repository should have this structure:

```
/
├── spot-the-bot.html           # Game page
├── spot-the-bot-polls.html     # Results/polls page
├── spot-the-bot.js             # Shared JavaScript logic
├── spot-the-bot-data.json      # Passage data (40 items)
├── styles.css                  # Updated with new classes
├── cloudflare-worker/
│   ├── worker.js               # Cloudflare Worker code
│   ├── wrangler.toml           # Worker configuration
│   └── schema.sql              # Database schema
└── ... (other site files)
```

All files are already in place except you need to expand `spot-the-bot-data.json` from 3 to 40 items.

---

## Frontend Setup

### 1. Update Navigation (Optional)

If you want to add "Spot the Bot" to your main navigation, edit the navbar in all pages:

```html
<nav>
  <a href="research.html">Research</a>
  <a href="people.html">People</a>
  <a href="publications.html">Publications</a>
  <a href="join.html">Join The Lab</a>
  <a href="spot-the-bot.html">Spot the Bot</a>  <!-- Add this line -->
</nav>
```

### 2. Test Frontend Locally

You can test the frontend without the backend by opening the HTML files in a browser:

```bash
# Option 1: Using Python's built-in server
python3 -m http.server 8000

# Option 2: Using Node.js http-server (install first: npm install -g http-server)
http-server -p 8000

# Then open: http://localhost:8000/spot-the-bot.html
```

**Note:** The frontend will work in "offline mode" without the backend. It will:
- Display passages correctly
- Allow voting
- Show correct/incorrect feedback
- NOT submit votes to the backend (will show "offline mode" message)
- NOT display aggregate statistics

---

## Backend Setup (Cloudflare Worker)

### Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com (free tier is sufficient)
2. **Domain on Cloudflare**: Your domain should be proxied through Cloudflare
3. **Wrangler CLI**: Install Cloudflare's CLI tool

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 1. Configure wrangler.toml

Edit `cloudflare-worker/wrangler.toml`:

```toml
# Get your account ID from Cloudflare dashboard
account_id = "your-account-id-here"

# Configure routes to match your domain
routes = [
  { pattern = "www.richardshelab.com/api/*", zone_name = "richardshelab.com" }
]
```

**To find your account ID:**
1. Go to Cloudflare Dashboard
2. Select your domain
3. Scroll down - Account ID is on the right sidebar

---

## Database Setup (D1)

### 1. Create D1 Database

```bash
cd cloudflare-worker

# Create production database
wrangler d1 create spot-the-bot-db

# The output will show your database ID. Copy it!
# Example output:
# Created database spot-the-bot-db
# UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 2. Update wrangler.toml with Database ID

Edit `wrangler.toml` and replace the placeholder:

```toml
[[d1_databases]]
binding = "DB"
database_name = "spot-the-bot-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Your actual ID here
```

### 3. Initialize Database Schema

```bash
# Apply the schema to your database
wrangler d1 execute spot-the-bot-db --file=schema.sql

# Verify the tables were created
wrangler d1 execute spot-the-bot-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see output showing the `votes` table was created.

### 4. (Optional) Create Development Database

For testing without affecting production:

```bash
wrangler d1 create spot-the-bot-db-dev
# Copy the dev database ID and add it to wrangler.toml under [env.development]
```

---

## Testing Locally

### 1. Test Worker Locally

```bash
cd cloudflare-worker

# Start local development server
wrangler dev --local

# Or test with remote D1 database
wrangler dev
```

This starts a local server at `http://localhost:8787`

### 2. Test API Endpoints

**Test vote submission:**

```bash
curl -X POST http://localhost:8787/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "S01",
    "guess": "bot",
    "section": "abstract",
    "truth_source": "chatgpt",
    "client_id": "test-client-123",
    "time_ms": 5000
  }'
```

**Test statistics retrieval:**

```bash
curl http://localhost:8787/api/stats
```

### 3. Test Frontend with Local Worker

Update `spot-the-bot.js` temporarily to point to local worker:

```javascript
const CONFIG = {
  DATA_URL: 'spot-the-bot-data.json',
  API_VOTE_URL: 'http://localhost:8787/api/vote',
  API_STATS_URL: 'http://localhost:8787/api/stats',
  // ...
};
```

Then open your site in a browser and test voting.

**Remember to change these back to `/api/vote` and `/api/stats` before deploying!**

---

## Deployment

### 1. Deploy Cloudflare Worker

```bash
cd cloudflare-worker

# Deploy to production
wrangler deploy

# Or deploy to a specific environment
wrangler deploy --env development
```

### 2. Configure Routes

**Option A: Via Dashboard (Recommended)**

1. Go to Cloudflare Dashboard → Workers & Pages → Overview
2. Click on your worker (`spot-the-bot-api`)
3. Go to Settings → Triggers
4. Add Route: `www.richardshelab.com/api/*`
5. Select your zone: `richardshelab.com`

**Option B: Via wrangler.toml (Already configured)**

The routes in `wrangler.toml` will be applied automatically during deployment.

### 3. Test Production Deployment

```bash
# Test vote endpoint
curl -X POST https://www.richardshelab.com/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "S01",
    "guess": "bot",
    "section": "abstract",
    "truth_source": "chatgpt",
    "client_id": "test-client-456",
    "time_ms": 3000
  }'

# Test stats endpoint
curl https://www.richardshelab.com/api/stats
```

### 4. Deploy Frontend Files

Push your changes to GitHub (or your hosting provider):

```bash
# Add all new files
git add spot-the-bot.html spot-the-bot-polls.html spot-the-bot.js spot-the-bot-data.json styles.css cloudflare-worker/

# Commit
git commit -m "Add Spot the Bot game with backend API"

# Push to your branch
git push origin your-branch-name
```

If using GitHub Pages, your site will automatically update after pushing.

---

## Adding Your Data

### 1. Expand spot-the-bot-data.json

Currently has 3 sample items. Expand to 40 items following this schema:

```json
{
  "id": "S04",
  "section": "abstract",
  "title": "Optional short description",
  "text": "Full passage text here (can be long, 150-800 words)",
  "truth": {
    "source": "human",
    "model_detail": "Written by Dr. Jane Smith",
    "shade_hex": "#4A90E2"
  }
}
```

**Valid values:**
- `section`: `"abstract"`, `"intro"`, or `"discussion"`
- `source`: `"human"`, `"chatgpt"`, `"claude"`, or `"gemini"`
- `shade_hex`: Any hex color (used for custom badge styling, optional)

**Recommended badge colors:**
- Human: `#4A90E2` (blue)
- ChatGPT: `#10a37f` (teal)
- Claude: `#d97757` (coral)
- Gemini: `#4285f4` (Google blue)

### 2. Balance Your Dataset

For best results:
- Mix of all 4 sources (human, ChatGPT, Claude, Gemini)
- Mix of all 3 sections (abstract, intro, discussion)
- Variety of topics and writing styles
- Some easier and some harder examples

---

## Troubleshooting

### Frontend Issues

**Problem:** Passage not displaying
- Check browser console for errors
- Verify `spot-the-bot-data.json` is valid JSON (use a JSON validator)
- Ensure file path is correct

**Problem:** Buttons not working
- Check that `spot-the-bot.js` loaded correctly
- Look for JavaScript errors in browser console

### Backend Issues

**Problem:** 404 errors on `/api/*` routes
- Verify worker is deployed: `wrangler deployments list`
- Check route configuration in Cloudflare dashboard
- Ensure domain is proxied through Cloudflare (orange cloud icon)

**Problem:** CORS errors
- Worker already includes CORS headers
- Make sure you're accessing via `https://` not `http://`
- Check browser console for specific CORS error details

**Problem:** Database errors
- Verify database exists: `wrangler d1 list`
- Check schema was applied: `wrangler d1 execute spot-the-bot-db --command="SELECT * FROM votes LIMIT 1;"`
- Make sure `database_id` in `wrangler.toml` is correct

**Problem:** Duplicate vote detection not working
- Check `client_id` is being stored in localStorage
- Verify timestamp calculation in worker code
- Test by voting twice on same item

### Testing Tips

1. **Check Worker Logs:**
   ```bash
   wrangler tail
   ```

2. **Query Database Directly:**
   ```bash
   wrangler d1 execute spot-the-bot-db --command="SELECT * FROM votes ORDER BY created_at DESC LIMIT 10;"
   ```

3. **Clear localStorage (for testing):**
   ```javascript
   // In browser console
   localStorage.clear();
   ```

4. **Test with different browsers/devices** to verify cross-platform compatibility

---

## Optional Enhancements

### Add Rate Limiting

Modify worker to limit votes per IP address:

```javascript
// Add to handleVote function
const clientIp = request.headers.get('CF-Connecting-IP');
// Implement rate limiting logic
```

### Add Analytics

Track additional metrics:
- Time spent per passage
- Accuracy by section
- Most confusing passages

### Custom Badge Colors

Each item can have a custom `shade_hex` in the data. Update CSS dynamically:

```javascript
sourceBadge.style.backgroundColor = currentItem.truth.shade_hex;
```

---

## Security Notes

1. **No PII stored** - Only anonymous UUIDs are tracked
2. **24-hour cooldown** - Prevents spam voting on same item
3. **Input validation** - Worker validates all inputs
4. **CORS configured** - Allows requests from your domain only (can be restricted further)

---

## Support

If you encounter issues:

1. Check Cloudflare Worker logs: `wrangler tail`
2. Verify D1 database status in Cloudflare Dashboard
3. Test API endpoints with `curl` to isolate frontend vs backend issues
4. Check browser console for JavaScript errors

---

## Summary Checklist

- [ ] Install Wrangler CLI and login
- [ ] Create D1 database
- [ ] Update `wrangler.toml` with account ID and database ID
- [ ] Apply database schema
- [ ] Test worker locally
- [ ] Deploy worker to Cloudflare
- [ ] Configure routes in Cloudflare dashboard
- [ ] Test production API endpoints
- [ ] Expand `spot-the-bot-data.json` to 40 items
- [ ] Push frontend files to GitHub
- [ ] Test game end-to-end in production
- [ ] Verify polls page shows statistics

---

**You're all set! The game should now be fully functional with vote tracking and statistics.**
