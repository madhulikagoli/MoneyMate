/**
 * MoneyMate - Budgets Module
 * Manages monthly master budgets and per-category spending limits with 3-tier visual alerts.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Budgets = {
    getBudgets() {
      const data = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.BUDGETS);
      return data || { overall: 25000, categories: {} };
    },

    saveBudgets(budgets) {
      return window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.BUDGETS, budgets);
    },

    setOverallBudget(amount) {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Overall budget must be a positive number.');
      }
      const b = this.getBudgets();
      b.overall = amt;
      this.saveBudgets(b);
      return b;
    },

    setCategoryBudget(categoryName, amount) {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Category budget limit must be a positive number.');
      }
      const b = this.getBudgets();
      b.categories = b.categories || {};
      b.categories[categoryName] = amt;
      this.saveBudgets(b);
      return b;
    },

    deleteCategoryBudget(categoryName) {
      const b = this.getBudgets();
      if (b.categories && b.categories[categoryName]) {
        delete b.categories[categoryName];
        this.saveBudgets(b);
      }
      return b;
    },

    getStatusLevel(percentage) {
      if (percentage >= 100) return 'danger';
      if (percentage >= 80) return 'warning';
      return 'normal';
    },

    getBudgetReport(targetMonth) {
      const budgets = this.getBudgets();
      const stats = window.MoneyMate.Expenses.getMonthStats(targetMonth);
      const categories = window.MoneyMate.Categories.getAll();

      const overallLimit = budgets.overall || 0;
      const overallSpent = stats.totalExpense;
      const overallPercent = overallLimit > 0 ? Math.round((overallSpent / overallLimit) * 100) : 0;
      const overallRemaining = overallLimit - overallSpent;
      const overallStatus = this.getStatusLevel(overallPercent);

      const categoryReports = [];
      const alerts = [];

      const budgetedCategories = Object.keys(budgets.categories || {});
      const allCategoryNames = Array.from(
        new Set([...budgetedCategories, ...categories.map(c => c.name)])
      );

      allCategoryNames.forEach(catName => {
        const catConfig = categories.find(c => c.name.toLowerCase() === catName.toLowerCase()) || {
          name: catName,
          color: '#6366F1',
          icon: 'tag'
        };

        const limit = (budgets.categories && budgets.categories[catName]) || 0;
        const spent = stats.categorySpend[catName] || 0;
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const remaining = limit > 0 ? (limit - spent) : 0;
        const status = limit > 0 ? this.getStatusLevel(percent) : 'unbudgeted';

        if (limit > 0) {
          if (status === 'danger') {
            alerts.push({
              level: 'danger',
              category: catName,
              message: `Exceeded budget for ${catName} by ${percent - 100}%! (${spent} / ${limit})`
            });
          } else if (status === 'warning') {
            alerts.push({
              level: 'warning',
              category: catName,
              message: `${catName} is at ${percent}% of budget limit. Approaching threshold.`
            });
          }
        }

        categoryReports.push({
          category: catName,
          color: catConfig.color,
          icon: catConfig.icon,
          limit,
          spent,
          remaining,
          percent,
          status,
          hasBudget: limit > 0
        });
      });

      if (overallLimit > 0) {
        if (overallStatus === 'danger') {
          alerts.unshift({
            level: 'danger',
            category: 'Overall',
            message: `Monthly budget exceeded! You have spent ${overallPercent}% of your ₹${overallLimit} target.`
          });
        } else if (overallStatus === 'warning') {
          alerts.unshift({
            level: 'warning',
            category: 'Overall',
            message: `You've used ${overallPercent}% of your total monthly budget. Manage remaining expenses carefully.`
          });
        }
      }

      return {
        month: stats.month,
        overall: {
          limit: overallLimit,
          spent: overallSpent,
          remaining: overallRemaining,
          percent: overallPercent,
          status: overallStatus
        },
        categories: categoryReports.sort((a, b) => {
          if (a.hasBudget && !b.hasBudget) return -1;
          if (!a.hasBudget && b.hasBudget) return 1;
          return b.percent - a.percent;
        }),
        alerts
      };
    }
  };

  window.MoneyMate.Budgets = Budgets;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Budgets = Budgets;
})();
