# she-lab-site
Lab Website

## Spot the Bot setup

### Files to add
Place these new files at the repo root alongside `index.html`:

- `spot-the-bot.html`
- `spot-the-bot-polls.html`
- `spot-the-bot.js`
- `spot-the-bot-data.json`
- `worker.js`
- `wrangler.toml`

### Cloudflare Worker + D1

1. Create a D1 database (via dashboard or CLI).
2. Update `wrangler.toml` with your database ID and name.
3. Initialize the schema:

```sql
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  guess TEXT NOT NULL,
  section TEXT NOT NULL,
  truth_source TEXT NOT NULL,
  time_ms INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_votes_item_client ON votes (item_id, client_id);
CREATE INDEX IF NOT EXISTS idx_votes_truth_source ON votes (truth_source);
```

Run with:

```bash
wrangler d1 execute spot-the-bot --file ./schema.sql
```

4. Deploy the worker:

```bash
wrangler deploy
```

5. Route the worker to your domain (example):

```toml
# in wrangler.toml
routes = ["https://www.yourdomain.com/api/*"]
```

### Local testing

```bash
wrangler dev --local
```

Then visit:
- `http://127.0.0.1:8787/spot-the-bot.html`
- `http://127.0.0.1:8787/spot-the-bot-polls.html`

The frontend works without the worker (votes will just fail silently).
