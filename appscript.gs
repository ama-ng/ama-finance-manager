// ============================================================
// AMA Finance Manager - Google Apps Script Backend
// Copyright © 2026 AMA Global Inc. All Rights Reserved.
// ============================================================

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1Dc3CpN_OexRvUH4oZWdqgELvHeqQYji8x6C4HJ41Jgw'; // Replace with your Google Sheet ID

// Sheet names
const SHEETS = {
  USERS:    'Users',
  INCOME:   'Income',
  EXPENSES: 'Expenses',
  DEBTS:    'Debts',
  PAYMENTS: 'Payments'
};

// ============================================================
// MAIN ENTRY POINTS
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch (action) {
      case 'registerUser':    result = registerUser(data);        break;
      case 'loginUser':       result = loginUser(data);           break;
      case 'addIncome':       result = addIncome(data);           break;
      case 'updateIncome':    result = updateIncome(data);        break;
      case 'deleteIncome':    result = deleteIncome(data);        break;
      case 'addExpense':      result = addExpense(data);          break;
      case 'updateExpense':   result = updateExpense(data);       break;
      case 'deleteExpense':   result = deleteExpense(data);       break;
      case 'addDebt':         result = addDebt(data);             break;
      case 'updateDebt':      result = updateDebt(data);          break;
      case 'deleteDebt':      result = deleteDebt(data);          break;
      case 'recordPayment':   result = recordPayment(data);       break;
      case 'updateProfile':   result = updateProfile(data);       break;
      case 'changePassword':  result = changePassword(data);      break;
      default: result = { success: false, message: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const userId = e.parameter.userId;

    let result;
    switch (action) {
      case 'fetchDashboard': result = fetchDashboardData(userId);        break;
      case 'fetchIncome':    result = fetchIncome(userId);               break;
      case 'fetchExpenses':  result = fetchExpenses(userId);             break;
      case 'fetchDebts':     result = fetchDebts(userId);                break;
      case 'fetchPayments':  result = fetchPayments(e.parameter.debtId); break;
      case 'fetchReports':   result = fetchReports(userId, e.parameter); break;
      default: result = { success: false, message: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function generateId(prefix) {
  return prefix + '_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

function hashPassword(password) {
  // Simple hash simulation using base64 + salt
  // In production, use a proper hashing library
  const salt = 'AMA2026SALT';
  return Utilities.base64Encode(salt + password + salt);
}

function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>'"&]/g, '').trim();
}

function formatDate(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ============================================================
// SETUP: Initialize sheets with headers
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const config = [
    { name: SHEETS.USERS,    headers: ['UserID','FullName','Email','Phone','Username','Password','DateCreated'] },
    { name: SHEETS.INCOME,   headers: ['TransactionID','UserID','Source','Amount','Category','Date','Notes'] },
    { name: SHEETS.EXPENSES, headers: ['TransactionID','UserID','ExpenseName','Amount','Category','Date','Notes'] },
    { name: SHEETS.DEBTS,    headers: ['DebtID','UserID','PersonName','Type','Amount','DueDate','Status','Notes','DateAdded'] },
    { name: SHEETS.PAYMENTS, headers: ['PaymentID','DebtID','AmountPaid','PaymentDate','RemainingBalance'] }
  ];

  config.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cfg.headers);
      sheet.getRange(1, 1, 1, cfg.headers.length)
           .setBackground('#1a3a6e')
           .setFontColor('#ffffff')
           .setFontWeight('bold');
    }
  });

  return { success: true, message: 'Sheets initialized successfully!' };
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================

function registerUser(data) {
  const { fullName, email, phone, username, password } = data;

  // Validate inputs
  if (!fullName || !email || !phone || !username || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  const sheet = getSheet(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();

  // Check duplicates (skip header row)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2].toString().toLowerCase() === email.toLowerCase()) {
      return { success: false, message: 'Email already registered.' };
    }
    if (rows[i][4].toString().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Username already taken.' };
    }
  }

  const userId = generateId('USR');
  const hashedPwd = hashPassword(password);

  sheet.appendRow([
    userId,
    sanitize(fullName),
    sanitize(email.toLowerCase()),
    sanitize(phone),
    sanitize(username.toLowerCase()),
    hashedPwd,
    formatDate(new Date())
  ]);

  return { success: true, message: 'Registration successful! Redirecting to login...' };
}

function loginUser(data) {
  const { usernameOrEmail, password } = data;

  if (!usernameOrEmail || !password) {
    return { success: false, message: 'Please fill in all fields.' };
  }

  const sheet = getSheet(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  const hashedPwd = hashPassword(password);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailMatch = row[2].toString().toLowerCase() === usernameOrEmail.toLowerCase();
    const usernameMatch = row[4].toString().toLowerCase() === usernameOrEmail.toLowerCase();

    if ((emailMatch || usernameMatch) && row[5] === hashedPwd) {
      return {
        success: true,
        message: 'Login successful!',
        user: {
          userId: row[0],
          fullName: row[1],
          email: row[2],
          phone: row[3],
          username: row[4]
        }
      };
    }
  }

  return { success: false, message: 'Invalid username/email or password.' };
}

// ============================================================
// INCOME FUNCTIONS
// ============================================================

function addIncome(data) {
  const { userId, source, amount, category, date, notes } = data;
  if (!userId || !source || !amount || !category || !date) {
    return { success: false, message: 'Required fields missing.' };
  }

  const sheet = getSheet(SHEETS.INCOME);
  const txnId = generateId('INC');

  sheet.appendRow([
    txnId, userId, sanitize(source), parseFloat(amount),
    sanitize(category), formatDate(date), sanitize(notes || '')
  ]);

  return { success: true, message: 'Income added successfully!', id: txnId };
}

function updateIncome(data) {
  const { transactionId, source, amount, category, date, notes } = data;
  const sheet = getSheet(SHEETS.INCOME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === transactionId) {
      sheet.getRange(i + 1, 3).setValue(sanitize(source));
      sheet.getRange(i + 1, 4).setValue(parseFloat(amount));
      sheet.getRange(i + 1, 5).setValue(sanitize(category));
      sheet.getRange(i + 1, 6).setValue(formatDate(date));
      sheet.getRange(i + 1, 7).setValue(sanitize(notes || ''));
      return { success: true, message: 'Income updated successfully!' };
    }
  }
  return { success: false, message: 'Record not found.' };
}

function deleteIncome(data) {
  const { transactionId } = data;
  const sheet = getSheet(SHEETS.INCOME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === transactionId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Income deleted successfully!' };
    }
  }
  return { success: false, message: 'Record not found.' };
}

function fetchIncome(userId) {
  const sheet = getSheet(SHEETS.INCOME);
  const rows = sheet.getDataRange().getValues();
  const income = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === userId) {
      income.push({
        transactionId: rows[i][0],
        source: rows[i][2],
        amount: rows[i][3],
        category: rows[i][4],
        date: rows[i][5],
        notes: rows[i][6]
      });
    }
  }

  income.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, data: income };
}

// ============================================================
// EXPENSE FUNCTIONS
// ============================================================

function addExpense(data) {
  const { userId, expenseName, amount, category, date, notes } = data;
  if (!userId || !expenseName || !amount || !category || !date) {
    return { success: false, message: 'Required fields missing.' };
  }

  const sheet = getSheet(SHEETS.EXPENSES);
  const txnId = generateId('EXP');

  sheet.appendRow([
    txnId, userId, sanitize(expenseName), parseFloat(amount),
    sanitize(category), formatDate(date), sanitize(notes || '')
  ]);

  return { success: true, message: 'Expense added successfully!', id: txnId };
}

function updateExpense(data) {
  const { transactionId, expenseName, amount, category, date, notes } = data;
  const sheet = getSheet(SHEETS.EXPENSES);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === transactionId) {
      sheet.getRange(i + 1, 3).setValue(sanitize(expenseName));
      sheet.getRange(i + 1, 4).setValue(parseFloat(amount));
      sheet.getRange(i + 1, 5).setValue(sanitize(category));
      sheet.getRange(i + 1, 6).setValue(formatDate(date));
      sheet.getRange(i + 1, 7).setValue(sanitize(notes || ''));
      return { success: true, message: 'Expense updated successfully!' };
    }
  }
  return { success: false, message: 'Record not found.' };
}

function deleteExpense(data) {
  const { transactionId } = data;
  const sheet = getSheet(SHEETS.EXPENSES);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === transactionId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Expense deleted successfully!' };
    }
  }
  return { success: false, message: 'Record not found.' };
}

function fetchExpenses(userId) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rows = sheet.getDataRange().getValues();
  const expenses = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === userId) {
      expenses.push({
        transactionId: rows[i][0],
        expenseName: rows[i][2],
        amount: rows[i][3],
        category: rows[i][4],
        date: rows[i][5],
        notes: rows[i][6]
      });
    }
  }

  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, data: expenses };
}

// ============================================================
// DEBT FUNCTIONS
// ============================================================

function addDebt(data) {
  const { userId, personName, type, amount, dueDate, notes } = data;
  if (!userId || !personName || !type || !amount) {
    return { success: false, message: 'Required fields missing.' };
  }

  const sheet = getSheet(SHEETS.DEBTS);
  const debtId = generateId('DBT');

  sheet.appendRow([
    debtId, userId, sanitize(personName), sanitize(type),
    parseFloat(amount), dueDate ? formatDate(dueDate) : '',
    'Unpaid', sanitize(notes || ''), formatDate(new Date())
  ]);

  return { success: true, message: 'Debt added successfully!', id: debtId };
}

function updateDebt(data) {
  const { debtId, personName, type, amount, dueDate, status, notes } = data;
  const sheet = getSheet(SHEETS.DEBTS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === debtId) {
      if (personName) sheet.getRange(i + 1, 3).setValue(sanitize(personName));
      if (type)       sheet.getRange(i + 1, 4).setValue(sanitize(type));
      if (amount)     sheet.getRange(i + 1, 5).setValue(parseFloat(amount));
      if (dueDate)    sheet.getRange(i + 1, 6).setValue(formatDate(dueDate));
      if (status)     sheet.getRange(i + 1, 7).setValue(sanitize(status));
      if (notes !== undefined) sheet.getRange(i + 1, 8).setValue(sanitize(notes));
      return { success: true, message: 'Debt updated successfully!' };
    }
  }
  return { success: false, message: 'Debt record not found.' };
}

function deleteDebt(data) {
  const { debtId } = data;
  const sheet = getSheet(SHEETS.DEBTS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === debtId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Debt deleted successfully!' };
    }
  }
  return { success: false, message: 'Record not found.' };
}

function fetchDebts(userId) {
  const debtSheet = getSheet(SHEETS.DEBTS);
  const paySheet = getSheet(SHEETS.PAYMENTS);
  const debtRows = debtSheet.getDataRange().getValues();
  const payRows = paySheet.getDataRange().getValues();
  const debts = [];

  for (let i = 1; i < debtRows.length; i++) {
    if (debtRows[i][1] === userId) {
      const debtId = debtRows[i][0];
      const originalAmount = parseFloat(debtRows[i][4]) || 0;

      // Sum payments for this debt
      let totalPaid = 0;
      for (let j = 1; j < payRows.length; j++) {
        if (payRows[j][1] === debtId) {
          totalPaid += parseFloat(payRows[j][2]) || 0;
        }
      }

      const remaining = Math.max(0, originalAmount - totalPaid);

      debts.push({
        debtId: debtId,
        personName: debtRows[i][2],
        type: debtRows[i][3],
        amount: originalAmount,
        dueDate: debtRows[i][5],
        status: remaining <= 0 ? 'Paid' : debtRows[i][6],
        notes: debtRows[i][7],
        dateAdded: debtRows[i][8],
        totalPaid: totalPaid,
        remaining: remaining
      });
    }
  }

  debts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  return { success: true, data: debts };
}

function recordPayment(data) {
  const { debtId, amountPaid, paymentDate } = data;
  if (!debtId || !amountPaid || !paymentDate) {
    return { success: false, message: 'Required fields missing.' };
  }

  // Get debt original amount
  const debtSheet = getSheet(SHEETS.DEBTS);
  const debtRows = debtSheet.getDataRange().getValues();
  let originalAmount = 0;

  for (let i = 1; i < debtRows.length; i++) {
    if (debtRows[i][0] === debtId) {
      originalAmount = parseFloat(debtRows[i][4]) || 0;
      break;
    }
  }

  // Get total paid so far
  const paySheet = getSheet(SHEETS.PAYMENTS);
  const payRows = paySheet.getDataRange().getValues();
  let totalPaid = 0;

  for (let i = 1; i < payRows.length; i++) {
    if (payRows[i][1] === debtId) {
      totalPaid += parseFloat(payRows[i][2]) || 0;
    }
  }

  const newTotal = totalPaid + parseFloat(amountPaid);
  const remaining = Math.max(0, originalAmount - newTotal);
  const paymentId = generateId('PAY');

  paySheet.appendRow([
    paymentId, debtId, parseFloat(amountPaid),
    formatDate(paymentDate), remaining
  ]);

  // Auto-update debt status if fully paid
  if (remaining <= 0) {
    updateDebt({ debtId, status: 'Paid' });
  }

  return { success: true, message: 'Payment recorded!', remaining: remaining };
}

function fetchPayments(debtId) {
  const sheet = getSheet(SHEETS.PAYMENTS);
  const rows = sheet.getDataRange().getValues();
  const payments = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === debtId) {
      payments.push({
        paymentId: rows[i][0],
        amountPaid: rows[i][2],
        paymentDate: rows[i][3],
        remaining: rows[i][4]
      });
    }
  }

  payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  return { success: true, data: payments };
}

// ============================================================
// DASHBOARD DATA
// ============================================================

function fetchDashboardData(userId) {
  const incomeData = fetchIncome(userId).data;
  const expenseData = fetchExpenses(userId).data;
  const debtData = fetchDebts(userId).data;

  const totalIncome = incomeData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalExpenses = expenseData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const borrowed = debtData.filter(d => d.type === 'Borrowed');
  const lent = debtData.filter(d => d.type === 'Lent');

  const totalBorrowed = borrowed.reduce((s, d) => s + parseFloat(d.remaining || 0), 0);
  const totalLent = lent.reduce((s, d) => s + parseFloat(d.remaining || 0), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = incomeData
    .filter(r => { const d = new Date(r.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const monthlyExpenses = expenseData
    .filter(r => { const d = new Date(r.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  // Last 6 months trend
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleString('default', { month: 'short' }) + ' ' + y;

    const inc = incomeData.filter(r => { const rd = new Date(r.date); return rd.getMonth() === m && rd.getFullYear() === y; })
                          .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const exp = expenseData.filter(r => { const rd = new Date(r.date); return rd.getMonth() === m && rd.getFullYear() === y; })
                           .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    months.push({ label, income: inc, expenses: exp });
  }

  // Category breakdown
  const expCats = {};
  expenseData.forEach(r => {
    expCats[r.category] = (expCats[r.category] || 0) + parseFloat(r.amount || 0);
  });

  // Recent transactions (last 5 each)
  const recentIncome = incomeData.slice(0, 5);
  const recentExpenses = expenseData.slice(0, 5);

  return {
    success: true,
    data: {
      totalIncome,
      totalExpenses,
      totalBorrowed,
      totalLent,
      monthlySavings: monthlyIncome - monthlyExpenses,
      monthlyIncome,
      monthlyExpenses,
      netBalance: totalIncome - totalExpenses,
      trend: months,
      categoryBreakdown: expCats,
      recentIncome,
      recentExpenses,
      debtSummary: { borrowed: borrowed.length, lent: lent.length, totalBorrowed, totalLent }
    }
  };
}

// ============================================================
// REPORTS
// ============================================================

function fetchReports(userId, params) {
  const period = params.period || 'monthly';
  const incomeData = fetchIncome(userId).data;
  const expenseData = fetchExpenses(userId).data;
  const debtData = fetchDebts(userId).data;

  const now = new Date();

  let filterFn;
  if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filterFn = d => new Date(d) >= weekAgo;
  } else if (period === 'yearly') {
    filterFn = d => new Date(d).getFullYear() === now.getFullYear();
  } else {
    filterFn = d => {
      const rd = new Date(d);
      return rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear();
    };
  }

  const filteredIncome = incomeData.filter(r => filterFn(r.date));
  const filteredExpenses = expenseData.filter(r => filterFn(r.date));

  const totalIncome = filteredIncome.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const catBreakdown = {};
  filteredExpenses.forEach(r => {
    catBreakdown[r.category] = (catBreakdown[r.category] || 0) + parseFloat(r.amount || 0);
  });

  const incomeBreakdown = {};
  filteredIncome.forEach(r => {
    incomeBreakdown[r.category] = (incomeBreakdown[r.category] || 0) + parseFloat(r.amount || 0);
  });

  return {
    success: true,
    data: {
      period,
      totalIncome,
      totalExpenses,
      savings: totalIncome - totalExpenses,
      expenseCategoryBreakdown: catBreakdown,
      incomeCategoryBreakdown: incomeBreakdown,
      incomeRecords: filteredIncome,
      expenseRecords: filteredExpenses,
      debtData: debtData
    }
  };
}

// ============================================================
// PROFILE
// ============================================================

function updateProfile(data) {
  const { userId, fullName, phone } = data;
  const sheet = getSheet(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      if (fullName) sheet.getRange(i + 1, 2).setValue(sanitize(fullName));
      if (phone)    sheet.getRange(i + 1, 4).setValue(sanitize(phone));
      return { success: true, message: 'Profile updated successfully!' };
    }
  }
  return { success: false, message: 'User not found.' };
}

function changePassword(data) {
  const { userId, oldPassword, newPassword } = data;
  const sheet = getSheet(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      if (rows[i][5] !== hashPassword(oldPassword)) {
        return { success: false, message: 'Current password is incorrect.' };
      }
      sheet.getRange(i + 1, 6).setValue(hashPassword(newPassword));
      return { success: true, message: 'Password changed successfully!' };
    }
  }
  return { success: false, message: 'User not found.' };
}
