# AMA Finance Manager — Complete Setup & Deployment Guide
**Copyright © 2026 AMA Global Inc. All Rights Reserved.**

---

## 📁 PROJECT FILE STRUCTURE

```
AMA-Finance-Manager/
├── index.html          ← Landing page (auto-redirects if logged in)
├── login.html          ← Login page
├── register.html       ← Registration page
├── dashboard.html      ← Main dashboard (all modules inside)
├── style.css           ← Complete stylesheet
├── app.js              ← All frontend JavaScript logic
├── appscript.gs        ← Google Apps Script backend
└── SETUP_GUIDE.md      ← This file
```

---

## 🚀 PART 1 — QUICK START (DEMO MODE)

The app runs **immediately** in Demo Mode using localStorage — no backend needed.

### Steps:
1. Download all files into one folder
2. Open `index.html` in your browser
3. Login with:  
   - **Username:** `demo`  
   - **Password:** `demo123`
4. Explore all features with sample data!

> ✅ Demo mode supports all features: add/edit/delete income, expenses, debts, payments, reports, and profile.

---

## ☁️ PART 2 — GOOGLE SHEETS + APPS SCRIPT SETUP

To connect to a real backend (Google Sheets as database):

### STEP 1 — Create Your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **New Spreadsheet**
2. Name it: `AMA Finance Manager Database`
3. Create **5 sheets** (tabs at the bottom) with exactly these names:
   - `Users`
   - `Income`
   - `Expenses`
   - `Debts`
   - `Payments`

4. Add these **header rows** to each sheet (Row 1):

**Users Sheet — Row 1:**
```
UserID | FullName | Email | Phone | Username | Password | DateCreated
```

**Income Sheet — Row 1:**
```
TransactionID | UserID | Source | Amount | Category | Date | Notes
```

**Expenses Sheet — Row 1:**
```
TransactionID | UserID | ExpenseName | Amount | Category | Date | Notes
```

**Debts Sheet — Row 1:**
```
DebtID | UserID | PersonName | Type | Amount | DueDate | Status | Notes | DateAdded
```

**Payments Sheet — Row 1:**
```
PaymentID | DebtID | AmountPaid | PaymentDate | RemainingBalance
```

5. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```

---

### STEP 2 — Set Up Google Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete all default code in the editor
3. Copy the **entire contents** of `appscript.gs` and paste it
4. On **Line 7**, replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'; // example
   ```
5. Click the **Save** button (disk icon) or press `Ctrl+S`
6. **Run the setup function once:**
   - In the function dropdown, select `setupSheets`
   - Click ▶️ **Run**
   - Grant permissions when prompted (click **Review permissions → Advanced → Go to AMA Finance Manager → Allow**)
   - You should see "Sheets initialized successfully!" in the logs

---

### STEP 3 — Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the ⚙️ gear icon next to "Select type" → Choose **Web app**
3. Fill in:
   - **Description:** AMA Finance Manager API v1
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` *(required for frontend access)*
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

### STEP 4 — Connect Frontend to Backend

1. Open `app.js` in a text editor
2. Find this section at the top:
   ```javascript
   const CONFIG = {
     API_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
     DEMO_MODE: true,   // Set to false after connecting Google Sheets
   ```
3. Replace `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with your deployed URL
4. Change `DEMO_MODE: true` → `DEMO_MODE: false`
5. Save the file

---

## 🌐 PART 3 — FREE DEPLOYMENT (GitHub Pages)

### Option A: GitHub Pages (Recommended — 100% Free)

1. Create a free account at [github.com](https://github.com)
2. Click **New Repository** — name it `ama-finance-manager`
3. Upload all your project files
4. Go to **Settings → Pages**
5. Under "Source", select **main branch** → click **Save**
6. Your app will be live at:
   ```
   https://YOUR_USERNAME.github.io/ama-finance-manager/
   ```

### Option B: Netlify (Drag & Drop — 100% Free)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign up for free
3. Drag and drop your entire project **folder** onto the Netlify dashboard
4. Your app is instantly live with a URL like:
   ```
   https://amazing-ama-finance.netlify.app
   ```
5. You can set a custom domain for free

### Option C: Vercel (Also Free)

1. Go to [vercel.com](https://vercel.com)
2. Import from GitHub or drag and drop
3. Click Deploy — done!

---

## 🔒 PART 4 — SECURING YOUR APPS SCRIPT

### Protect Your API Endpoint

1. **Add CORS headers** — the Apps Script already handles this via JSON responses
2. **Rate limiting** — for production, add a check in `doPost()`:
   ```javascript
   // Add at top of doPost():
   const lock = LockService.getScriptLock();
   lock.waitLock(10000);
   // ... your code ...
   lock.releaseLock();
   ```

3. **Restrict spreadsheet access:**
   - In Google Sheets → Share → Change to "Restricted"
   - Only you can see the data; the web app accesses it through Apps Script

4. **Add an API key** (optional):
   - In `appscript.gs`, add a secret key check in `doPost()` and `doGet()`
   - Pass the key from `app.js` as part of every request

5. **Do NOT expose your Spreadsheet ID** in frontend code — it stays only in Apps Script

---

## 🐛 PART 5 — COMMON ERRORS & FIXES

### Error: "Script is not authorized"
**Fix:** Re-run the `setupSheets` function and grant all required permissions.

### Error: "TypeError: Cannot read property..."
**Fix:** Check that all 5 sheets exist with exactly the correct names (case-sensitive).

### Error: CORS / fetch fails in browser
**Fix:** Make sure "Who has access" is set to **Anyone** (not "Anyone with link") in deployment settings.

### Error: "Quota exceeded"
**Fix:** Google Apps Script has a 6-minute execution limit and daily quotas. For heavy use, upgrade to Google Workspace.

### Error: Login says "Invalid credentials" even with correct password
**Fix:** The password hashing changed. Register a new account after deploying — the hash function uses a salt.

### App shows blank / white screen
**Fix:** Open browser DevTools (F12), check Console for errors. Usually a missing `Chart.js` CDN or a JavaScript syntax error.

### Demo mode data not persisting
**Fix:** Make sure localStorage is not blocked (Private/Incognito mode blocks it). Use a normal browser window.

### Google Sheet not updating
**Fix:** After editing `appscript.gs`, always create a **New Deployment** (not "Manage deployments → edit"). Old deployments cache the old code.

---

## 📊 PART 6 — GOOGLE SHEET COLUMN REFERENCE

| Sheet | Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I |
|-------|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| Users | UserID | FullName | Email | Phone | Username | Password | DateCreated | | |
| Income | TransactionID | UserID | Source | Amount | Category | Date | Notes | | |
| Expenses | TransactionID | UserID | ExpenseName | Amount | Category | Date | Notes | | |
| Debts | DebtID | UserID | PersonName | Type | Amount | DueDate | Status | Notes | DateAdded |
| Payments | PaymentID | DebtID | AmountPaid | PaymentDate | RemainingBalance | | | | |

---

## 🔄 PART 7 — UPDATING YOUR DEPLOYMENT

After making changes to `appscript.gs`:

1. Go to Apps Script editor
2. Make your changes
3. Click **Deploy → Manage deployments**
4. Click the ✏️ edit icon
5. Change "Version" to **New version**
6. Click **Deploy**

> ⚠️ Never edit an existing deployment without creating a new version — the URL stays the same but the code updates.

---

## 📱 PART 8 — FEATURES OVERVIEW

| Module | Features |
|--------|----------|
| **Auth** | Register, Login, Remember Me, Show/Hide Password, Session Management |
| **Dashboard** | 6 stat cards, income vs expenses chart, category donut chart, recent transactions |
| **Income** | Add, Edit, Delete, Search, Filter by category/date, Pagination |
| **Expenses** | Add, Edit, Delete, Search, Filter by category/date, Pagination |
| **Debt Manager** | Borrowed & Lent sections, Progress bars, Record payments, Auto-balance calc |
| **Reports** | Weekly/Monthly/Yearly, Bar chart, Donut chart, Print/Export |
| **Profile** | Edit name & phone, Change password, Account statistics |
| **Settings** | Dark/Light mode, Currency selector, Data export, Logout |

---

## 💡 TIPS FOR BEST EXPERIENCE

1. **Use Chrome or Firefox** for best performance
2. **Enable JavaScript** — the entire app relies on it
3. **Bookmark the dashboard URL** after login for quick access
4. **Export your data** regularly from Settings → Export All Data
5. **Switch currency** in Settings if you're not using Nigerian Naira
6. **Use the FAB button** (+ floating button) to quickly add transactions from any page

---

## 📞 SUPPORT

For issues or customizations:
- Check browser DevTools console (F12) for error messages
- Verify your Apps Script deployment URL is correct
- Make sure Google Sheet columns match exactly

---

*Built with ❤️ using HTML5, CSS3, Vanilla JavaScript, Google Sheets & Google Apps Script*  
*Copyright © 2026 AMA Global Inc. All Rights Reserved.*
