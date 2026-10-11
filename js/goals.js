/**
 * MoneyMate - Savings Goals Module
 * Handles target amounts, deadlines, contributions, progress %, and required monthly savings calculator.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Goals = {
    getAll() {
      const data = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.GOALS);
      return Array.isArray(data) ? data : [];
    },

    getById(id) {
      const all = this.getAll();
      return all.find(g => g.id === id) || null;
    },

    add(data) {
      this.validate(data);

      const targetAmt = parseFloat(data.targetAmount);
      const initialAmt = parseFloat(data.currentAmount || 0);

      const newGoal = {
        id: 'goal_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: data.name.trim(),
        targetAmount: targetAmt,
        currentAmount: initialAmt,
        deadline: data.deadline,
        color: data.color || '#4F46E5',
        icon: data.icon || 'target',
        contributions: initialAmt > 0 ? [
          {
            id: 'cnt_' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: initialAmt,
            notes: 'Initial starting balance'
          }
        ] : [],
        createdAt: Date.now()
      };

      const all = this.getAll();
      all.push(newGoal);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.GOALS, all);
      return newGoal;
    },

    update(id, data) {
      this.validate(data);

      const all = this.getAll();
      const index = all.findIndex(g => g.id === id);
      if (index === -1) {
        throw new Error('Savings goal not found.');
      }

      all[index] = {
        ...all[index],
        name: data.name.trim(),
        targetAmount: parseFloat(data.targetAmount),
        deadline: data.deadline,
        color: data.color || all[index].color,
        icon: data.icon || all[index].icon,
        updatedAt: Date.now()
      };

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.GOALS, all);
      return all[index];
    },

    delete(id) {
      const all = this.getAll();
      const filtered = all.filter(g => g.id !== id);
      if (filtered.length === all.length) {
        throw new Error('Savings goal not found.');
      }
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.GOALS, filtered);
      return true;
    },

    addContribution(goalId, contributionData) {
      const amt = parseFloat(contributionData.amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Contribution amount must be greater than 0.');
      }

      const all = this.getAll();
      const goal = all.find(g => g.id === goalId);
      if (!goal) {
        throw new Error('Savings goal not found.');
      }

      const contribution = {
        id: 'cnt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        amount: amt,
        date: contributionData.date || new Date().toISOString().split('T')[0],
        notes: (contributionData.notes || '').trim()
      };

      goal.contributions = goal.contributions || [];
      goal.contributions.unshift(contribution);
      goal.currentAmount = (goal.currentAmount || 0) + amt;

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.GOALS, all);
      return { goal, contribution };
    },

    validate(data) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Goal name is required.');
      }
      const target = parseFloat(data.targetAmount);
      if (isNaN(target) || target <= 0) {
        throw new Error('Target amount must be a positive number.');
      }
      if (!data.deadline) {
        throw new Error('Deadline date is required.');
      }
    },

    getGoalMetrics(goal) {
      const target = goal.targetAmount || 1;
      const current = goal.currentAmount || 0;
      const progressPercent = Math.min(100, Math.round((current / target) * 100));
      const remainingAmount = Math.max(0, target - current);

      const now = new Date();
      const deadlineDate = new Date(goal.deadline + 'T23:59:59');
      const timeDiff = deadlineDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      const monthsLeft = Math.max(0, (
        (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
        (deadlineDate.getMonth() - now.getMonth())
      ));

      let monthlyNeeded = 0;
      let statusText = '';
      let isCompleted = current >= target;

      if (isCompleted) {
        statusText = 'Goal Achieved! 🎉';
      } else if (daysLeft < 0) {
        statusText = 'Target deadline expired';
        monthlyNeeded = remainingAmount;
      } else if (monthsLeft <= 1) {
        monthlyNeeded = remainingAmount;
        statusText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`;
      } else {
        monthlyNeeded = Math.round(remainingAmount / monthsLeft);
        statusText = `${monthsLeft} months remaining`;
      }

      return {
        ...goal,
        progressPercent,
        remainingAmount,
        daysLeft,
        monthsLeft,
        monthlyNeeded,
        statusText,
        isCompleted
      };
    }
  };

  window.MoneyMate.Goals = Goals;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Goals = Goals;
})();
