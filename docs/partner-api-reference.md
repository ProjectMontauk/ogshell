# Partner API reference

Base URL (production): `https://www.thecitizen.io`  
All paths below are prefixed with `/api` unless noted.

Cross-origin browser access requires an **allowed `Origin`** (see `lib/cors.ts`). Partner origins such as Bitchute are included there.

**Exceptions (no CORS for browser widgets):**

- `GET /api/health` — same-origin / ops checks only.
- `POST /api/webhook` — Stripe server-to-server only; not for browser calls.

DateTime fields are ISO 8601 strings in JSON.

---

## Phase 1: embed / iframe widget

Partners can load the **full market experience** inside an `<iframe>` without rebuilding UI.

### URL

```
https://www.thecitizen.io/markets/<marketId>?embed=1
```

With `embed=1`:

- **Navbar** is compact: link to The Citizen, **Cash**, **Sign In** (wallet still works).
- **Site footer** is hidden.

### Framing (CSP)

`next.config.ts` sets **`Content-Security-Policy: frame-ancestors ...`** on `/markets/*`. Only listed origins (e.g. Bitchute + your own site + local dev) may embed. Add new partner domains there when onboarding.

### Minimal iframe

```html
<iframe
  src="https://www.thecitizen.io/markets/covid19?embed=1"
  title="Citizen market"
  style="width:100%;min-height:720px;border:0"
  allow="clipboard-write"
></iframe>
```

Optional: add `ref=your-tag` for attribution (read in-app if you wire analytics later).

CORS for **API** calls from the parent page is separate — see `lib/cors.ts`.

### `widget.js` loader (script tag)

Static file: **`/widget.js`** (served from `public/widget.js` in this repo).  
Production URL (use your canonical host, e.g. `https://www.thecitizen.io/widget.js`).

**Required:** `data-market-id` on the container — the script does not guess a market.

```html
<div
  id="citizen-widget"
  data-market-id="covid19"
  data-ref="bitchute"
  data-min-height="800px"
></div>
<script src="https://www.thecitizen.io/widget.js" async></script>
```

| Attribute | Required | Purpose |
|-----------|----------|---------|
| `data-market-id` | **yes** | Market slug (same as `/markets/:id`) |
| `data-base-url` | no | Override iframe origin (default = origin of `widget.js`) |
| `data-ref` | no | Appended as `ref=` on embed URL |
| `data-min-height` | no | iframe `min-height` (default `720px`) |
| `data-height` | no | iframe `height` |
| `data-title` | no | iframe `title` (a11y) |

**Multiple embeds:** use `data-citizen-widget` plus `data-market-id` on each container (you can omit `id` if each node is unique).

```html
<div data-citizen-widget data-market-id="fluoride"></div>
<div data-citizen-widget data-market-id="covid19"></div>
<script src="https://www.thecitizen.io/widget.js" async></script>
```

Framing rules (**`frame-ancestors`** in `next.config.ts`) still apply to the parent site.

---

## Evidence

### `GET /api/evidence?marketId=<string>`

**Query:** `marketId` (required).

**Response:** `Evidence[]` — array of objects:

| Field | Type | Notes |
|-------|------|--------|
| `id` | number | Primary key |
| `marketId` | string | e.g. `covid19` |
| `type` | string | `yes` or `no` |
| `title` | string | |
| `url` | string \| null | |
| `description` | string | |
| `netVotes` | number | |
| `createdAt` | string | ISO datetime |
| `walletAddress` | string | Submitter |

Sorted by `netVotes` descending.

**Other methods:** `POST` (create minimal row), `PATCH` (update `netVotes` by `id`) — same path file; partners usually use `submit-evidence` for creates.

---

### `POST /api/submit-evidence`

**Body (JSON):**

| Field | Required | Notes |
|-------|----------|--------|
| `marketId` | yes | string |
| `type` | yes | `yes` or `no` |
| `title` | yes | non-empty string |
| `url` | yes | non-empty string |
| `description` | optional | string; can be empty |
| `walletAddress` | yes | string |

**Response:** `{ success: true, data: Evidence }` — `data` matches `Evidence` row shape above.

---

### `POST /api/upload-evidence` (App Router)

**Body:** `multipart/form-data` (not JSON).

| Field | Notes |
|-------|--------|
| `file` | PDF only, max 10MB |
| `marketId` | string |
| `evidenceType` | string (e.g. yes/no) |

**Headers:** `X-API-Key` may be required depending on deployment (see your env).

**Response:** `{ success, fileUrl, filename, originalName, size }` — use `fileUrl` as evidence link after creating evidence via API if needed.

---

### `GET /api/evidence/discussion/[id]`

**Path:** `id` = numeric evidence id.

**Response:** single `Evidence` object or `404` `{ error }`.

---

## Odds history

### `GET /api/odds-history?marketId=<string>`

**Query:** `marketId` (required).

**Response:** `OddsHistory[]` — each object:

| Field | Type |
|-------|------|
| `id` | number |
| `marketId` | string |
| `yesProbability` | number |
| `noProbability` | number |
| `timestamp` | string (ISO) |

Sorted by `timestamp` ascending.

---

### `POST /api/odds-history`

**Body:** `{ marketId, yesProbability, noProbability, timestamp? }`  
`timestamp` optional (server default if omitted).

**Response:** created `OddsHistory` row.

**Headers:** `Access-Control-Allow-Headers` includes `X-API-Key` for preflight; confirm if your client must send it.

---

### `POST /api/record-odds`

**Body:** `{ marketId, yesProbability, noProbability, timestamp? }`

**Response:** `{ success: true, data: OddsHistory }` or error object.

---

## Evidence voting

### `POST /api/vote`

**Body:**

| Field | Notes |
|-------|--------|
| `evidenceId` | number |
| `walletAddress` | string |
| `voteType` | `upvote` only |
| `evidenceType` | `yes` or `no` (must match evidence side) |
| `marketId` | string |

**Response:** `{ netVotes, action }` — toggles vote; recomputes weighted `netVotes` on evidence.

---

### `GET /api/user-votes?walletAddress=&marketId=`

**Query:** both required strings.

**Response:** array of `{ evidenceId, voteWeight, createdAt }`.

---

## Comments

### `GET /api/comments?evidenceId=&walletAddress?`

**Query:** `evidenceId` (required). `walletAddress` optional — if set, includes current user’s vote on each top-level comment.

**Response:** array of comment trees (nested `replies`), each comment includes `userVote` when wallet provided; fields align with `Comment` model (`id`, `evidenceId`, `marketId`, `parentId`, `walletAddress`, `content`, `upvotes`, `downvotes`, `createdAt`, `updatedAt`, nested `replies`).

---

### `POST /api/comments`

**Body:** `{ evidenceId, content, walletAddress, parentId? }` — `parentId` for replies.

**Response:** created `Comment` (with `replies` include as returned by handler).

---

### `POST /api/comment-vote`

**Body:** `{ commentId, walletAddress, voteType }` — `voteType`: `upvote` or `downvote`.

**Response:** varies — `{ comment, action: 'removed' \| 'changed' \| 'added', voteType, ... }`.

---

## Trades & positions

### `POST /api/trade`

**Body:**

| Field | Notes |
|-------|--------|
| `walletAddress` | string |
| `marketTitle` | string |
| `marketId` | string |
| `outcome` | string (e.g. Yes/No as stored by app) |
| `shares` | number |
| `avgPrice` | number |
| `betAmount` | number |
| `toWin` | number |
| `status` | optional; default `OPEN` |

**Response:** created `Trade`:

| Field | Type |
|-------|------|
| `id` | number |
| `walletAddress` | string |
| `marketTitle` | string |
| `marketId` | string |
| `outcome` | string |
| `shares` | number |
| `avgPrice` | number |
| `betAmount` | number |
| `toWin` | number |
| `status` | string |
| `createdAt` | string |
| `updatedAt` | string |

---

### `GET /api/trade?walletAddress=<string>`

**Response:** `Trade[]` for that wallet, newest first.

---

### `POST /api/submit-trade`

Same **body** as `POST /api/trade`. **Response:** `{ success: true, data: Trade }`.

---

### `POST /api/update-user-position`

**Body:** `{ walletAddress, marketId, yesShares, noShares }` (numbers for shares).

**Response:** upserted `UserMarketPosition`:

| Field | Type |
|-------|------|
| `id` | number |
| `marketId` | string |
| `walletAddress` | string |
| `yesShares` | number |
| `noShares` | number |
| `lastUpdated` | string |

Also recalculates vote weights for that user in that market.

---

## PnL

### `GET /api/pnl-history?walletAddress=<string>`

**Response:** up to 50 `UserPnLHistory` rows, oldest first:

| Field | Type |
|-------|------|
| `id` | number |
| `walletAddress` | string |
| `pnl` | number |
| `timestamp` | string |

---

### `POST /api/pnl-history-update`

**Body:** `{ walletAddress }`

**Response:** new `UserPnLHistory` row (server recomputes PnL from all trades using on-chain marginal prices).

---

## Market ideas

### `GET /api/market-ideas`

**Response:** `MarketIdea[]`, sorted by `netVotes` desc:

| Field | Type |
|-------|------|
| `id` | number |
| `title` | string |
| `description` | string |
| `rules` | string |
| `netVotes` | number |
| `walletAddress` | string |
| `status` | string (`pending`, etc.) |
| `createdAt` | string |

---

### `POST /api/market-ideas`

**Body:** `{ title, walletAddress, description?, rules? }` — `title` and `walletAddress` required.

**Response:** created `MarketIdea`.

---

### `POST /api/market-idea-vote`

**Body:** `{ ideaId, walletAddress, voteType }` — `voteType` must be `upvote` (toggle off if already voted).

**Response:** `{ netVotes, action }`.

---

### `GET /api/market-idea-votes?walletAddress=<string>`

**Response:** array of `{ ideaId, voteWeight, createdAt }`.

---

## Deposits

### `GET /api/user-deposits?walletAddress=<string>`

**Response:**

```json
{
  "deposits": [ { "id", "walletAddress", "amount", "transactionHash", "createdAt" } ],
  "totalDeposits": number,
  "depositCount": number
}
```

---

### `POST /api/track-deposit`

**Body:** `{ walletAddress, amount, transactionHash? }`

**Response:** `{ success: true, deposit: UserDeposits }`

---

### `POST /api/add-test-deposit` / `POST /api/submit-test-deposit`

**Body:** `{ walletAddress }` — test-only credit path; errors if deposit already exists for wallet.

**Response:** success payload with `deposit` / `data` and message.

---

## Auto-deposit (App Router)

### `GET /api/auto-deposit?walletAddress=<string>`

**Response:** `{ hasReceivedAutoDeposit: boolean, autoDeposit: AutoDeposit | null }`  
`AutoDeposit`: `id`, `walletAddress`, `amount` (string), `transactionHash`, `createdAt`.

---

### `POST /api/auto-deposit`

**Body:** `{ walletAddress, amount, transactionHash? }`

**Response:** created record or error if already exists.

---

## Stripe / Nash (App Router)

### `POST /api/create-payment-intent`

**Body:** `{ amount, nashAmount, customerWallet }` — USD tier must exist in server price map.

**Response:** `{ url }` — Stripe Checkout URL for redirect.

---

### `POST /api/check-session-status`

**Body:** `{ sessionId }`

**Response:** session status object; fields include `alreadyProcessed`, `ready`, nested `session` (Stripe fields), optional `processedAt`, `status` from DB.

---

### `POST /api/mark-session-processed`

**Body:** `{ sessionId, nashAmount, customerWallet, purchaseAmount, status? }`

**Response:** `{ success: true, processedSession: ProcessedSession }`

---

### `POST /api/webhook`

Stripe-signed events only — **not for browser / partner `fetch`**.

---

## Diagnostics

### `GET /api/health`

**Response:** `{ status: 'healthy', timestamp, database: 'connected' }` or `500` unhealthy payload. **No CORS** for cross-origin widgets.

---

### `GET /api/test` (App Router)

**Response:** `{ message, timestamp }`.

---

### `GET /api/test-shares?amount=&outcome=`

**Query:** optional `amount` (number), `outcome` (`0` = Yes, `1` = No). Uses hardcoded market `"jfk"` in code for the contract read.

**Response:** `{ betAmountUsd, outcome, sharesWei, sharesHuman }`.

---

## Error shape (typical)

Many handlers return:

```json
{ "error": "message" }
```

Some include `details` for debugging.

---

## CORS preflight

For `POST`/`PATCH` with JSON, browsers send `OPTIONS` first. All listed routes (except `/api/health` and `/api/webhook`) implement `OPTIONS` with the same allowlist as `GET`/`POST` responses.

When testing with `curl`, send:

```bash
-H "Origin: https://www.bitchute.com"
```

and confirm response includes `Access-Control-Allow-Origin` matching that origin.
