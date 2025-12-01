# Cloudflare Workers + R2 Sync Setup

## 1. Create R2 Bucket

1. Go to https://dash.cloudflare.com/
2. Select **R2** from left sidebar
3. Click **Create bucket**
4. Name: `savena-wallets`
5. Click **Create bucket**

## 2. Deploy the Worker

```powershell
cd workers
npx wrangler login
npx wrangler r2 bucket create savena-wallets
npx wrangler deploy
```

After deployment, you'll get a URL like: `https://savena-sync-api.YOUR_SUBDOMAIN.workers.dev`

## 3. Update React App

Edit `src/services/syncService.js` line 4:
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://savena-sync-api.YOUR_SUBDOMAIN.workers.dev'  // Replace with your worker URL
  : 'http://localhost:8787';
```

## 4. Update CORS Settings

Edit `workers/wrangler.toml`:
```toml
[env.production]
vars = { ALLOWED_ORIGINS = "https://YOUR-PAGES-URL.pages.dev" }
```

## 5. Deploy Updated App

```powershell
git add .
git commit -m "Implement Cloudflare Workers sync"
git push
```

## 6. Store Password Securely

When user enables sync, store password in sessionStorage:
```javascript
sessionStorage.setItem('savena_wallet_password', password);
```

## How It Works

1. **Create Wallet**: POST to `/api/wallet/{walletId}` with initial data
2. **Join Wallet**: GET from `/api/wallet/{walletId}` to fetch data
3. **Auto-Sync**: PUT to `/api/wallet/{walletId}` every 30 seconds
4. **Password**: Sent via `Authorization: Bearer {password}` header
5. **Storage**: Data stored in R2 as JSON files

## API Endpoints

- `POST /api/wallet/{walletId}` - Create new wallet
- `GET /api/wallet/{walletId}` - Get wallet data (join existing)
- `PUT /api/wallet/{walletId}` - Update wallet data (sync)
- `DELETE /api/wallet/{walletId}` - Delete wallet
- `GET /api/health` - Health check

## Free Tier Limits

- **R2 Storage**: 10 GB/month
- **Worker Requests**: 100,000/day
- **Worker CPU**: 10ms per request

Perfect for personal use and small families!
