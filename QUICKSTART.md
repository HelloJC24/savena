# Savena - Quick Start Guide

## 🚀 Getting Started

### Step 1: Installation
The dependencies are already installed. If you need to reinstall:
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Step 3: Using the App

#### Create Your First Account
1. Navigate to the **Accounts** tab
2. Click the **+** button
3. Fill in:
   - Account name (e.g., "Savings", "Checking")
   - Description (optional)
   - Initial balance
   - Choose an icon and color
4. Click **Create Account**

#### Add a Transaction
1. Go to **Dashboard** or **Transactions** tab
2. Click **Deposit** or **Withdraw**
3. Select the account
4. Enter:
   - Amount
   - Description
   - Category (optional)
   - Date
5. Click **Add Deposit** or **Add Withdrawal**

#### Filter Transactions
1. Go to **Transactions** tab
2. Click **Show Filters**
3. Filter by:
   - Account
   - Transaction type (Deposit/Withdrawal)
   - Date range
   - Sort by date, amount, or creation time

## 📱 Installing as PWA

### On iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### On Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. Tap "Add"

### On Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click it and select "Install"

## 🔧 Configuration

### API Integration (Optional)
To connect with Fruitask Developer API:

1. Copy `.env.example` to `.env.local`:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and add your API credentials:
```env
VITE_API_BASE_URL=https://api.fruitask.com
VITE_API_KEY=your-api-key-here
```

3. Update `src/services/api.js` to use environment variables:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
```

## 🏗️ Building for Production

### Build the app:
```bash
npm run build
```

The production files will be in the `dist/` folder.

### Preview production build:
```bash
npm run preview
```

## 🌐 Deployment Options

### Option 1: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Option 2: Netlify
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Follow the prompts

### Option 3: GitHub Pages
1. Install gh-pages: `npm i -D gh-pages`
2. Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/savena"
}
```
3. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/savena/',
  // ... rest of config
})
```
4. Run: `npm run deploy`

### Option 4: Static Hosting
Simply upload the `dist/` folder contents to any static hosting service:
- Firebase Hosting
- AWS S3 + CloudFront
- Azure Static Web Apps
- Cloudflare Pages

## 📊 Data Management

### Export Data
1. Go to **Settings** tab
2. Click **Export Data**
3. Save the JSON file as backup

### Clear All Data
1. Go to **Settings** tab
2. Click **Clear All Data**
3. Confirm the action

**Warning**: This will delete all accounts and transactions permanently!

## 🔍 Troubleshooting

### App not loading?
- Clear browser cache
- Check browser console for errors
- Ensure JavaScript is enabled

### Transactions not updating?
- Refresh the page
- Check if IndexedDB is enabled in your browser
- Try in an incognito/private window

### PWA not installing?
- Ensure you're using HTTPS (required for PWA)
- Check browser compatibility
- Try a different browser

### Build errors?
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (20.11+)

## 🎨 Customization

### Change App Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      ios: {
        blue: '#YOUR_COLOR',
        // ... other colors
      }
    }
  }
}
```

### Add New Transaction Categories
Edit `src/utils/constants.js`:
```javascript
export const WITHDRAWAL_CATEGORIES = [
  { value: 'custom', label: 'Custom Category', icon: '🎯' },
  // ... existing categories
];
```

### Change App Name
1. Update `index.html`: Change `<title>`
2. Update `vite.config.js`: Change manifest `name` and `short_name`
3. Update `src/utils/constants.js`: Change `APP_NAME`

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev/guide/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

## 💡 Tips

1. **Backup Regularly**: Use the export feature to backup your data
2. **Use Categories**: Categorize transactions for better insights
3. **Multiple Accounts**: Create separate accounts for different purposes
4. **Regular Updates**: Keep track of transactions daily for accuracy
5. **Filter Smart**: Use filters to analyze spending patterns

## 🆘 Need Help?

Check the app's **Settings** page for:
- App version information
- Data management options
- API configuration status

---

**Happy Tracking! 💰**
