# Wallet Sync Setup Guide

## 🎯 Overview
Savena now supports wallet syncing across multiple devices using PouchDB + CouchDB. Family members can share the same wallet and all changes sync automatically!

---

## 📋 Quick Start Options

### Option 1: IBM Cloudant (Recommended - FREE)

**Why Cloudant?**
- ✅ **FREE tier**: 1GB storage, 20 reads/writes per second
- ✅ Managed service (no server maintenance)
- ✅ Global availability
- ✅ Built-in security

**Setup Steps:**

1. **Create IBM Cloud Account**
   - Go to: https://cloud.ibm.com/registration
   - Sign up (free, no credit card required for Lite tier)

2. **Create Cloudant Instance**
   - Go to: https://cloud.ibm.com/catalog/services/cloudant
   - Select "Lite" plan (FREE)
   - Choose a region near you
   - Click "Create"

3. **Get Your URL**
   - Open your Cloudant instance
   - Go to "Service Credentials"
   - Click "New Credential"
   - Copy the `url` field (looks like: `https://xxxxx.cloudantnosqldb.appdomain.cloud`)

4. **Enable CORS**
   - In Cloudant dashboard, go to "CORS" section
   - Enable CORS for your domain or use `*` for all origins (development)
   - Add allowed origins: `http://localhost:5173`, your production URL

5. **Use in Savena**
   - Go to Settings → Data Management
   - Toggle "Wallet Sync" ON
   - Click "Create New Wallet"
   - Paste your Cloudant URL
   - Optional: Add password for security
   - Share the Wallet ID with family!

---

### Option 2: Self-Hosted CouchDB (FREE, Full Control)

**For Advanced Users:**

1. **Install CouchDB**
   
   **Using Docker (easiest):**
   ```bash
   docker run -d --name couchdb \
     -e COUCHDB_USER=admin \
     -e COUCHDB_PASSWORD=your_password \
     -p 5984:5984 \
     couchdb:latest
   ```

   **Manual Install:**
   - Download from: https://couchdb.apache.org/
   - Follow installation guide for your OS

2. **Configure CORS**
   ```bash
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
   ```

3. **Make Accessible**
   - Use ngrok for testing: `ngrok http 5984`
   - Or deploy to cloud: Railway, Fly.io, DigitalOcean

4. **Use in Savena**
   - URL format: `http://username:password@your-domain.com`
   - Or: `https://your-couchdb.railway.app`

---

### Option 3: Free Hosting Services

**Fly.io (FREE tier):**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Create CouchDB app
fly launch --image couchdb:latest
fly secrets set COUCHDB_USER=admin COUCHDB_PASSWORD=yourpass
fly deploy
```

**Railway (FREE tier):**
- Go to: https://railway.app
- Click "New Project" → "Deploy CouchDB"
- Get the public URL
- Use in Savena

---

## 🔐 Security Best Practices

### 1. Always Use Password Protection
When creating a wallet in Savena, set a strong password. This prevents unauthorized access even if someone gets your Wallet ID.

### 2. Don't Share Credentials Publicly
- Share Wallet ID + Password privately (Signal, WhatsApp, in-person)
- Don't post in public forums or screenshots

### 3. Use HTTPS in Production
For self-hosted CouchDB:
- Use Let's Encrypt SSL certificate
- Or deploy behind Cloudflare

### 4. Limit Database Access
In Cloudant/CouchDB, set up:
- Database-specific users
- Read/write permissions
- IP allowlists (if possible)

---

## 👨‍👩‍👧‍👦 Family Sharing Workflow

### Person A (Creates Wallet):
1. Go to Settings → Wallet Sync
2. Toggle ON → "Create New Wallet"
3. Enter CouchDB URL
4. Set password
5. Get Wallet ID (or scan QR code)
6. Share with family via:
   - Screenshot QR code
   - Copy/paste Wallet ID + URL + Password

### Person B (Joins Wallet):
1. Go to Settings → Wallet Sync
2. Toggle ON → "Join Existing Wallet"
3. Enter:
   - Wallet ID (from Person A)
   - CouchDB URL (same as Person A)
   - Password (same as Person A)
4. Click "Join Wallet"
5. App syncs automatically!

### Both Devices:
- ✅ All changes sync in real-time
- ✅ Works offline (syncs when back online)
- ✅ See each other's transactions instantly
- ✅ Shared balance across devices

---

## 🔧 Troubleshooting

### "Failed to create wallet"
- ✅ Check CouchDB URL is correct
- ✅ Ensure CORS is enabled
- ✅ Verify CouchDB is running
- ✅ Test URL in browser (should show: `{"couchdb":"Welcome",...}`)

### "Failed to join wallet"
- ✅ Verify Wallet ID is correct (case-sensitive)
- ✅ Check password matches
- ✅ Ensure creator has synced at least once

### "Sync not working"
- ✅ Check internet connection
- ✅ Verify CouchDB is accessible
- ✅ Check browser console for errors
- ✅ Try toggling sync OFF then ON

### "Conflict errors"
- This is normal! PouchDB handles conflicts automatically
- Last write wins
- Both devices will eventually sync to same state

---

## 💡 Tips & Tricks

### Automatic Sync
- Changes sync every few seconds when online
- Manual sync: Toggle OFF then ON in Settings

### Multiple Wallets
- Create different wallets for:
  - Personal expenses
  - Family shared expenses
  - Business transactions
- Switch between wallets by connecting to different Wallet IDs

### Backup Strategy
1. Keep local data (IndexedDB) as backup
2. Export JSON monthly (Settings → Export Data)
3. CouchDB acts as cloud backup + sync
4. Can restore from any source

### Offline Mode
- App works 100% offline
- Changes queued locally
- Auto-syncs when connection restored
- No data loss!

---

## 📊 Limits & Quotas

### IBM Cloudant (FREE Tier)
- Storage: 1GB
- Throughput: 20 reads/writes per second
- Enough for: ~1000 users or ~10,000 transactions

### Self-Hosted CouchDB
- No limits (your server capacity)
- Typical VPS: 1GB RAM = supports 100s of concurrent users

---

## 🆘 Need Help?

1. Check browser console for errors (F12)
2. Verify CouchDB is accessible: `curl <your-url>`
3. Test CORS: Use browser Network tab
4. Join community discussions
5. Read CouchDB docs: https://docs.couchdb.org/

---

## 🎉 You're All Set!

Now you and your family can manage finances together with real-time sync across all devices!

**Happy syncing! 💰**
