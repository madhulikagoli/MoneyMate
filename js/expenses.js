/**
 * MoneyMate - Expenses & Transactions Module
 * Manages CRUD operations, searching, filtering, sorting, aggregations, insights, and CSV export.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Expenses = {
    getAll() {
      const data = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.TRANSACTIONS);
      return Array.isArray(data) ? data : [];
    },

    getById(id) {
      const all = this.getAll();
      return all.find(t => t.id === id) || null;
    },

    add(transactionData) {
      this.validate(transactionData);

      const newTx = {
        id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: transactionData.type === 'income' ? 'income' : 'expense',
        title: transactionData.title.trim(),
        amount: parseFloat(transactionData.amount),
        category: transactionData.category || 'Other',
        date: transactionData.date,
        paymentMethod: transactionData.paymentMethod || 'UPI',
        notes: (transactionData.notes || '').trim(),
        createdAt: Date.now()
      };

      const all = this.getAll();
      all.unshift(newTx);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.TRANSACTIONS, all);
      return newTx;
    },

    update(id, updateData) {
      this.validate(updateData);

      const all = this.getAll();
      const index = all.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Transaction not found.');
      }

      all[index] = {
        ...all[index],
        type: updateData.type === 'income' ? 'income' : 'expense',
        title: updateData.title.trim(),
        amount: parseFloat(updateData.amount),
        category: updateData.category || 'Other',
        date: updateData.date,
        paymentMethod: updateData.paymentMethod || 'UPI',
        notes: (updateData.notes || '').trim(),
        updatedAt: Date.now()
      };

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.TRANSACTIONS, all);
      return all[index];
    },

    delete(id) {
      const all = this.getAll();
      const filtered = all.filter(t => t.id !== id);
      if (filtered.length === all.length) {
        throw new Error('Transaction not found.');
      }
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.TRANSACTIONS, filtered);
      return true;
    },

    validate(data) {
      if (!data.title || !data.title.trim()) {
        throw new Error('Please enter a transaction title.');
      }
      const amt = parseFloat(data.amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Amount must be a positive number greater than 0.');
      }
      if (!data.date) {
        throw new Error('Please select a valid date.');
      }
      if (!['expense', 'income'].includes(data.type)) {
        throw new Error('Transaction type must be either expense or income.');
      }
      if (!['Cash', 'UPI', 'Card'].includes(data.paymentMethod)) {
        throw new Error('Payment method must be Cash, UPI, or Card.');
      }
    },

    reassignCategory(oldCategory, newCategory) {
      const all = this.getAll();
      let changed = false;
      all.forEach(t => {
        if (t.category === oldCategory) {
          t.category = newCategory;
          changed = true;
        }
      });
      if (changed) {
        window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.TRANSACTIONS, all);
      }
    },

    filterAndSort(filters = {}) {
      let results = [...this.getAll()];

      if (filters.search && filters.search.trim()) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(t =>
          t.title.toLowerCase().includes(query) ||
          (t.notes && t.notes.toLowerCase().includes(query)) ||
          t.category.toLowerCase().includes(query)
        );
      }

      if (filters.type && filters.type !== 'all') {
        results = results.filter(t => t.type === filters.type);
      }

      if (filters.category && filters.category !== 'all') {
        results = results.filter(t => t.category.toLowerCase() === filters.category.toLowerCase());
      }

      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        results = results.filter(t => t.paymentMethod === filters.paymentMethod);
      }

      if (filters.startDate) {
        results = results.filter(t => t.date >= filters.startDate);
      }
      if (filters.endDate) {
        results = results.filter(t => t.date <= filters.endDate);
      }

      if (filters.minAmount !== undefined && filters.minAmount !== '' && !isNaN(filters.minAmount)) {
        results = results.filter(t => t.amount >= parseFloat(filters.minAmount));
      }
      if (filters.maxAmount !== undefined && filters.maxAmount !== '' && !isNaN(filters.maxAmount)) {
        results = results.filter(t => t.amount <= parseFloat(filters.maxAmount));
      }

      const sortBy = filters.sortBy || 'date-desc';
      results.sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0);
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'date-desc':
          default:
            return b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
        }
      });

      return results;
    },

    getMonthStats(targetMonth) {
      if (!targetMonth) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        targetMonth = `${y}-${m}`;
      }

      const all = this.getAll();
      const monthTx = all.filter(t => t.date.startsWith(targetMonth));

      let totalExpense = 0;
      let totalIncome = 0;
      const categorySpend = {};
      const paymentSpend = { Cash: 0, UPI: 0, Card: 0 };

      monthTx.forEach(t => {
        if (t.type === 'expense') {
          totalExpense += t.amount;
          categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
          if (paymentSpend[t.paymentMethod] !== undefined) {
            paymentSpend[t.paymentMethod] += t.amount;
          }
        } else if (t.type === 'income') {
          totalIncome += t.amount;
        }
      });

      const netBalance = totalIncome - totalExpense;

      const [yearStr, monthStr] = targetMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const now = new Date();
      let daysCount = 30;

      if (now.getFullYear() === y && (now.getMonth() + 1) === m) {
        daysCount = Math.max(1, now.getDate());
      } else {
        daysCount = new Date(y, m, 0).getDate();
      }

      const dailyAverage = totalExpense > 0 ? (totalExpense / daysCount) : 0;

      return {
        month: targetMonth,
        totalExpense,
        totalIncome,
        netBalance,
        dailyAverage,
        daysCount,
        transactionCount: monthTx.length,
        categorySpend,
        paymentSpend,
        transactions: monthTx
      };
    },

    getTrendData(monthsCount = 6) {
      const all = this.getAll();
      const monthMap = {};
      const monthLabels = [];

      const now = new Date();
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });

        monthLabels.push(label);
        monthMap[key] = {
          label,
          key,
          expense: 0,
          income: 0
        };
      }

      all.forEach(t => {
        const mKey = t.date.substring(0, 7);
        if (monthMap[mKey]) {
          if (t.type === 'expense') {
            monthMap[mKey].expense += t.amount;
          } else if (t.type === 'income') {
            monthMap[mKey].income += t.amount;
          }
        }
      });

      const sortedKeys = Object.keys(monthMap).sort();
      return {
        labels: sortedKeys.map(k => monthMap[k].label),
        expenses: sortedKeys.map(k => monthMap[k].expense),
        incomes: sortedKeys.map(k => monthMap[k].income)
      };
    },

    getSmartInsights(targetMonth) {
      if (!targetMonth) {
        const today = new Date();
        targetMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      }

      const currentStats = this.getMonthStats(targetMonth);

      const [curY, curM] = targetMonth.split('-').map(Number);
      const prevDate = new Date(curY, curM - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevStats = this.getMonthStats(prevMonth);

      const insights = [];

      let maxSpikeCat = null;
      let maxSpikePct = 0;

      Object.keys(currentStats.categorySpend).forEach(cat => {
        const curCatSpend = currentStats.categorySpend[cat];
        const prevCatSpend = prevStats.categorySpend[cat] || 0;

        if (prevCatSpend > 0) {
          const diffPct = Math.round(((curCatSpend - prevCatSpend) / prevCatSpend) * 100);
          if (diffPct > maxSpikePct) {
            maxSpikePct = diffPct;
            maxSpikeCat = cat;
          }
        }
      });

      if (maxSpikeCat && maxSpikePct >= 10) {
        insights.push({
          type: 'warning',
          icon: 'trending-up',
          title: `Category Spend Surge`,
          text: `You spent ${maxSpikePct}% more on ${maxSpikeCat} this month compared to last month.`
        });
      }

      const sortedCategories = Object.entries(currentStats.categorySpend)
        .sort((a, b) => b[1] - a[1]);

      if (sortedCategories.length > 0 && currentStats.totalExpense > 0) {
        const [topCat, topAmt] = sortedCategories[0];
        const catRatio = Math.round((topAmt / currentStats.totalExpense) * 100);
        insights.push({
          type: 'info',
          icon: 'pie-chart',
          title: `Primary Expense Driver`,
          text: `${topCat} makes up ${catRatio}% of your total spending this month (${window.MoneyMate.UI ? window.MoneyMate.UI.formatCurrency(topAmt) : '₹' + topAmt}).`
        });
      }

      if (currentStats.totalIncome > 0) {
        const savingsRate = Math.round(((currentStats.totalIncome - currentStats.totalExpense) / currentStats.totalIncome) * 100);
        if (savingsRate > 25) {
          insights.push({
            type: 'success',
            icon: 'award',
            title: `Healthy Savings Rate`,
            text: `Great financial discipline! You've retained ${savingsRate}% of your total income this month.`
          });
        } else if (savingsRate < 0) {
          insights.push({
            type: 'danger',
            icon: 'alert-triangle',
            title: `Cash Flow Deficit`,
            text: `Your expenses exceeded income by ${Math.abs(savingsRate)}% this month. Review non-essential spending.`
          });
        }
      }

      if (insights.length === 0) {
        insights.push({
          type: 'info',
          icon: 'info',
          title: `Financial Routine`,
          text: `Keep recording daily purchases. Consistent tracking is proven to reduce discretionary impulse spends by up to 20%.`
        });
      }

      return insights;
    },

    exportToCSV(transactionsToExport, filename = 'moneymate_transactions.csv') {
      const list = transactionsToExport || this.getAll();
      if (!list || list.length === 0) {
        throw new Error('No transactions available to export.');
      }

      const headers = ['ID', 'Date', 'Type', 'Title', 'Category', 'Amount', 'Payment Method', 'Notes'];

      const escapeCSV = (str) => {
        if (str === null || str === undefined) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const rows = list.map(t => [
        escapeCSV(t.id),
        escapeCSV(t.date),
        escapeCSV(t.type),
        escapeCSV(t.title),
        escapeCSV(t.category),
        escapeCSV(t.amount.toFixed(2)),
        escapeCSV(t.paymentMethod),
        escapeCSV(t.notes || '')
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    }
  };

  window.MoneyMate.Expenses = Expenses;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Expenses = Expenses;
})();
