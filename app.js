/* ============================================================
   AMA Finance Manager — Main Application JS
   Copyright © 2026 AMA Global Inc. All Rights Reserved.
   ============================================================ */

'use strict';

// ============================================================
// CONFIG — Replace with your deployed Google Apps Script URL
// ============================================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxWip9kf8auTiN6gPXWtISvm6P2tjPbVECqktyD1ouzVv4bblhyARTzaicHvFjtl6ku6g/exec',
  DEMO_MODE: true,   // Set to false after connecting Google Sheets
  CURRENCY: '₦',
  APP_NAME: 'AMA Finance Manager'
};

// ============================================================
// DEMO DATA (used when DEMO_MODE = true)
// ============================================================
const DEMO_USERS = [
  { userId:'USR_DEMO_001', fullName:'Demo User', email:'demo@ama.com', phone:'+234 800 000 0000', username:'demo', password:'demo123' }
];

const DEMO_INCOME = [
  { transactionId:'INC_001', source:'Monthly Salary',   amount:350000, category:'Salary',    date:'2026-05-01', notes:'May salary' },
  { transactionId:'INC_002', source:'Freelance Design',  amount:80000,  category:'Freelance', date:'2026-05-05', notes:'Logo project' },
  { transactionId:'INC_003', source:'Business Profit',   amount:120000, category:'Business',  date:'2026-04-28', notes:'April profit' },
  { transactionId:'INC_004', source:'Monthly Salary',    amount:350000, category:'Salary',    date:'2026-04-01', notes:'April salary' },
  { transactionId:'INC_005', source:'Gift from Uncle',   amount:50000,  category:'Gifts',     date:'2026-03-15', notes:'Birthday gift' },
  { transactionId:'INC_006', source:'Affiliate Income',  amount:45000,  category:'Other',     date:'2026-03-20', notes:'Amazon affiliate' }
];

const DEMO_EXPENSES = [
  { transactionId:'EXP_001', expenseName:'Rent Payment',         amount:80000, category:'Rent',      date:'2026-05-02', notes:'Monthly rent' },
  { transactionId:'EXP_002', expenseName:'Groceries & Food',     amount:35000, category:'Food',      date:'2026-05-08', notes:'Weekly market' },
  { transactionId:'EXP_003', expenseName:'DSTV Subscription',    amount:8500,  category:'Internet',  date:'2026-05-10', notes:'Monthly sub' },
  { transactionId:'EXP_004', expenseName:'Transport (Uber)',      amount:12000, category:'Transport', date:'2026-05-12', notes:'Work commute' },
  { transactionId:'EXP_005', expenseName:'School Fees',          amount:75000, category:'School',    date:'2026-04-15', notes:'Term 2 fees' },
  { transactionId:'EXP_006', expenseName:'Electricity Bill',     amount:15000, category:'Electricity',date:'2026-04-20', notes:'AEDC bill' },
  { transactionId:'EXP_007', expenseName:'Medical Checkup',      amount:18000, category:'Medical',   date:'2026-04-22', notes:'Doctor visit' },
  { transactionId:'EXP_008', expenseName:'Personal Care Items',  amount:9500,  category:'Personal',  date:'2026-05-14', notes:'Toiletries' }
];

const DEMO_DEBTS = [
  { debtId:'DBT_001', personName:'Emeka Johnson',  type:'Lent',     amount:50000,  dueDate:'2026-06-01', status:'Unpaid', notes:'Lent for business', dateAdded:'2026-04-01', totalPaid:20000, remaining:30000 },
  { debtId:'DBT_002', personName:'Amaka Okonkwo',  type:'Lent',     amount:25000,  dueDate:'2026-05-30', status:'Unpaid', notes:'Personal loan',     dateAdded:'2026-04-10', totalPaid:0,     remaining:25000 },
  { debtId:'DBT_003', personName:'First Bank Loan', type:'Borrowed', amount:200000, dueDate:'2026-12-31', status:'Unpaid', notes:'Business loan',     dateAdded:'2026-01-15', totalPaid:60000, remaining:140000 },
  { debtId:'DBT_004', personName:'Chidi Okafor',   type:'Borrowed', amount:30000,  dueDate:'2026-05-20', status:'Paid',   notes:'Emergency loan',    dateAdded:'2026-03-01', totalPaid:30000, remaining:0 }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const utils = {
  formatCurrency(amount, symbol) {
    const s = symbol || CONFIG.CURRENCY;
    return s + Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' });
    } catch { return dateStr; }
  },

  formatDateInput(dateStr) {
    // Convert to YYYY-MM-DD for input[type=date]
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  getInitials(name) {
    return (name || 'U').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  },

  debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  },

  sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  animateCounter(el, target, duration = 1000) {
    const start = 0;
    const step = (target - start) / (duration / 16);
    let current = start;
    const update = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current).toLocaleString();
      if (current < target) requestAnimationFrame(update);
      else el.textContent = Math.round(target).toLocaleString();
    };
    requestAnimationFrame(update);
  },

  paginate(data, page, perPage = 10) {
    const total = data.length;
    const pages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    return { items: data.slice(start, start + perPage), total, pages, page };
  }
};

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${utils.sanitize(title)}</div>
      <div class="toast-msg">${utils.sanitize(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// API SERVICE (Google Apps Script + Demo Mode)
// CORS FIX: All requests use GET to avoid CORS preflight errors
// when hosted on GitHub Pages / Netlify with Google Apps Script
// ============================================================
const api = {
  async post(data) {
    if (CONFIG.DEMO_MODE) return this._demoPost(data);
    try {
      // Send as GET with payload param to bypass CORS preflight
      const params = new URLSearchParams({ payload: JSON.stringify(data) }).toString();
      const res = await fetch(`${CONFIG.API_URL}?${params}`);
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { return { success: false, message: 'Bad response from server: ' + text.substring(0,100) }; }
    } catch (err) {
      return { success: false, message: 'Network error: ' + err.message };
    }
  },

  async get(params) {
    if (CONFIG.DEMO_MODE) return this._demoGet(params);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${CONFIG.API_URL}?${query}`);
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { return { success: false, message: 'Bad response from server: ' + text.substring(0,100) }; }
    } catch (err) {
      return { success: false, message: 'Network error: ' + err.message };
    }
  },

  // ---- DEMO MODE HANDLERS ----
  _demoPost(data) {
    const store = demoStore;
    const action = data.action;

    if (action === 'registerUser') {
      const { fullName, phone, email, username, password } = data;
      const users = store.get('users') || [];
      if (users.find(u => u.email === email.toLowerCase())) return { success:false, message:'Email already registered.' };
      if (users.find(u => u.username === username.toLowerCase())) return { success:false, message:'Username already taken.' };
      const newUser = { userId:'USR_'+Date.now(), fullName, email:email.toLowerCase(), phone, username:username.toLowerCase(), password };
      users.push(newUser);
      store.set('users', users);
      return { success:true, message:'Registration successful!' };
    }

    if (action === 'loginUser') {
      const { usernameOrEmail, password } = data;
      const users = store.get('users') || DEMO_USERS;
      const user = users.find(u =>
        (u.email === usernameOrEmail.toLowerCase() || u.username === usernameOrEmail.toLowerCase()) &&
        u.password === password
      );
      if (user) {
        const { password: _, ...safeUser } = user;
        return { success:true, message:'Login successful!', user: safeUser };
      }
      return { success:false, message:'Invalid username/email or password.' };
    }

    const uid = data.userId || (store.get('currentUser') || {}).userId;

    if (action === 'addIncome') {
      const income = store.get('income_' + uid) || [...DEMO_INCOME];
      const newItem = { ...data, transactionId:'INC_'+Date.now(), userId:uid };
      delete newItem.action;
      income.unshift(newItem);
      store.set('income_' + uid, income);
      return { success:true, message:'Income added!', id: newItem.transactionId };
    }

    if (action === 'updateIncome') {
      const income = store.get('income_' + uid) || [...DEMO_INCOME];
      const idx = income.findIndex(i => i.transactionId === data.transactionId);
      if (idx < 0) return { success:false, message:'Not found' };
      income[idx] = { ...income[idx], ...data };
      store.set('income_' + uid, income);
      return { success:true, message:'Income updated!' };
    }

    if (action === 'deleteIncome') {
      let income = store.get('income_' + uid) || [...DEMO_INCOME];
      income = income.filter(i => i.transactionId !== data.transactionId);
      store.set('income_' + uid, income);
      return { success:true, message:'Income deleted!' };
    }

    if (action === 'addExpense') {
      const expenses = store.get('expenses_' + uid) || [...DEMO_EXPENSES];
      const newItem = { ...data, transactionId:'EXP_'+Date.now(), userId:uid };
      delete newItem.action;
      expenses.unshift(newItem);
      store.set('expenses_' + uid, expenses);
      return { success:true, message:'Expense added!', id: newItem.transactionId };
    }

    if (action === 'updateExpense') {
      const expenses = store.get('expenses_' + uid) || [...DEMO_EXPENSES];
      const idx = expenses.findIndex(i => i.transactionId === data.transactionId);
      if (idx < 0) return { success:false, message:'Not found' };
      expenses[idx] = { ...expenses[idx], ...data };
      store.set('expenses_' + uid, expenses);
      return { success:true, message:'Expense updated!' };
    }

    if (action === 'deleteExpense') {
      let expenses = store.get('expenses_' + uid) || [...DEMO_EXPENSES];
      expenses = expenses.filter(i => i.transactionId !== data.transactionId);
      store.set('expenses_' + uid, expenses);
      return { success:true, message:'Expense deleted!' };
    }

    if (action === 'addDebt') {
      const debts = store.get('debts_' + uid) || [...DEMO_DEBTS];
      const newDebt = { ...data, debtId:'DBT_'+Date.now(), userId:uid, status:'Unpaid', totalPaid:0, remaining:parseFloat(data.amount) };
      delete newDebt.action;
      debts.unshift(newDebt);
      store.set('debts_' + uid, debts);
      return { success:true, message:'Debt added!', id: newDebt.debtId };
    }

    if (action === 'updateDebt') {
      const debts = store.get('debts_' + uid) || [...DEMO_DEBTS];
      const idx = debts.findIndex(d => d.debtId === data.debtId);
      if (idx < 0) return { success:false, message:'Not found' };
      debts[idx] = { ...debts[idx], ...data };
      store.set('debts_' + uid, debts);
      return { success:true, message:'Debt updated!' };
    }

    if (action === 'deleteDebt') {
      let debts = store.get('debts_' + uid) || [...DEMO_DEBTS];
      debts = debts.filter(d => d.debtId !== data.debtId);
      store.set('debts_' + uid, debts);
      return { success:true, message:'Debt deleted!' };
    }

    if (action === 'recordPayment') {
      const debts = store.get('debts_' + uid) || [...DEMO_DEBTS];
      const idx = debts.findIndex(d => d.debtId === data.debtId);
      if (idx < 0) return { success:false, message:'Debt not found' };
      const paid = parseFloat(data.amountPaid);
      debts[idx].totalPaid = (debts[idx].totalPaid || 0) + paid;
      debts[idx].remaining = Math.max(0, debts[idx].amount - debts[idx].totalPaid);
      if (debts[idx].remaining <= 0) debts[idx].status = 'Paid';
      store.set('debts_' + uid, debts);
      return { success:true, message:'Payment recorded!', remaining: debts[idx].remaining };
    }

    if (action === 'updateProfile') {
      const user = store.get('currentUser') || {};
      if (data.fullName) user.fullName = data.fullName;
      if (data.phone)    user.phone    = data.phone;
      store.set('currentUser', user);
      return { success:true, message:'Profile updated!' };
    }

    if (action === 'changePassword') {
      const users = store.get('users') || DEMO_USERS;
      const user = store.get('currentUser') || {};
      const u = users.find(u2 => u2.userId === user.userId);
      if (!u || u.password !== data.oldPassword) return { success:false, message:'Current password incorrect.' };
      u.password = data.newPassword;
      store.set('users', users);
      return { success:true, message:'Password changed!' };
    }

    return { success:false, message:'Unknown action' };
  },

  _demoGet(params) {
    const store = demoStore;
    const { action, userId } = params;

    if (action === 'fetchIncome') {
      const income = store.get('income_' + userId) || [...DEMO_INCOME];
      return { success:true, data: income.sort((a,b) => new Date(b.date) - new Date(a.date)) };
    }

    if (action === 'fetchExpenses') {
      const expenses = store.get('expenses_' + userId) || [...DEMO_EXPENSES];
      return { success:true, data: expenses.sort((a,b) => new Date(b.date) - new Date(a.date)) };
    }

    if (action === 'fetchDebts') {
      const debts = store.get('debts_' + userId) || [...DEMO_DEBTS];
      return { success:true, data: debts };
    }

    if (action === 'fetchDashboard') {
      const income   = (store.get('income_' + userId)   || [...DEMO_INCOME]).sort((a,b) => new Date(b.date)-new Date(a.date));
      const expenses = (store.get('expenses_' + userId) || [...DEMO_EXPENSES]).sort((a,b) => new Date(b.date)-new Date(a.date));
      const debts    = store.get('debts_' + userId) || [...DEMO_DEBTS];

      const totalIncome   = income.reduce((s,r) => s + parseFloat(r.amount||0), 0);
      const totalExpenses = expenses.reduce((s,r) => s + parseFloat(r.amount||0), 0);
      const borrowed = debts.filter(d => d.type === 'Borrowed');
      const lent     = debts.filter(d => d.type === 'Lent');
      const totalBorrowed = borrowed.reduce((s,d) => s + parseFloat(d.remaining||0), 0);
      const totalLent     = lent.reduce((s,d)     => s + parseFloat(d.remaining||0), 0);

      const now = new Date();
      const cm = now.getMonth(), cy = now.getFullYear();

      const monthlyIncome   = income.filter(r => { const d=new Date(r.date); return d.getMonth()===cm && d.getFullYear()===cy; }).reduce((s,r) => s+parseFloat(r.amount||0), 0);
      const monthlyExpenses = expenses.filter(r => { const d=new Date(r.date); return d.getMonth()===cm && d.getFullYear()===cy; }).reduce((s,r) => s+parseFloat(r.amount||0), 0);

      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(cy, cm - i, 1);
        const m = d.getMonth(), y = d.getFullYear();
        const label = d.toLocaleString('default', { month:'short' }) + ' ' + y;
        const inc = income.filter(r => { const rd=new Date(r.date); return rd.getMonth()===m && rd.getFullYear()===y; }).reduce((s,r) => s+parseFloat(r.amount||0),0);
        const exp = expenses.filter(r => { const rd=new Date(r.date); return rd.getMonth()===m && rd.getFullYear()===y; }).reduce((s,r) => s+parseFloat(r.amount||0),0);
        trend.push({ label, income:inc, expenses:exp });
      }

      const expCats = {};
      expenses.forEach(r => { expCats[r.category] = (expCats[r.category]||0) + parseFloat(r.amount||0); });

      return {
        success:true,
        data: {
          totalIncome, totalExpenses, totalBorrowed, totalLent,
          monthlySavings: monthlyIncome - monthlyExpenses,
          monthlyIncome, monthlyExpenses,
          netBalance: totalIncome - totalExpenses,
          trend, categoryBreakdown: expCats,
          recentIncome: income.slice(0,5),
          recentExpenses: expenses.slice(0,5),
          debtSummary: { borrowed:borrowed.length, lent:lent.length, totalBorrowed, totalLent }
        }
      };
    }

    if (action === 'fetchReports') {
      const income   = (store.get('income_' + userId)   || [...DEMO_INCOME]);
      const expenses = (store.get('expenses_' + userId) || [...DEMO_EXPENSES]);
      const debts    = store.get('debts_' + userId) || [...DEMO_DEBTS];
      const period   = params.period || 'monthly';
      const now      = new Date();

      let filterFn;
      if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        filterFn = d => new Date(d) >= weekAgo;
      } else if (period === 'yearly') {
        filterFn = d => new Date(d).getFullYear() === now.getFullYear();
      } else {
        filterFn = d => { const rd=new Date(d); return rd.getMonth()===now.getMonth() && rd.getFullYear()===now.getFullYear(); };
      }

      const fi = income.filter(r => filterFn(r.date));
      const fe = expenses.filter(r => filterFn(r.date));
      const ti = fi.reduce((s,r) => s+parseFloat(r.amount||0),0);
      const te = fe.reduce((s,r) => s+parseFloat(r.amount||0),0);

      const expCat = {}, incCat = {};
      fe.forEach(r => { expCat[r.category] = (expCat[r.category]||0)+parseFloat(r.amount||0); });
      fi.forEach(r => { incCat[r.category] = (incCat[r.category]||0)+parseFloat(r.amount||0); });

      return { success:true, data:{ period, totalIncome:ti, totalExpenses:te, savings:ti-te, expenseCategoryBreakdown:expCat, incomeCategoryBreakdown:incCat, incomeRecords:fi, expenseRecords:fe, debtData:debts } };
    }

    return { success:false, message:'Unknown action' };
  }
};

// ============================================================
// LOCAL STORAGE WRAPPER (Demo store)
// ============================================================
const demoStore = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('ama_' + key)); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem('ama_' + key, JSON.stringify(val)); } catch {}
  },
  remove(key) { localStorage.removeItem('ama_' + key); }
};

// ============================================================
// AUTH MODULE
// ============================================================
const AMA = {
  auth: {
    async login(usernameOrEmail, password, rememberMe) {
      const result = await api.post({ action:'loginUser', usernameOrEmail, password });
      if (result.success) {
        sessionStorage.setItem('ama_user', JSON.stringify(result.user));
        demoStore.set('currentUser', result.user);
        if (rememberMe) localStorage.setItem('ama_remember_user', usernameOrEmail);
        else localStorage.removeItem('ama_remember_user');
      }
      return result;
    },

    async register(data) {
      return await api.post({ action:'registerUser', ...data });
    },

    getUser() {
      try {
        return JSON.parse(sessionStorage.getItem('ama_user')) || demoStore.get('currentUser');
      } catch { return null; }
    },

    requireAuth() {
      const user = this.getUser();
      if (!user) { window.location.href = 'login.html'; return null; }
      return user;
    },

    logout() {
      sessionStorage.removeItem('ama_user');
      window.location.href = 'login.html';
    }
  }
};

// ============================================================
// DASHBOARD APP (only runs on dashboard.html)
// ============================================================
if (document.getElementById('dashboardApp')) {
  const app = {
    user:     null,
    income:   [],
    expenses: [],
    debts:    [],
    charts:   {},
    currentPage: { income:1, expenses:1, debts:1 },
    currency: CONFIG.CURRENCY,

    async init() {
      this.user = AMA.auth.requireAuth();
      if (!this.user) return;

      // Apply saved theme
      if (localStorage.getItem('ama_theme') === 'light') {
        document.body.classList.add('light-mode');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.classList.add('active');
      }

      // Apply saved currency
      const savedCurrency = localStorage.getItem('ama_currency');
      if (savedCurrency) this.currency = savedCurrency;

      this.setupUI();
      await this.loadAll();
      this.setupSidebar();
      this.setupEventListeners();
      document.getElementById('pageLoader').classList.add('hidden');
    },

    setupUI() {
      // Set user info in sidebar
      document.getElementById('sidebarUserName').textContent = this.user.fullName;
      document.getElementById('sidebarAvatar').textContent   = utils.getInitials(this.user.fullName);
      document.getElementById('topbarUser').textContent      = this.user.fullName.split(' ')[0];
    },

    async loadAll() {
      await Promise.all([
        this.loadDashboard(),
        this.loadIncome(),
        this.loadExpenses(),
        this.loadDebts()
      ]);
    },

    async loadDashboard() {
      const result = await api.get({ action:'fetchDashboard', userId: this.user.userId });
      if (!result.success) return;
      const d = result.data;

      // Update stat cards
      this.updateStatCard('totalIncome',    d.totalIncome,     true);
      this.updateStatCard('totalExpenses',  d.totalExpenses,   false);
      this.updateStatCard('totalBorrowed',  d.totalBorrowed,   null);
      this.updateStatCard('totalLent',      d.totalLent,       null);
      this.updateStatCard('monthlySavings', d.monthlySavings,  true);
      this.updateStatCard('netBalance',     d.netBalance,      true);

      // Recent transactions
      this.renderRecentIncome(d.recentIncome);
      this.renderRecentExpenses(d.recentExpenses);

      // Charts
      this.renderTrendChart(d.trend);
      this.renderCategoryChart(d.categoryBreakdown);
    },

    updateStatCard(id, amount, positive) {
      const el = document.getElementById('stat_' + id);
      if (!el) return;
      const formatted = utils.formatCurrency(Math.abs(amount), this.currency);
      el.textContent = (positive === false && amount < 0 ? '-' : '') + formatted;

      if (positive !== null) {
        el.style.color = amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
      }
    },

    renderRecentIncome(items) {
      const el = document.getElementById('recentIncomeList');
      if (!el) return;
      if (!items || !items.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><p class="empty-state-text">No income recorded yet</p></div>';
        return;
      }
      const catIcons = { Salary:'💼', Business:'🏢', Freelance:'💻', Gifts:'🎁', Other:'💵' };
      el.innerHTML = items.map(item => `
        <div class="txn-item">
          <div class="txn-icon" style="background:rgba(0,200,150,0.12)">${catIcons[item.category] || '💵'}</div>
          <div class="txn-info">
            <div class="txn-name">${utils.sanitize(item.source)}</div>
            <div class="txn-cat">${utils.sanitize(item.category)} • ${utils.formatDate(item.date)}</div>
          </div>
          <div>
            <div class="txn-amount amount-income">+${utils.formatCurrency(item.amount, this.currency)}</div>
          </div>
        </div>
      `).join('');
    },

    renderRecentExpenses(items) {
      const el = document.getElementById('recentExpenseList');
      if (!el) return;
      if (!items || !items.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💸</div><p class="empty-state-text">No expenses recorded yet</p></div>';
        return;
      }
      const catIcons = { Food:'🍔', Transport:'🚗', School:'📚', Rent:'🏠', Electricity:'💡', Internet:'📡', Medical:'🏥', Personal:'👤', Others:'📦' };
      el.innerHTML = items.map(item => `
        <div class="txn-item">
          <div class="txn-icon" style="background:rgba(255,71,87,0.12)">${catIcons[item.category] || '💸'}</div>
          <div class="txn-info">
            <div class="txn-name">${utils.sanitize(item.expenseName)}</div>
            <div class="txn-cat">${utils.sanitize(item.category)} • ${utils.formatDate(item.date)}</div>
          </div>
          <div>
            <div class="txn-amount amount-expense">-${utils.formatCurrency(item.amount, this.currency)}</div>
          </div>
        </div>
      `).join('');
    },

    renderTrendChart(trend) {
      const ctx = document.getElementById('trendChart');
      if (!ctx || !trend) return;
      if (this.charts.trend) this.charts.trend.destroy();

      this.charts.trend = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: trend.map(t => t.label),
          datasets: [
            {
              label: 'Income',
              data: trend.map(t => t.income),
              backgroundColor: 'rgba(0,200,150,0.7)',
              borderRadius: 6,
              borderSkipped: false
            },
            {
              label: 'Expenses',
              data: trend.map(t => t.expenses),
              backgroundColor: 'rgba(255,71,87,0.7)',
              borderRadius: 6,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary'), font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: ${utils.formatCurrency(ctx.raw, this.currency)}`
              }
            }
          },
          scales: {
            x: { ticks: { color: 'var(--text-muted)', font: { size: 11 } }, grid: { display: false } },
            y: {
              ticks: { color: 'var(--text-muted)', font: { size: 11 }, callback: v => utils.formatCurrency(v, this.currency) },
              grid: { color: 'rgba(255,255,255,0.04)' }
            }
          }
        }
      });
    },

    renderCategoryChart(cats) {
      const ctx = document.getElementById('categoryChart');
      if (!ctx || !cats) return;
      if (this.charts.category) this.charts.category.destroy();

      const labels = Object.keys(cats);
      const values = Object.values(cats);
      const colors = ['#00c896','#1a6fff','#ff4757','#f7b731','#7c4dff','#00e5d4','#ff6b6b','#ffa502','#2ed573'];

      this.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'var(--text-secondary)', font: { size: 11 }, padding: 12, boxWidth: 10 }
            },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${utils.formatCurrency(ctx.raw, this.currency)}`
              }
            }
          }
        }
      });
    },

    // ---- INCOME ----
    async loadIncome() {
      const result = await api.get({ action:'fetchIncome', userId: this.user.userId });
      if (!result.success) return;
      this.income = result.data || [];
      this.renderIncomeTable();
    },

    renderIncomeTable(data) {
      const list = data || this.income;
      const el   = document.getElementById('incomeTableBody');
      if (!el) return;

      const pg = utils.paginate(list, this.currentPage.income, 10);
      this.renderPagination('incomePagination', pg, page => {
        this.currentPage.income = page;
        this.renderIncomeTable();
      });

      document.getElementById('incomeTotal').textContent = utils.formatCurrency(list.reduce((s,r) => s+parseFloat(r.amount||0), 0), this.currency);
      document.getElementById('incomeCount').textContent  = `${list.length} records`;

      if (!pg.items.length) {
        el.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 20px">
          <div class="empty-state-icon">💰</div>
          <div class="empty-state-title">No Income Records</div>
          <div class="empty-state-text">Add your first income source</div>
        </div></td></tr>`;
        return;
      }

      const catColors = { Salary:'badge-blue', Business:'badge-purple', Freelance:'badge-teal', Gifts:'badge-gold', Other:'badge-gray' };

      el.innerHTML = pg.items.map(item => `
        <tr>
          <td><div style="font-weight:600">${utils.sanitize(item.source)}</div></td>
          <td><span class="amount-income" style="font-weight:700">${utils.formatCurrency(item.amount, this.currency)}</span></td>
          <td><span class="badge ${catColors[item.category]||'badge-gray'}">${utils.sanitize(item.category)}</span></td>
          <td>${utils.formatDate(item.date)}</td>
          <td style="color:var(--text-muted); font-size:13px">${utils.sanitize(item.notes || '—')}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" onclick="dashApp.editIncome('${item.transactionId}')" title="Edit">✏️</button>
              <button class="action-btn delete" onclick="dashApp.confirmDeleteIncome('${item.transactionId}')" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    },

    filterIncome() {
      const search  = (document.getElementById('incomeSearch')?.value || '').toLowerCase();
      const catFilter = document.getElementById('incomeCatFilter')?.value || '';
      const dateFrom  = document.getElementById('incomeDateFrom')?.value || '';
      const dateTo    = document.getElementById('incomeDateTo')?.value || '';

      let filtered = this.income.filter(item => {
        const matchSearch = !search || item.source.toLowerCase().includes(search) || item.notes?.toLowerCase().includes(search);
        const matchCat    = !catFilter || item.category === catFilter;
        const matchFrom   = !dateFrom || item.date >= dateFrom;
        const matchTo     = !dateTo   || item.date <= dateTo;
        return matchSearch && matchCat && matchFrom && matchTo;
      });

      this.currentPage.income = 1;
      this.renderIncomeTable(filtered);
    },

    editIncome(id) {
      const item = this.income.find(i => i.transactionId === id);
      if (!item) return;
      document.getElementById('incomeModalTitle').textContent = 'Edit Income';
      document.getElementById('incomeId').value       = item.transactionId;
      document.getElementById('incomeSource').value   = item.source;
      document.getElementById('incomeAmount').value   = item.amount;
      document.getElementById('incomeCat').value      = item.category;
      document.getElementById('incomeDate').value     = utils.formatDateInput(item.date);
      document.getElementById('incomeNotes').value    = item.notes || '';
      this.openModal('incomeModal');
    },

    async saveIncome() {
      const id     = document.getElementById('incomeId').value;
      const source = document.getElementById('incomeSource').value.trim();
      const amount = parseFloat(document.getElementById('incomeAmount').value);
      const cat    = document.getElementById('incomeCat').value;
      const date   = document.getElementById('incomeDate').value;
      const notes  = document.getElementById('incomeNotes').value.trim();

      if (!source || !amount || !cat || !date) { showToast('error','Validation','Please fill all required fields'); return; }

      const isEdit = !!id;
      const payload = {
        action: isEdit ? 'updateIncome' : 'addIncome',
        userId: this.user.userId,
        source, amount, category: cat, date, notes
      };
      if (isEdit) payload.transactionId = id;

      const result = await api.post(payload);
      if (result.success) {
        showToast('success', isEdit ? 'Updated!' : 'Added!', result.message);
        this.closeModal('incomeModal');
        await this.loadIncome();
        await this.loadDashboard();
      } else {
        showToast('error', 'Error', result.message);
      }
    },

    confirmDeleteIncome(id) {
      this._pendingDelete = { type:'income', id };
      document.getElementById('deleteConfirmText').textContent = 'Are you sure you want to delete this income record?';
      this.openModal('deleteModal');
    },

    async deleteIncome(id) {
      const result = await api.post({ action:'deleteIncome', userId: this.user.userId, transactionId: id });
      if (result.success) {
        showToast('success', 'Deleted!', result.message);
        await this.loadIncome();
        await this.loadDashboard();
      } else {
        showToast('error', 'Error', result.message);
      }
    },

    // ---- EXPENSES ----
    async loadExpenses() {
      const result = await api.get({ action:'fetchExpenses', userId: this.user.userId });
      if (!result.success) return;
      this.expenses = result.data || [];
      this.renderExpensesTable();
    },

    renderExpensesTable(data) {
      const list = data || this.expenses;
      const el   = document.getElementById('expensesTableBody');
      if (!el) return;

      const pg = utils.paginate(list, this.currentPage.expenses, 10);
      this.renderPagination('expensesPagination', pg, page => {
        this.currentPage.expenses = page;
        this.renderExpensesTable();
      });

      document.getElementById('expensesTotal').textContent = utils.formatCurrency(list.reduce((s,r) => s+parseFloat(r.amount||0), 0), this.currency);
      document.getElementById('expensesCount').textContent  = `${list.length} records`;

      const catColors = { Food:'badge-gold', Transport:'badge-blue', School:'badge-purple', Rent:'badge-red', Electricity:'badge-gold', Internet:'badge-blue', Medical:'badge-red', Personal:'badge-green', Others:'badge-gray' };

      if (!pg.items.length) {
        el.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 20px">
          <div class="empty-state-icon">💸</div>
          <div class="empty-state-title">No Expense Records</div>
          <div class="empty-state-text">Track your spending here</div>
        </div></td></tr>`;
        return;
      }

      el.innerHTML = pg.items.map(item => `
        <tr>
          <td><div style="font-weight:600">${utils.sanitize(item.expenseName)}</div></td>
          <td><span class="amount-expense" style="font-weight:700">-${utils.formatCurrency(item.amount, this.currency)}</span></td>
          <td><span class="badge ${catColors[item.category]||'badge-gray'}">${utils.sanitize(item.category)}</span></td>
          <td>${utils.formatDate(item.date)}</td>
          <td style="color:var(--text-muted); font-size:13px">${utils.sanitize(item.notes || '—')}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" onclick="dashApp.editExpense('${item.transactionId}')" title="Edit">✏️</button>
              <button class="action-btn delete" onclick="dashApp.confirmDeleteExpense('${item.transactionId}')" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    },

    filterExpenses() {
      const search  = (document.getElementById('expenseSearch')?.value || '').toLowerCase();
      const catFilter = document.getElementById('expenseCatFilter')?.value || '';
      const dateFrom  = document.getElementById('expenseDateFrom')?.value || '';
      const dateTo    = document.getElementById('expenseDateTo')?.value || '';

      let filtered = this.expenses.filter(item => {
        const matchSearch = !search || item.expenseName.toLowerCase().includes(search) || item.notes?.toLowerCase().includes(search);
        const matchCat    = !catFilter || item.category === catFilter;
        const matchFrom   = !dateFrom || item.date >= dateFrom;
        const matchTo     = !dateTo   || item.date <= dateTo;
        return matchSearch && matchCat && matchFrom && matchTo;
      });

      this.currentPage.expenses = 1;
      this.renderExpensesTable(filtered);
    },

    editExpense(id) {
      const item = this.expenses.find(i => i.transactionId === id);
      if (!item) return;
      document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
      document.getElementById('expenseId').value     = item.transactionId;
      document.getElementById('expenseName').value   = item.expenseName;
      document.getElementById('expenseAmount').value = item.amount;
      document.getElementById('expenseCat').value    = item.category;
      document.getElementById('expenseDate').value   = utils.formatDateInput(item.date);
      document.getElementById('expenseNotes').value  = item.notes || '';
      this.openModal('expenseModal');
    },

    async saveExpense() {
      const id     = document.getElementById('expenseId').value;
      const name   = document.getElementById('expenseName').value.trim();
      const amount = parseFloat(document.getElementById('expenseAmount').value);
      const cat    = document.getElementById('expenseCat').value;
      const date   = document.getElementById('expenseDate').value;
      const notes  = document.getElementById('expenseNotes').value.trim();

      if (!name || !amount || !cat || !date) { showToast('error','Validation','Please fill all required fields'); return; }

      const isEdit = !!id;
      const payload = {
        action: isEdit ? 'updateExpense' : 'addExpense',
        userId: this.user.userId,
        expenseName: name, amount, category: cat, date, notes
      };
      if (isEdit) payload.transactionId = id;

      const result = await api.post(payload);
      if (result.success) {
        showToast('success', isEdit ? 'Updated!' : 'Added!', result.message);
        this.closeModal('expenseModal');
        await this.loadExpenses();
        await this.loadDashboard();
      } else {
        showToast('error', 'Error', result.message);
      }
    },

    confirmDeleteExpense(id) {
      this._pendingDelete = { type:'expense', id };
      document.getElementById('deleteConfirmText').textContent = 'Are you sure you want to delete this expense?';
      this.openModal('deleteModal');
    },

    async deleteExpense(id) {
      const result = await api.post({ action:'deleteExpense', userId: this.user.userId, transactionId: id });
      if (result.success) {
        showToast('success', 'Deleted!', result.message);
        await this.loadExpenses();
        await this.loadDashboard();
      } else {
        showToast('error', 'Error', result.message);
      }
    },

    // ---- DEBTS ----
    async loadDebts() {
      const result = await api.get({ action:'fetchDebts', userId: this.user.userId });
      if (!result.success) return;
      this.debts = result.data || [];
      this.renderDebts();
    },

    renderDebts(filter = 'all') {
      const borrowed = document.getElementById('borrowedGrid');
      const lent     = document.getElementById('lentGrid');
      if (!borrowed || !lent) return;

      let list = this.debts;
      const search = (document.getElementById('debtSearch')?.value || '').toLowerCase();
      const status = document.getElementById('debtStatusFilter')?.value || '';

      if (search) list = list.filter(d => d.personName.toLowerCase().includes(search) || d.notes?.toLowerCase().includes(search));
      if (status) list = list.filter(d => d.status === status);

      const borrowedList = list.filter(d => d.type === 'Borrowed');
      const lentList     = list.filter(d => d.type === 'Lent');

      const renderDebtCard = (debt) => {
        const pct = Math.min(100, Math.round((debt.totalPaid / debt.amount) * 100)) || 0;
        const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'Paid';
        const avatarColors = ['#1a6fff','#7c4dff','#00c896','#ff4757','#f7b731'];
        const color = avatarColors[debt.personName.charCodeAt(0) % avatarColors.length];
        return `
          <div class="debt-card">
            <div class="debt-card-header">
              <div class="debt-person">
                <div class="debt-avatar" style="background:${color}">${utils.getInitials(debt.personName)}</div>
                <div>
                  <div class="debt-person-name">${utils.sanitize(debt.personName)}</div>
                  <div class="debt-person-date">${debt.dueDate ? 'Due: ' + utils.formatDate(debt.dueDate) : 'No due date'}</div>
                </div>
              </div>
              <div style="text-align:right">
                <span class="badge ${debt.status==='Paid' ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-gold'}">${debt.status==='Paid' ? '✓ Paid' : isOverdue ? '⚠ Overdue' : '● Pending'}</span>
              </div>
            </div>
            <div class="progress-wrap"><div class="progress-bar ${debt.type==='Borrowed' ? 'red' : ''}" style="width:${pct}%"></div></div>
            <div class="debt-amounts">
              <span>Original: <strong class="debt-amount-value">${utils.formatCurrency(debt.amount, this.currency)}</strong></span>
              <span>Paid: <strong class="debt-amount-value text-green">${utils.formatCurrency(debt.totalPaid, this.currency)}</strong></span>
              <span>Left: <strong class="debt-amount-value ${debt.type==='Borrowed' ? 'amount-expense' : 'amount-income'}">${utils.formatCurrency(debt.remaining, this.currency)}</strong></span>
            </div>
            <div class="debt-actions">
              ${debt.status !== 'Paid' ? `<button class="btn btn-secondary btn-sm" onclick="dashApp.openPayment('${debt.debtId}')">💳 Record Payment</button>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="dashApp.editDebt('${debt.debtId}')">✏️ Edit</button>
              <button class="btn btn-sm" style="background:rgba(255,71,87,0.12); color:var(--accent-red)" onclick="dashApp.confirmDeleteDebt('${debt.debtId}')">🗑️</button>
            </div>
          </div>
        `;
      };

      const emptyCard = (type) => `
        <div class="empty-state" style="padding:48px 20px; grid-column:1/-1">
          <div class="empty-state-icon">${type==='Borrowed'?'🏦':'🤝'}</div>
          <div class="empty-state-title">No ${type==='Borrowed'?'Borrowed':'Lent'} Debts</div>
          <div class="empty-state-text">${type==='Borrowed'?'Money you borrowed will appear here':'Money you lent will appear here'}</div>
        </div>`;

      borrowed.innerHTML = borrowedList.length ? borrowedList.map(renderDebtCard).join('') : emptyCard('Borrowed');
      lent.innerHTML     = lentList.length     ? lentList.map(renderDebtCard).join('')     : emptyCard('Lent');

      // Update debt stats
      document.getElementById('totalBorrowedCount').textContent = borrowedList.length;
      document.getElementById('totalLentCount').textContent     = lentList.length;
      document.getElementById('totalBorrowedAmt').textContent   = utils.formatCurrency(borrowedList.reduce((s,d) => s+parseFloat(d.remaining||0),0), this.currency);
      document.getElementById('totalLentAmt').textContent       = utils.formatCurrency(lentList.reduce((s,d) => s+parseFloat(d.remaining||0),0), this.currency);
    },

    editDebt(id) {
      const debt = this.debts.find(d => d.debtId === id);
      if (!debt) return;
      document.getElementById('debtModalTitle').textContent = 'Edit Debt';
      document.getElementById('debtId').value         = debt.debtId;
      document.getElementById('debtPerson').value     = debt.personName;
      document.getElementById('debtType').value       = debt.type;
      document.getElementById('debtAmount').value     = debt.amount;
      document.getElementById('debtDueDate').value    = debt.dueDate ? utils.formatDateInput(debt.dueDate) : '';
      document.getElementById('debtStatus').value     = debt.status;
      document.getElementById('debtNotes').value      = debt.notes || '';
      this.openModal('debtModal');
    },

    async saveDebt() {
      const id     = document.getElementById('debtId').value;
      const person = document.getElementById('debtPerson').value.trim();
      const type   = document.getElementById('debtType').value;
      const amount = parseFloat(document.getElementById('debtAmount').value);
      const due    = document.getElementById('debtDueDate').value;
      const status = document.getElementById('debtStatus').value;
      const notes  = document.getElementById('debtNotes').value.trim();

      if (!person || !type || !amount) { showToast('error','Validation','Please fill all required fields'); return; }

      const isEdit = !!id;
      const payload = {
        action: isEdit ? 'updateDebt' : 'addDebt',
        userId: this.user.userId,
        personName: person, type, amount, dueDate: due, status, notes
      };
      if (isEdit) payload.debtId = id;

      const result = await api.post(payload);
      if (result.success) {
        showToast('success', isEdit ? 'Updated!' : 'Debt Added!', result.message);
        this.closeModal('debtModal');
        await this.loadDebts();
        await this.loadDashboard();
      } else {
        showToast('error', 'Error', result.message);
      }
    },

    openPayment(debtId) {
      const debt = this.debts.find(d => d.debtId === debtId);
      if (!debt) return;
      document.getElementById('paymentDebtId').value    = debtId;
      document.getElementById('paymentDebtName').textContent = debt.personName;
      document.getElementById('paymentDebtRemaining').textContent = utils.formatCurrency(debt.remaining, this.currency);
      document.getElementById('paymentDate').value = utils.today();
      document.getElementById('paymentAmount').value = '';
      this.openModal('paymentModal');
    },

    async recordPayment() {
      const debtId  = document.getElementById('paymentDebtId').value;
      const amount  = parseFloat(document.getElementById('paymentAmount').value);
      const date    = document.getElementById('paymentDate').value;

      if (!amount || amount <= 0 || !date) { showToast('error','Validation','Please enter a valid amount and date'); return; }

      const result = await api.post({ action:'recordPayment', userId: this.user.userId, debtId, amountPaid: amount, paymentDate: date });
      if (result.success) {
        showToast('success','Payment Recorded!', result.message);
        this.closeModal('paymentModal');
        await this.loadDebts();
        await this.loadDashboard();
      } else {
        showToast('error','Error', result.message);
      }
    },

    confirmDeleteDebt(id) {
      this._pendingDelete = { type:'debt', id };
      document.getElementById('deleteConfirmText').textContent = 'Are you sure you want to delete this debt record?';
      this.openModal('deleteModal');
    },

    async deleteDebt(id) {
      const result = await api.post({ action:'deleteDebt', userId: this.user.userId, debtId: id });
      if (result.success) {
        showToast('success','Deleted!', result.message);
        await this.loadDebts();
        await this.loadDashboard();
      } else {
        showToast('error','Error', result.message);
      }
    },

    // ---- REPORTS ----
    async loadReports(period = 'monthly') {
      const result = await api.get({ action:'fetchReports', userId: this.user.userId, period });
      if (!result.success) return;
      const d = result.data;

      document.getElementById('reportTotalIncome').textContent   = utils.formatCurrency(d.totalIncome, this.currency);
      document.getElementById('reportTotalExpenses').textContent = utils.formatCurrency(d.totalExpenses, this.currency);
      document.getElementById('reportSavings').textContent       = utils.formatCurrency(d.savings, this.currency);
      document.getElementById('reportSavings').style.color       = d.savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

      // Expense category chart
      const ctx = document.getElementById('reportExpenseChart');
      if (ctx) {
        if (this.charts.reportExp) this.charts.reportExp.destroy();
        const labels = Object.keys(d.expenseCategoryBreakdown);
        const values = Object.values(d.expenseCategoryBreakdown);
        const colors = ['#ff4757','#f7b731','#1a6fff','#7c4dff','#00c896','#00e5d4','#ff6b6b','#ffa502','#2ed573'];

        this.charts.reportExp = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label:'Expenses by Category', data:values, backgroundColor:colors.slice(0,labels.length), borderRadius:6 }]
          },
          options: {
            responsive:true, maintainAspectRatio:false, indexAxis:'y',
            plugins: { legend:{display:false}, tooltip:{callbacks:{label:c=>` ${utils.formatCurrency(c.raw, this.currency)}`}} },
            scales: {
              x: { ticks:{color:'var(--text-muted)', callback:v=>utils.formatCurrency(v, this.currency)}, grid:{color:'rgba(255,255,255,0.04)'} },
              y: { ticks:{color:'var(--text-secondary)'}, grid:{display:false} }
            }
          }
        });
      }

      // Income category chart
      const ctx2 = document.getElementById('reportIncomeChart');
      if (ctx2) {
        if (this.charts.reportInc) this.charts.reportInc.destroy();
        const labels = Object.keys(d.incomeCategoryBreakdown);
        const values = Object.values(d.incomeCategoryBreakdown);
        const colors2 = ['#00c896','#1a6fff','#7c4dff','#00e5d4','#f7b731'];

        this.charts.reportInc = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data:values, backgroundColor:colors2.slice(0,labels.length), borderWidth:0, hoverOffset:6 }]
          },
          options: {
            responsive:true, maintainAspectRatio:false, cutout:'65%',
            plugins: { legend:{ position:'bottom', labels:{color:'var(--text-secondary)', font:{size:11}, padding:10, boxWidth:10} } }
          }
        });
      }
    },

    // ---- PROFILE ----
    loadProfile() {
      document.getElementById('profileFullName').value = this.user.fullName || '';
      document.getElementById('profileEmail').value    = this.user.email || '';
      document.getElementById('profilePhone').value    = this.user.phone || '';
      document.getElementById('profileUsername').value = this.user.username || '';
      document.getElementById('profileAvatarLarge').textContent = utils.getInitials(this.user.fullName);
      document.getElementById('profileNameDisplay').textContent = this.user.fullName;
      document.getElementById('profileUsernameDisplay').textContent = '@' + (this.user.username || '');

      // Stats
      document.getElementById('profileIncomeCount').textContent   = this.income.length;
      document.getElementById('profileExpenseCount').textContent  = this.expenses.length;
      document.getElementById('profileDebtCount').textContent     = this.debts.length;
    },

    async saveProfile() {
      const fullName = document.getElementById('profileFullName').value.trim();
      const phone    = document.getElementById('profilePhone').value.trim();

      if (!fullName) { showToast('error','Validation','Full name is required'); return; }

      const result = await api.post({ action:'updateProfile', userId: this.user.userId, fullName, phone });
      if (result.success) {
        this.user.fullName = fullName;
        this.user.phone    = phone;
        sessionStorage.setItem('ama_user', JSON.stringify(this.user));
        demoStore.set('currentUser', this.user);
        this.setupUI();
        this.loadProfile();
        showToast('success','Saved!', result.message);
      } else {
        showToast('error','Error', result.message);
      }
    },

    async changePassword() {
      const oldPwd = document.getElementById('oldPassword').value;
      const newPwd = document.getElementById('newPassword').value;
      const conPwd = document.getElementById('confirmNewPassword').value;

      if (!oldPwd || !newPwd || !conPwd) { showToast('error','Validation','Please fill all fields'); return; }
      if (newPwd !== conPwd)             { showToast('error','Mismatch','New passwords do not match'); return; }
      if (newPwd.length < 6)             { showToast('error','Too Short','Password must be at least 6 characters'); return; }

      const result = await api.post({ action:'changePassword', userId: this.user.userId, oldPassword: oldPwd, newPassword: newPwd });
      if (result.success) {
        showToast('success','Done!', result.message);
        document.getElementById('oldPassword').value        = '';
        document.getElementById('newPassword').value        = '';
        document.getElementById('confirmNewPassword').value = '';
      } else {
        showToast('error','Error', result.message);
      }
    },

    // ---- MODAL ----
    openModal(id) {
      const overlay = document.getElementById(id);
      if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    },

    closeModal(id) {
      const overlay = document.getElementById(id);
      if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
    },

    resetIncomeForm() {
      document.getElementById('incomeId').value = '';
      document.getElementById('incomeModalTitle').textContent = 'Add Income';
      document.getElementById('incomeSource').value = '';
      document.getElementById('incomeAmount').value = '';
      document.getElementById('incomeCat').value = 'Salary';
      document.getElementById('incomeDate').value = utils.today();
      document.getElementById('incomeNotes').value = '';
    },

    resetExpenseForm() {
      document.getElementById('expenseId').value = '';
      document.getElementById('expenseModalTitle').textContent = 'Add Expense';
      document.getElementById('expenseName').value = '';
      document.getElementById('expenseAmount').value = '';
      document.getElementById('expenseCat').value = 'Food';
      document.getElementById('expenseDate').value = utils.today();
      document.getElementById('expenseNotes').value = '';
    },

    resetDebtForm() {
      document.getElementById('debtId').value = '';
      document.getElementById('debtModalTitle').textContent = 'Add Debt';
      document.getElementById('debtPerson').value = '';
      document.getElementById('debtType').value = 'Borrowed';
      document.getElementById('debtAmount').value = '';
      document.getElementById('debtDueDate').value = '';
      document.getElementById('debtStatus').value = 'Unpaid';
      document.getElementById('debtNotes').value = '';
    },

    // ---- PAGINATION ----
    renderPagination(containerId, pg, callback) {
      const el = document.getElementById(containerId);
      if (!el) return;

      if (pg.pages <= 1) { el.innerHTML = ''; return; }

      let html = '';
      for (let i = 1; i <= pg.pages; i++) {
        html += `<button class="page-btn ${i === pg.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      el.innerHTML = html;
      el.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => callback(parseInt(btn.dataset.page)));
      });
    },

    // ---- SIDEBAR ----
    setupSidebar() {
      // Hamburger toggle
      document.getElementById('hamburger')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('active');
      });

      document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
      });

      // Nav items
      document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
          const page = item.dataset.page;
          this.showPage(page);
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          item.classList.add('active');
          // Close sidebar on mobile
          document.getElementById('sidebar').classList.remove('open');
          document.getElementById('sidebarOverlay').classList.remove('active');
        });
      });
    },

    showPage(name) {
      document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
      const page = document.getElementById('page_' + name);
      if (page) page.classList.add('active');

      // Update topbar title
      const titles = { dashboard:'Dashboard Overview', income:'Income Management', expenses:'Expense Management', debts:'Debt Manager', reports:'Reports & Analytics', profile:'My Profile', settings:'Settings' };
      document.getElementById('topbarTitle').textContent = titles[name] || '';

      // Load page data
      if (name === 'reports')  this.loadReports('monthly');
      if (name === 'profile')  this.loadProfile();
      if (name === 'settings') this.loadSettings();
    },

    // ---- SETTINGS ----
    loadSettings() {
      const theme = localStorage.getItem('ama_theme') || 'dark';
      const curr  = localStorage.getItem('ama_currency') || '₦';
      const themeToggle = document.getElementById('settingsThemeToggle');
      const currSelect  = document.getElementById('settingsCurrency');

      if (themeToggle) themeToggle.classList.toggle('active', theme === 'light');
      if (currSelect)  currSelect.value = curr;
    },

    // ---- EVENTS ----
    setupEventListeners() {
      // Theme toggle
      document.querySelectorAll('#themeToggle, #settingsThemeToggle').forEach(el => {
        el?.addEventListener('click', () => {
          document.body.classList.toggle('light-mode');
          const isLight = document.body.classList.contains('light-mode');
          localStorage.setItem('ama_theme', isLight ? 'light' : 'dark');
          document.querySelectorAll('.toggle-switch').forEach(t => t.classList.toggle('active', isLight));
        });
      });

      // Currency
      document.getElementById('settingsCurrency')?.addEventListener('change', function() {
        const dashAppRef = window.dashApp;
        if (dashAppRef) dashAppRef.currency = this.value;
        localStorage.setItem('ama_currency', this.value);
        CONFIG.CURRENCY = this.value;
        if (dashAppRef) dashAppRef.loadAll();
      });

      // Logout
      document.querySelectorAll('[data-action="logout"]').forEach(el => {
        el.addEventListener('click', () => AMA.auth.logout());
      });

      // Modals close on overlay click
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.closeModal(overlay.id);
        });
      });

      // Income form
      document.getElementById('addIncomeBtn')?.addEventListener('click', () => {
        this.resetIncomeForm();
        this.openModal('incomeModal');
      });
      document.getElementById('saveIncomeBtn')?.addEventListener('click', () => this.saveIncome());
      document.getElementById('incomeSearch')?.addEventListener('input', utils.debounce(() => this.filterIncome(), 300));
      document.getElementById('incomeCatFilter')?.addEventListener('change', () => this.filterIncome());
      document.getElementById('incomeDateFrom')?.addEventListener('change', () => this.filterIncome());
      document.getElementById('incomeDateTo')?.addEventListener('change', () => this.filterIncome());

      // Expense form
      document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
        this.resetExpenseForm();
        this.openModal('expenseModal');
      });
      document.getElementById('saveExpenseBtn')?.addEventListener('click', () => this.saveExpense());
      document.getElementById('expenseSearch')?.addEventListener('input', utils.debounce(() => this.filterExpenses(), 300));
      document.getElementById('expenseCatFilter')?.addEventListener('change', () => this.filterExpenses());
      document.getElementById('expenseDateFrom')?.addEventListener('change', () => this.filterExpenses());
      document.getElementById('expenseDateTo')?.addEventListener('change', () => this.filterExpenses());

      // Debt form
      document.getElementById('addDebtBtn')?.addEventListener('click', () => {
        this.resetDebtForm();
        this.openModal('debtModal');
      });
      document.getElementById('saveDebtBtn')?.addEventListener('click', () => this.saveDebt());
      document.getElementById('savePaymentBtn')?.addEventListener('click', () => this.recordPayment());
      document.getElementById('debtSearch')?.addEventListener('input', utils.debounce(() => this.renderDebts(), 300));
      document.getElementById('debtStatusFilter')?.addEventListener('change', () => this.renderDebts());

      // Report tabs
      document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          dashApp.loadReports(this.dataset.period);
        });
      });

      // Profile save
      document.getElementById('saveProfileBtn')?.addEventListener('click', () => this.saveProfile());
      document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());

      // Delete confirm
      document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        const pd = this._pendingDelete;
        if (!pd) return;
        if (pd.type === 'income')  await this.deleteIncome(pd.id);
        if (pd.type === 'expense') await this.deleteExpense(pd.id);
        if (pd.type === 'debt')    await this.deleteDebt(pd.id);
        this._pendingDelete = null;
        this.closeModal('deleteModal');
      });

      // Print / Export PDF
      document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
    }
  };

  const dashApp = app;
  window.dashApp = app;
  app.init();
}
