/**
 * MoneyMate - Recurring Expenses Module
 * Manages automated recurring bills and subscriptions (weekly/monthly) and auto-logs them on schedule.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Recurring = {
    getAll() {
      const data = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.RECURRING);
      return Array.isArray(data) ? data : [];
    },

    getById(id) {
      const all = this.getAll();
      return all.find(r => r.id === id) || null;
    },

    add(data) {
      this.validate(data);

      const startDate = data.startDate || new Date().toISOString().split('T')[0];
      const nextDue = this.calculateInitialNextDueDate(startDate, data.frequency);

      const item = {
        id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: data.title.trim(),
        amount: parseFloat(data.amount),
        type: 'expense',
        category: data.category || 'Bills',
        paymentMethod: data.paymentMethod || 'UPI',
        frequency: data.frequency || 'monthly',
        startDate: startDate,
        lastProcessed: null,
        nextDueDate: nextDue,
        active: true,
        createdAt: Date.now()
      };

      const all = this.getAll();
      all.push(item);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.RECURRING, all);
      return item;
    },

    update(id, data) {
      this.validate(data);

      const all = this.getAll();
      const index = all.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error('Recurring rule not found.');
      }

      all[index] = {
        ...all[index],
        title: data.title.trim(),
        amount: parseFloat(data.amount),
        category: data.category || 'Bills',
        paymentMethod: data.paymentMethod || 'UPI',
        frequency: data.frequency || all[index].frequency,
        updatedAt: Date.now()
      };

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.RECURRING, all);
      return all[index];
    },

    toggleActive(id) {
      const all = this.getAll();
      const item = all.find(r => r.id === id);
      if (!item) {
        throw new Error('Recurring rule not found.');
      }
      item.active = !item.active;
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.RECURRING, all);
      return item;
    },

    delete(id) {
      const all = this.getAll();
      const filtered = all.filter(r => r.id !== id);
      if (filtered.length === all.length) {
        throw new Error('Recurring rule not found.');
      }
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.RECURRING, filtered);
      return true;
    },

    validate(data) {
      if (!data.title || !data.title.trim()) {
        throw new Error('Title is required for recurring item.');
      }
      const amt = parseFloat(data.amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Amount must be a positive number.');
      }
      if (!['weekly', 'monthly'].includes(data.frequency)) {
        throw new Error('Frequency must be weekly or monthly.');
      }
    },

    calculateInitialNextDueDate(startDateStr, frequency) {
      const start = new Date(startDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start > today) {
        return startDateStr;
      }

      return this.computeNextDate(startDateStr, frequency);
    },

    computeNextDate(currentDateStr, frequency) {
      const d = new Date(currentDateStr);
      if (frequency === 'weekly') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d.toISOString().split('T')[0];
    },

    processDueRecurring() {
      const all = this.getAll();
      const todayStr = new Date().toISOString().split('T')[0];
      const createdTransactions = [];
      let stateChanged = false;

      all.forEach(item => {
        if (!item.active) return;

        if (item.nextDueDate && item.nextDueDate <= todayStr) {
          try {
            const tx = window.MoneyMate.Expenses.add({
              title: `${item.title} (Recurring)`,
              amount: item.amount,
              type: 'expense',
              category: item.category,
              date: item.nextDueDate,
              paymentMethod: item.paymentMethod,
              notes: `Auto-generated ${item.frequency} recurring payment.`
            });

            createdTransactions.push(tx);
            item.lastProcessed = item.nextDueDate;
            item.nextDueDate = this.computeNextDate(item.nextDueDate, item.frequency);
            stateChanged = true;
          } catch (err) {
            console.error('Error auto-processing recurring expense:', item, err);
          }
        }
      });

      if (stateChanged) {
        window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.RECURRING, all);
      }

      return createdTransactions;
    }
  };

  window.MoneyMate.Recurring = Recurring;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Recurring = Recurring;
})();
