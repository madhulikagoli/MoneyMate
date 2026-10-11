/**
 * MoneyMate - Master Application Controller
 * Coordinates modules, manages auth lifecycle, view lifecycles, form submissions, and UI state.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const App = {
    transactionFilters: {
      search: '',
      type: 'all',
      category: 'all',
      paymentMethod: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date-desc'
    },

    activeEditingTxId: null,
    activeEditingGoalId: null,
    activeContributingGoalId: null,

    init() {
      // 1. Initialize Storage & Seed data if first visit
      window.MoneyMate.Storage.init();

      // 2. Initialize UI components (theme, currency, modal listeners)
      window.MoneyMate.UI.init();

      // 3. Bind Authentication Events
      this.bindAuthEvents();

      // 4. Process any due recurring expenses automatically if authenticated
      if (window.MoneyMate.Auth.isAuthenticated()) {
        this.checkRecurringTasks();
      }

      // 5. Populate dynamic dropdowns
      this.populateCategorySelects();

      // 6. Setup Form Listeners & Interactive Event Handlers
      this.bindForms();
      this.bindTransactionFilters();
      this.bindDemoControls();

      // 7. Set default transaction date to today in modals
      this.resetTransactionForm();

      // 8. Initial render of the active tab
      this.renderAll();

      console.log('MoneyMate Application Initialized Successfully.');
    },

    /* ==========================================================================
       AUTHENTICATION HANDLERS
       ========================================================================== */
    bindAuthEvents() {
      // Tab switcher in Auth Modal (Sign In vs Create Account)
      document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          const mode = e.currentTarget.dataset.authMode;

          document.getElementById('auth-signin-box').style.display = mode === 'signin' ? 'block' : 'none';
          document.getElementById('auth-signup-box').style.display = mode === 'signup' ? 'block' : 'none';
        });
      });

      // Sign In Form Submission
      const signinForm = document.getElementById('form-signin');
      if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('signin-email').value;
          const password = document.getElementById('signin-password').value;

          try {
            const user = window.MoneyMate.Auth.login(email, password);
            window.MoneyMate.UI.showToast(`Welcome back, ${user.name}!`, 'success');
            window.MoneyMate.UI.checkAuthState();
            this.renderAll();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      // Quick Demo Login Button
      const demoLoginBtn = document.getElementById('btn-quick-demo-login');
      if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', () => {
          const user = window.MoneyMate.Auth.loginDemo();
          window.MoneyMate.UI.showToast(`Signed in as ${user.name} (Demo Account)`, 'success');
          window.MoneyMate.UI.checkAuthState();
          this.renderAll();
        });
      }

      // Sign Up Form Submission
      const signupForm = document.getElementById('form-signup');
      if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('signup-name').value;
          const email = document.getElementById('signup-email').value;
          const password = document.getElementById('signup-password').value;
          const seedSample = document.getElementById('signup-seed-data').checked;

          try {
            const user = window.MoneyMate.Auth.register({
              name,
              email,
              password,
              seedSampleData: seedSample
            });
            window.MoneyMate.UI.showToast(`Account created! Welcome, ${user.name}!`, 'success');
            window.MoneyMate.UI.checkAuthState();
            this.renderAll();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      // Sign Out Buttons
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.handleLogout());
      }

      const logoutSidebarBtn = document.getElementById('btn-logout-sidebar');
      if (logoutSidebarBtn) {
        logoutSidebarBtn.addEventListener('click', () => this.handleLogout());
      }

      // Password visibility toggle buttons
      document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetId = e.currentTarget.dataset.targetInput;
          const input = document.getElementById(targetId);
          if (input) {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            e.currentTarget.classList.toggle('revealed', isPassword);
          }
        });
      });
    },

    handleLogout() {
      window.MoneyMate.UI.confirmAction({
        title: 'Sign Out?',
        message: 'Are you sure you want to sign out of your MoneyMate account?',
        confirmText: 'Sign Out',
        danger: false,
        onConfirm: () => {
          window.MoneyMate.Auth.logout();
          window.MoneyMate.UI.checkAuthState();
          window.MoneyMate.UI.showToast('You have been logged out.', 'info');
        }
      });
    },

    /**
     * Checks if recurring expenses are due today and auto-adds them.
     */
    checkRecurringTasks() {
      try {
        const autoAdded = window.MoneyMate.Recurring.processDueRecurring();
        if (autoAdded.length > 0) {
          const names = autoAdded.map(t => t.title).join(', ');
          setTimeout(() => {
            window.MoneyMate.UI.showToast(`Auto-logged recurring bill: ${names}`, 'info', 5000);
          }, 600);
        }
      } catch (err) {
        console.error('Failed to process recurring tasks:', err);
      }
    },

    /**
     * Populates category options in transaction form, filter bar, budget modal, etc.
     */
    populateCategorySelects() {
      const categories = window.MoneyMate.Categories.getAll();

      const txCategorySelect = document.getElementById('tx-category');
      if (txCategorySelect) {
        txCategorySelect.innerHTML = categories.map(c =>
          `<option value="${c.name}">${c.name}</option>`
        ).join('');
      }

      const filterCategorySelect = document.getElementById('filter-category');
      if (filterCategorySelect) {
        const currentVal = filterCategorySelect.value || 'all';
        filterCategorySelect.innerHTML = `
          <option value="all">All Categories</option>
          ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        `;
        filterCategorySelect.value = currentVal;
      }

      const recCategorySelect = document.getElementById('rec-category');
      if (recCategorySelect) {
        recCategorySelect.innerHTML = categories.map(c =>
          `<option value="${c.name}">${c.name}</option>`
        ).join('');
      }
    },

    /**
     * Re-renders all components or updates the currently visible view.
     */
    renderAll() {
      this.populateCategorySelects();
      this.renderDashboard();
      this.renderTransactions();
      this.renderBudgets();
      this.renderGoals();
      this.renderRecurring();
      this.renderReports();
    },

    renderView(viewName) {
      switch (viewName) {
        case 'dashboard':
          this.renderDashboard();
          break;
        case 'transactions':
          this.renderTransactions();
          break;
        case 'budgets':
          this.renderBudgets();
          break;
        case 'goals':
          this.renderGoals();
          break;
        case 'recurring':
          this.renderRecurring();
          break;
        case 'reports':
          this.renderReports();
          break;
        default:
          this.renderDashboard();
      }
    },

    /* ==========================================================================
       1. DASHBOARD VIEW RENDERER
       ========================================================================== */
    renderDashboard() {
      const stats = window.MoneyMate.Expenses.getMonthStats();
      const currentUser = window.MoneyMate.Auth.getCurrentUser();

      const greetingElem = document.getElementById('dashboard-user-greeting');
      if (greetingElem && currentUser) {
        greetingElem.textContent = `Welcome back, ${currentUser.name}! Here's your financial snapshot for October 2026.`;
      }

      // KPI Metric Cards
      const spentElem = document.getElementById('kpi-spent-this-month');
      const incomeElem = document.getElementById('kpi-total-income');
      const balanceElem = document.getElementById('kpi-net-balance');
      const dailyElem = document.getElementById('kpi-daily-average');

      if (spentElem) spentElem.textContent = window.MoneyMate.UI.formatCurrency(stats.totalExpense);
      if (incomeElem) incomeElem.textContent = window.MoneyMate.UI.formatCurrency(stats.totalIncome);
      if (balanceElem) {
        balanceElem.textContent = window.MoneyMate.UI.formatCurrency(stats.netBalance);
        balanceElem.className = stats.netBalance >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger';
      }
      if (dailyElem) dailyElem.textContent = window.MoneyMate.UI.formatCurrency(stats.dailyAverage);

      // Smart Insights
      this.renderSmartInsights();

      // Charts
      const donutCanvas = document.getElementById('category-donut-chart');
      if (donutCanvas) {
        window.MoneyMate.Charts.renderCategoryDonut(donutCanvas, stats.categorySpend);
      }

      const trendCanvas = document.getElementById('monthly-trend-chart');
      if (trendCanvas) {
        const trendData = window.MoneyMate.Expenses.getTrendData(6);
        window.MoneyMate.Charts.renderMonthlyTrend(trendCanvas, trendData);
      }

      // Recent 5 Transactions
      const recentContainer = document.getElementById('recent-transactions-list');
      if (recentContainer) {
        const allTx = window.MoneyMate.Expenses.filterAndSort({ sortBy: 'date-desc' }).slice(0, 5);

        if (allTx.length === 0) {
          recentContainer.innerHTML = `
            <div class="empty-state-mini">
              <p>No recent transactions recorded yet.</p>
              <button class="btn btn-sm btn-outline" data-open-modal="modal-transaction">Add First Transaction</button>
            </div>
          `;
        } else {
          recentContainer.innerHTML = allTx.map(t => this.createTransactionRowHTML(t, true)).join('');
        }
      }
    },

    renderSmartInsights() {
      const container = document.getElementById('smart-insight-banner');
      if (!container) return;

      const insights = window.MoneyMate.Expenses.getSmartInsights();
      if (insights.length === 0) {
        container.style.display = 'none';
        return;
      }

      const insight = insights[0];
      container.style.display = 'flex';
      container.className = `smart-insight-card insight-${insight.type}`;
      container.innerHTML = `
        <div class="insight-icon-wrap">
          <svg class="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <div class="insight-body">
          <div class="insight-title">${window.MoneyMate.UI.escapeHTML(insight.title)}</div>
          <div class="insight-text">${window.MoneyMate.UI.escapeHTML(insight.text)}</div>
        </div>
      `;
    },

    /* ==========================================================================
       2. TRANSACTIONS VIEW RENDERER
       ========================================================================== */
    renderTransactions() {
      const container = document.getElementById('transactions-ledger-list');
      const countElem = document.getElementById('filter-results-count');
      const sumElem = document.getElementById('filter-results-sum');
      if (!container) return;

      const filtered = window.MoneyMate.Expenses.filterAndSort(this.transactionFilters);

      const totalFilteredSum = filtered.reduce((acc, t) => {
        return t.type === 'expense' ? acc + t.amount : acc - t.amount;
      }, 0);

      if (countElem) countElem.textContent = `${filtered.length} transaction${filtered.length === 1 ? '' : 's'}`;
      if (sumElem) {
        sumElem.textContent = `Net: ${window.MoneyMate.UI.formatCurrency(Math.abs(totalFilteredSum))} (${totalFilteredSum >= 0 ? 'Expense' : 'Income Net'})`;
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-icon">🔍</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your search criteria, category filters, or date range.</p>
            <button class="btn btn-outline" id="btn-clear-filters-empty">Clear All Filters</button>
          </div>
        `;
        const clearBtn = document.getElementById('btn-clear-filters-empty');
        if (clearBtn) clearBtn.addEventListener('click', () => this.resetFilters());
        return;
      }

      container.innerHTML = `
        <div class="tx-table-wrapper">
          <table class="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th>Category</th>
                <th>Method</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(t => this.createTransactionRowHTML(t, false)).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    createTransactionRowHTML(t, isMini = false) {
      const catColor = window.MoneyMate.Categories.getColor(t.category);
      const isIncome = t.type === 'income';
      const amountPrefix = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'text-income' : 'text-expense';

      const dateParts = t.date.split('-');
      const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
        .toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

      if (isMini) {
        return `
          <div class="tx-item-card">
            <div class="tx-item-left">
              <span class="tx-category-badge" style="background-color: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}40;">
                ${window.MoneyMate.UI.escapeHTML(t.category)}
              </span>
              <div class="tx-info">
                <span class="tx-title">${window.MoneyMate.UI.escapeHTML(t.title)}</span>
                <span class="tx-date">${formattedDate} • ${t.paymentMethod}</span>
              </div>
            </div>
            <div class="tx-item-right">
              <span class="tx-amount ${amountClass}">${amountPrefix}${window.MoneyMate.UI.formatCurrency(t.amount)}</span>
            </div>
          </div>
        `;
      }

      return `
        <tr class="tx-row" data-id="${t.id}">
          <td class="tx-date-cell">${formattedDate}</td>
          <td class="tx-title-cell">
            <div class="tx-title-main">${window.MoneyMate.UI.escapeHTML(t.title)}</div>
            ${t.notes ? `<div class="tx-notes-sub">${window.MoneyMate.UI.escapeHTML(t.notes)}</div>` : ''}
          </td>
          <td>
            <span class="badge badge-category" style="background-color: ${catColor}18; color: ${catColor}; border: 1px solid ${catColor}44;">
              ${window.MoneyMate.UI.escapeHTML(t.category)}
            </span>
          </td>
          <td><span class="badge badge-payment">${t.paymentMethod}</span></td>
          <td class="text-right">
            <span class="tx-amount-val ${amountClass}">${amountPrefix}${window.MoneyMate.UI.formatCurrency(t.amount)}</span>
          </td>
          <td class="text-right tx-actions-cell">
            <button class="btn-icon btn-edit-tx" data-id="${t.id}" title="Edit transaction">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon btn-icon-danger btn-delete-tx" data-id="${t.id}" title="Delete transaction">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    },

    /* ==========================================================================
       3. BUDGETS VIEW RENDERER
       ========================================================================== */
    renderBudgets() {
      const report = window.MoneyMate.Budgets.getBudgetReport();

      const overallCard = document.getElementById('overall-budget-summary');
      if (overallCard) {
        const ov = report.overall;
        let statusBadge = '<span class="status-pill status-normal">On Track</span>';
        if (ov.status === 'danger') statusBadge = '<span class="status-pill status-danger">Exceeded</span>';
        else if (ov.status === 'warning') statusBadge = '<span class="status-pill status-warning">Near Limit (80%+)</span>';

        const barColor = ov.status === 'danger' ? 'var(--color-danger)' : (ov.status === 'warning' ? 'var(--color-warning)' : 'var(--color-income)');

        overallCard.innerHTML = `
          <div class="budget-card-header">
            <div>
              <span class="budget-card-title">Overall Monthly Budget</span>
              <span class="budget-month-tag">October 2026</span>
            </div>
            ${statusBadge}
          </div>
          <div class="budget-card-numbers">
            <div class="budget-stat">
              <span class="stat-label">Spent</span>
              <span class="stat-val ${ov.status === 'danger' ? 'text-danger' : ''}">${window.MoneyMate.UI.formatCurrency(ov.spent)}</span>
            </div>
            <div class="budget-stat">
              <span class="stat-label">Budget Limit</span>
              <span class="stat-val">${window.MoneyMate.UI.formatCurrency(ov.limit)}</span>
            </div>
            <div class="budget-stat">
              <span class="stat-label">${ov.remaining >= 0 ? 'Remaining' : 'Over Limit'}</span>
              <span class="stat-val ${ov.remaining < 0 ? 'text-danger' : 'text-success'}">
                ${window.MoneyMate.UI.formatCurrency(Math.abs(ov.remaining))}
              </span>
            </div>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min(100, ov.percent)}%; background-color: ${barColor};"></div>
          </div>
          <div class="progress-bar-footer">
            <span>${ov.percent}% utilized</span>
            <span>Target: ${window.MoneyMate.UI.formatCurrency(ov.limit)}</span>
          </div>
        `;
      }

      const alertsContainer = document.getElementById('budget-alerts-container');
      if (alertsContainer) {
        if (report.alerts.length === 0) {
          alertsContainer.innerHTML = '';
        } else {
          alertsContainer.innerHTML = report.alerts.map(a => `
            <div class="alert-banner alert-${a.level} animate-fade-in">
              <div class="alert-icon">⚠️</div>
              <div class="alert-text">${window.MoneyMate.UI.escapeHTML(a.message)}</div>
            </div>
          `).join('');
        }
      }

      const gridContainer = document.getElementById('category-budgets-grid');
      if (gridContainer) {
        gridContainer.innerHTML = report.categories.map(cat => {
          const barColor = cat.status === 'danger'
            ? 'var(--color-danger)'
            : (cat.status === 'warning' ? 'var(--color-warning)' : 'var(--color-income)');

          let statusBadge = '<span class="status-pill status-normal">Safe</span>';
          if (cat.status === 'danger') statusBadge = '<span class="status-pill status-danger">Exceeded</span>';
          else if (cat.status === 'warning') statusBadge = '<span class="status-pill status-warning">Warning 80%+</span>';
          else if (!cat.hasBudget) statusBadge = '<span class="status-pill status-muted">No Limit Set</span>';

          return `
            <div class="category-budget-card">
              <div class="cat-budget-header">
                <div class="cat-name-group">
                  <span class="color-dot" style="background-color: ${cat.color};"></span>
                  <span class="cat-name">${window.MoneyMate.UI.escapeHTML(cat.category)}</span>
                </div>
                ${statusBadge}
              </div>
              <div class="cat-budget-amounts">
                <span class="spent-val">${window.MoneyMate.UI.formatCurrency(cat.spent)}</span>
                <span class="limit-val">/ ${cat.hasBudget ? window.MoneyMate.UI.formatCurrency(cat.limit) : 'Uncapped'}</span>
              </div>
              ${cat.hasBudget ? `
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${Math.min(100, cat.percent)}%; background-color: ${barColor};"></div>
                </div>
                <div class="progress-bar-footer">
                  <span>${cat.percent}% spent</span>
                  <span>${cat.remaining >= 0 ? window.MoneyMate.UI.formatCurrency(cat.remaining) + ' left' : 'Over by ' + window.MoneyMate.UI.formatCurrency(Math.abs(cat.remaining))}</span>
                </div>
              ` : `
                <div class="uncapped-note">Tracked automatically from transactions.</div>
              `}
            </div>
          `;
        }).join('');
      }
    },

    /* ==========================================================================
       4. SAVINGS GOALS VIEW RENDERER
       ========================================================================== */
    renderGoals() {
      const container = document.getElementById('savings-goals-grid');
      if (!container) return;

      const goals = window.MoneyMate.Goals.getAll();

      if (goals.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card col-span-full">
            <div class="empty-icon">🎯</div>
            <h3>No savings goals yet</h3>
            <p>Define a target for a laptop, trip, or emergency cushion to track progress.</p>
            <button class="btn btn-primary" data-open-modal="modal-goal">+ Create First Goal</button>
          </div>
        `;
        return;
      }

      container.innerHTML = goals.map(g => {
        const metrics = window.MoneyMate.Goals.getGoalMetrics(g);
        const formattedDeadline = new Date(g.deadline + 'T00:00:00')
          .toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="goal-card" style="border-top: 4px solid ${g.color || '#4F46E5'};">
            <div class="goal-header">
              <div>
                <h4 class="goal-title">${window.MoneyMate.UI.escapeHTML(g.name)}</h4>
                <span class="goal-deadline-text">Target: ${formattedDeadline}</span>
              </div>
              <div class="goal-badge">${metrics.progressPercent}%</div>
            </div>

            <div class="goal-numbers">
              <div>
                <span class="goal-num-label">Current Saved</span>
                <span class="goal-current-val">${window.MoneyMate.UI.formatCurrency(metrics.currentAmount)}</span>
              </div>
              <div class="text-right">
                <span class="goal-num-label">Goal Target</span>
                <span class="goal-target-val">${window.MoneyMate.UI.formatCurrency(metrics.targetAmount)}</span>
              </div>
            </div>

            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${metrics.progressPercent}%; background-color: ${g.color || '#4F46E5'};"></div>
            </div>

            <div class="goal-insight-box">
              <div class="insight-metric-label">Required Monthly Savings</div>
              <div class="insight-metric-value">
                ${metrics.isCompleted ? '🎉 Goal Achieved!' : `${window.MoneyMate.UI.formatCurrency(metrics.monthlyNeeded)} / month`}
              </div>
              <div class="insight-status-sub">${metrics.statusText}</div>
            </div>

            <div class="goal-card-actions">
              <button class="btn btn-sm btn-primary btn-add-funds" data-goal-id="${g.id}">
                + Add Funds
              </button>
              <button class="btn-icon btn-edit-goal" data-goal-id="${g.id}" title="Edit goal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon btn-icon-danger btn-delete-goal" data-goal-id="${g.id}" title="Delete goal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    /* ==========================================================================
       5. RECURRING EXPENSES VIEW RENDERER
       ========================================================================== */
    renderRecurring() {
      const container = document.getElementById('recurring-list-table-body');
      if (!container) return;

      const list = window.MoneyMate.Recurring.getAll();

      if (list.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-6">
              <div class="empty-state-mini">
                <p>No recurring subscriptions or scheduled bills configured.</p>
                <button class="btn btn-sm btn-primary" data-open-modal="modal-recurring">+ Add Recurring Item</button>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = list.map(item => {
        const catColor = window.MoneyMate.Categories.getColor(item.category);
        const nextDueFormatted = item.nextDueDate
          ? new Date(item.nextDueDate + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Pending';

        return `
          <tr class="recurring-row">
            <td>
              <div class="font-semibold">${window.MoneyMate.UI.escapeHTML(item.title)}</div>
              <div class="text-xs text-muted">Started: ${item.startDate}</div>
            </td>
            <td>
              <span class="badge badge-category" style="background-color: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}40;">
                ${window.MoneyMate.UI.escapeHTML(item.category)}
              </span>
            </td>
            <td><span class="badge badge-frequency">${item.frequency}</span></td>
            <td><strong>${window.MoneyMate.UI.formatCurrency(item.amount)}</strong></td>
            <td>
              <div class="next-due-cell">
                <span>${nextDueFormatted}</span>
                <span class="text-xs text-muted">${item.paymentMethod}</span>
              </div>
            </td>
            <td class="text-right">
              <label class="switch-toggle" title="Toggle active status">
                <input type="checkbox" class="toggle-recurring-active" data-id="${item.id}" ${item.active ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <button class="btn-icon btn-icon-danger btn-delete-recurring ml-2" data-id="${item.id}" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    },

    /* ==========================================================================
       6. REPORTS & EXPORT VIEW RENDERER
       ========================================================================== */
    renderReports() {
      const stats = window.MoneyMate.Expenses.getMonthStats();

      const repIncome = document.getElementById('report-total-income');
      const repExpense = document.getElementById('report-total-expense');
      const repSavings = document.getElementById('report-net-savings');
      const repRate = document.getElementById('report-savings-rate');

      if (repIncome) repIncome.textContent = window.MoneyMate.UI.formatCurrency(stats.totalIncome);
      if (repExpense) repExpense.textContent = window.MoneyMate.UI.formatCurrency(stats.totalExpense);
      if (repSavings) repSavings.textContent = window.MoneyMate.UI.formatCurrency(stats.netBalance);

      if (repRate) {
        const rate = stats.totalIncome > 0
          ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100)
          : 0;
        repRate.textContent = `${rate}%`;
      }

      const catTableBody = document.getElementById('report-category-breakdown-body');
      if (catTableBody) {
        const categories = window.MoneyMate.Categories.getAll();
        const entries = Object.entries(stats.categorySpend).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
          catTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No expenses recorded for this month.</td></tr>`;
        } else {
          catTableBody.innerHTML = entries.map(([catName, amount]) => {
            const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
            const color = cat ? cat.color : '#64748B';
            const pct = stats.totalExpense > 0 ? Math.round((amount / stats.totalExpense) * 100) : 0;

            return `
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="color-dot" style="background-color: ${color};"></span>
                    <strong>${window.MoneyMate.UI.escapeHTML(catName)}</strong>
                  </div>
                </td>
                <td>${window.MoneyMate.UI.formatCurrency(amount)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="progress-bar-bg" style="height: 6px; width: 80px;">
                      <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
                    </div>
                    <span>${pct}%</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      const payContainer = document.getElementById('report-payment-methods-breakdown');
      if (payContainer) {
        const total = stats.paymentSpend.Cash + stats.paymentSpend.UPI + stats.paymentSpend.Card;
        const methods = [
          { name: 'UPI', amount: stats.paymentSpend.UPI, color: '#6366F1' },
          { name: 'Card', amount: stats.paymentSpend.Card, color: '#0EA5E9' },
          { name: 'Cash', amount: stats.paymentSpend.Cash, color: '#10B981' }
        ];

        payContainer.innerHTML = methods.map(m => {
          const pct = total > 0 ? Math.round((m.amount / total) * 100) : 0;
          return `
            <div class="payment-method-stat-card">
              <div class="flex justify-between items-center mb-1">
                <span class="font-semibold">${m.name}</span>
                <span class="text-muted text-sm">${pct}%</span>
              </div>
              <div class="text-lg font-bold mb-2">${window.MoneyMate.UI.formatCurrency(m.amount)}</div>
              <div class="progress-bar-bg" style="height: 6px;">
                <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${m.color};"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    },

    /* ==========================================================================
       FORM BINDINGS & CRUD ACTIONS
       ========================================================================== */
    bindForms() {
      const txForm = document.getElementById('form-transaction');
      if (txForm) {
        txForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleTransactionSubmit();
        });
      }

      document.querySelectorAll('.type-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.type-tab-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          const typeVal = e.currentTarget.dataset.type;
          document.getElementById('tx-type').value = typeVal;

          const catGroup = document.getElementById('tx-category-group');
          if (catGroup) {
            catGroup.style.display = typeVal === 'income' ? 'none' : 'block';
          }
        });
      });

      const catForm = document.getElementById('form-custom-category');
      if (catForm) {
        catForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('cat-name');
          const colorInput = document.getElementById('cat-color');
          try {
            const newCat = window.MoneyMate.Categories.add({
              name: nameInput.value,
              color: colorInput.value
            });
            window.MoneyMate.UI.showToast(`Category "${newCat.name}" created!`, 'success');
            window.MoneyMate.UI.closeModal('modal-custom-category');
            nameInput.value = '';
            this.populateCategorySelects();
            this.renderAll();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      const budgetForm = document.getElementById('form-budget');
      if (budgetForm) {
        budgetForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const overallInput = document.getElementById('budget-overall-input');
          try {
            window.MoneyMate.Budgets.setOverallBudget(overallInput.value);
            window.MoneyMate.UI.showToast('Overall monthly budget updated!', 'success');
            window.MoneyMate.UI.closeModal('modal-budget');
            this.renderBudgets();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      const goalForm = document.getElementById('form-goal');
      if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('goal-name').value;
          const target = document.getElementById('goal-target').value;
          const initial = document.getElementById('goal-initial').value;
          const deadline = document.getElementById('goal-deadline').value;
          const color = document.getElementById('goal-color').value;

          try {
            if (this.activeEditingGoalId) {
              window.MoneyMate.Goals.update(this.activeEditingGoalId, {
                name,
                targetAmount: target,
                deadline,
                color
              });
              window.MoneyMate.UI.showToast('Savings goal updated!', 'success');
            } else {
              window.MoneyMate.Goals.add({
                name,
                targetAmount: target,
                currentAmount: initial,
                deadline,
                color
              });
              window.MoneyMate.UI.showToast('New savings goal created!', 'success');
            }
            window.MoneyMate.UI.closeModal('modal-goal');
            goalForm.reset();
            this.activeEditingGoalId = null;
            this.renderGoals();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      const fundForm = document.getElementById('form-goal-contribution');
      if (fundForm) {
        fundForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const amt = document.getElementById('contrib-amount').value;
          const notes = document.getElementById('contrib-notes').value;
          const date = document.getElementById('contrib-date').value || new Date().toISOString().split('T')[0];

          try {
            window.MoneyMate.Goals.addContribution(this.activeContributingGoalId, {
              amount: amt,
              notes,
              date
            });
            window.MoneyMate.UI.showToast('Deposit successfully added to goal!', 'success');
            window.MoneyMate.UI.closeModal('modal-goal-contribution');
            fundForm.reset();
            this.activeContributingGoalId = null;
            this.renderGoals();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      const recForm = document.getElementById('form-recurring');
      if (recForm) {
        recForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = document.getElementById('rec-title').value;
          const amount = document.getElementById('rec-amount').value;
          const category = document.getElementById('rec-category').value;
          const method = document.getElementById('rec-method').value;
          const frequency = document.getElementById('rec-frequency').value;
          const startDate = document.getElementById('rec-start-date').value;

          try {
            window.MoneyMate.Recurring.add({
              title,
              amount,
              category,
              paymentMethod: method,
              frequency,
              startDate
            });
            window.MoneyMate.UI.showToast('Recurring expense registered!', 'success');
            window.MoneyMate.UI.closeModal('modal-recurring');
            recForm.reset();
            this.renderRecurring();
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      this.bindDelegatedActions();
    },

    bindDelegatedActions() {
      document.addEventListener('click', (e) => {
        const editTxBtn = e.target.closest('.btn-edit-tx');
        if (editTxBtn) {
          const id = editTxBtn.dataset.id;
          this.openEditTransaction(id);
          return;
        }

        const deleteTxBtn = e.target.closest('.btn-delete-tx');
        if (deleteTxBtn) {
          const id = deleteTxBtn.dataset.id;
          const tx = window.MoneyMate.Expenses.getById(id);
          if (tx) {
            window.MoneyMate.UI.confirmAction({
              title: 'Delete Transaction?',
              message: `Are you sure you want to delete "${tx.title}" (${window.MoneyMate.UI.formatCurrency(tx.amount)})?`,
              danger: true,
              onConfirm: () => {
                window.MoneyMate.Expenses.delete(id);
                window.MoneyMate.UI.showToast('Transaction deleted', 'info');
                this.renderAll();
              }
            });
          }
          return;
        }

        const addFundsBtn = e.target.closest('.btn-add-funds');
        if (addFundsBtn) {
          const goalId = addFundsBtn.dataset.goalId;
          this.openAddFundsModal(goalId);
          return;
        }

        const editGoalBtn = e.target.closest('.btn-edit-goal');
        if (editGoalBtn) {
          const goalId = editGoalBtn.dataset.goalId;
          this.openEditGoal(goalId);
          return;
        }

        const deleteGoalBtn = e.target.closest('.btn-delete-goal');
        if (deleteGoalBtn) {
          const goalId = deleteGoalBtn.dataset.goalId;
          const g = window.MoneyMate.Goals.getById(goalId);
          if (g) {
            window.MoneyMate.UI.confirmAction({
              title: 'Delete Savings Goal?',
              message: `Are you sure you want to delete "${g.name}"? Progress will be erased.`,
              danger: true,
              onConfirm: () => {
                window.MoneyMate.Goals.delete(goalId);
                window.MoneyMate.UI.showToast('Goal removed', 'info');
                this.renderGoals();
              }
            });
          }
          return;
        }

        const toggleRec = e.target.closest('.toggle-recurring-active');
        if (toggleRec) {
          const id = toggleRec.dataset.id;
          const item = window.MoneyMate.Recurring.toggleActive(id);
          window.MoneyMate.UI.showToast(
            `${item.title} is now ${item.active ? 'active' : 'paused'}`,
            'info'
          );
          return;
        }

        const deleteRecBtn = e.target.closest('.btn-delete-recurring');
        if (deleteRecBtn) {
          const id = deleteRecBtn.dataset.id;
          const item = window.MoneyMate.Recurring.getById(id);
          if (item) {
            window.MoneyMate.UI.confirmAction({
              title: 'Delete Recurring Rule?',
              message: `Remove "${item.title}"? It will no longer be auto-scheduled.`,
              danger: true,
              onConfirm: () => {
                window.MoneyMate.Recurring.delete(id);
                window.MoneyMate.UI.showToast('Recurring item deleted', 'info');
                this.renderRecurring();
              }
            });
          }
          return;
        }

        if (e.target.closest('#btn-open-budget-modal')) {
          const currentBudgets = window.MoneyMate.Budgets.getBudgets();
          document.getElementById('budget-overall-input').value = currentBudgets.overall || 25000;
          window.MoneyMate.UI.openModal('modal-budget');
        }
      });
    },

    /* ==========================================================================
       TRANSACTION MODAL HANDLERS
       ========================================================================== */
    resetTransactionForm() {
      this.activeEditingTxId = null;
      const form = document.getElementById('form-transaction');
      if (form) form.reset();

      document.getElementById('tx-modal-title').textContent = 'Add Transaction';
      document.getElementById('tx-submit-btn').textContent = 'Save Transaction';
      document.getElementById('tx-type').value = 'expense';

      document.querySelectorAll('.type-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === 'expense');
      });

      const catGroup = document.getElementById('tx-category-group');
      if (catGroup) catGroup.style.display = 'block';

      const dateInput = document.getElementById('tx-date');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    },

    openEditTransaction(id) {
      const tx = window.MoneyMate.Expenses.getById(id);
      if (!tx) return;

      this.activeEditingTxId = id;
      document.getElementById('tx-modal-title').textContent = 'Edit Transaction';
      document.getElementById('tx-submit-btn').textContent = 'Update Transaction';

      document.getElementById('tx-type').value = tx.type;
      document.getElementById('tx-title').value = tx.title;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-category').value = tx.category;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-payment-method').value = tx.paymentMethod;
      document.getElementById('tx-notes').value = tx.notes || '';

      document.querySelectorAll('.type-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === tx.type);
      });

      const catGroup = document.getElementById('tx-category-group');
      if (catGroup) {
        catGroup.style.display = tx.type === 'income' ? 'none' : 'block';
      }

      window.MoneyMate.UI.openModal('modal-transaction');
    },

    handleTransactionSubmit() {
      const type = document.getElementById('tx-type').value;
      const title = document.getElementById('tx-title').value;
      const amount = document.getElementById('tx-amount').value;
      const category = type === 'income' ? 'Income' : document.getElementById('tx-category').value;
      const date = document.getElementById('tx-date').value;
      const paymentMethod = document.getElementById('tx-payment-method').value;
      const notes = document.getElementById('tx-notes').value;

      try {
        if (this.activeEditingTxId) {
          window.MoneyMate.Expenses.update(this.activeEditingTxId, {
            type,
            title,
            amount,
            category,
            date,
            paymentMethod,
            notes
          });
          window.MoneyMate.UI.showToast('Transaction updated successfully!', 'success');
        } else {
          window.MoneyMate.Expenses.add({
            type,
            title,
            amount,
            category,
            date,
            paymentMethod,
            notes
          });
          window.MoneyMate.UI.showToast('New transaction added!', 'success');
        }

        window.MoneyMate.UI.closeModal('modal-transaction');
        this.resetTransactionForm();
        this.renderAll();
      } catch (err) {
        window.MoneyMate.UI.showToast(err.message, 'danger');
      }
    },

    openAddFundsModal(goalId) {
      this.activeContributingGoalId = goalId;
      const goal = window.MoneyMate.Goals.getById(goalId);
      if (!goal) return;

      document.getElementById('contrib-goal-name-header').textContent = `Deposit into: ${goal.name}`;
      document.getElementById('contrib-date').value = new Date().toISOString().split('T')[0];
      window.MoneyMate.UI.openModal('modal-goal-contribution');
    },

    openEditGoal(goalId) {
      const goal = window.MoneyMate.Goals.getById(goalId);
      if (!goal) return;

      this.activeEditingGoalId = goalId;
      document.getElementById('goal-modal-title').textContent = 'Edit Savings Goal';
      document.getElementById('goal-name').value = goal.name;
      document.getElementById('goal-target').value = goal.targetAmount;
      document.getElementById('goal-initial-group').style.display = 'none';
      document.getElementById('goal-deadline').value = goal.deadline;
      document.getElementById('goal-color').value = goal.color || '#4F46E5';

      window.MoneyMate.UI.openModal('modal-goal');
    },

    /* ==========================================================================
       TRANSACTION FILTERS & SEARCH
       ========================================================================== */
    bindTransactionFilters() {
      const searchInput = document.getElementById('filter-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.transactionFilters.search = e.target.value;
          this.renderTransactions();
        });
      }

      document.querySelectorAll('.filter-type-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.filter-type-pill').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.transactionFilters.type = e.currentTarget.dataset.type;
          this.renderTransactions();
        });
      });

      const catSelect = document.getElementById('filter-category');
      if (catSelect) {
        catSelect.addEventListener('change', (e) => {
          this.transactionFilters.category = e.target.value;
          this.renderTransactions();
        });
      }

      const paySelect = document.getElementById('filter-payment');
      if (paySelect) {
        paySelect.addEventListener('change', (e) => {
          this.transactionFilters.paymentMethod = e.target.value;
          this.renderTransactions();
        });
      }

      const presetSelect = document.getElementById('filter-date-preset');
      const startInput = document.getElementById('filter-date-start');
      const endInput = document.getElementById('filter-date-end');

      if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];

          if (val === 'all') {
            this.transactionFilters.startDate = '';
            this.transactionFilters.endDate = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
          } else if (val === 'this_month') {
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            this.transactionFilters.startDate = `${y}-${m}-01`;
            this.transactionFilters.endDate = todayStr;
            if (startInput) startInput.value = this.transactionFilters.startDate;
            if (endInput) endInput.value = this.transactionFilters.endDate;
          } else if (val === 'last_month') {
            const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const py = prev.getFullYear();
            const pm = String(prev.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(py, prev.getMonth() + 1, 0).getDate();
            this.transactionFilters.startDate = `${py}-${pm}-01`;
            this.transactionFilters.endDate = `${py}-${pm}-${lastDay}`;
            if (startInput) startInput.value = this.transactionFilters.startDate;
            if (endInput) endInput.value = this.transactionFilters.endDate;
          } else if (val === 'last_30_days') {
            const past30 = new Date();
            past30.setDate(past30.getDate() - 30);
            this.transactionFilters.startDate = past30.toISOString().split('T')[0];
            this.transactionFilters.endDate = todayStr;
            if (startInput) startInput.value = this.transactionFilters.startDate;
            if (endInput) endInput.value = this.transactionFilters.endDate;
          }
          this.renderTransactions();
        });
      }

      if (startInput) {
        startInput.addEventListener('change', (e) => {
          this.transactionFilters.startDate = e.target.value;
          if (presetSelect) presetSelect.value = 'custom';
          this.renderTransactions();
        });
      }

      if (endInput) {
        endInput.addEventListener('change', (e) => {
          this.transactionFilters.endDate = e.target.value;
          if (presetSelect) presetSelect.value = 'custom';
          this.renderTransactions();
        });
      }

      const sortSelect = document.getElementById('filter-sort-by');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.transactionFilters.sortBy = e.target.value;
          this.renderTransactions();
        });
      }

      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.resetFilters());
      }

      const exportBtn = document.getElementById('btn-export-csv');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const listToExport = window.MoneyMate.Expenses.filterAndSort(this.transactionFilters);
          try {
            window.MoneyMate.Expenses.exportToCSV(listToExport, 'moneymate_export.csv');
            window.MoneyMate.UI.showToast(`Exported ${listToExport.length} transactions to CSV`, 'success');
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }

      const reportExportBtn = document.getElementById('btn-report-export-csv');
      if (reportExportBtn) {
        reportExportBtn.addEventListener('click', () => {
          const stats = window.MoneyMate.Expenses.getMonthStats();
          try {
            window.MoneyMate.Expenses.exportToCSV(stats.transactions, `moneymate_report_${stats.month}.csv`);
            window.MoneyMate.UI.showToast(`Exported monthly statement to CSV`, 'success');
          } catch (err) {
            window.MoneyMate.UI.showToast(err.message, 'danger');
          }
        });
      }
    },

    resetFilters() {
      this.transactionFilters = {
        search: '',
        type: 'all',
        category: 'all',
        paymentMethod: 'all',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        sortBy: 'date-desc'
      };

      const searchInput = document.getElementById('filter-search');
      if (searchInput) searchInput.value = '';

      const catSelect = document.getElementById('filter-category');
      if (catSelect) catSelect.value = 'all';

      const paySelect = document.getElementById('filter-payment');
      if (paySelect) paySelect.value = 'all';

      const presetSelect = document.getElementById('filter-date-preset');
      if (presetSelect) presetSelect.value = 'all';

      const startInput = document.getElementById('filter-date-start');
      if (startInput) startInput.value = '';

      const endInput = document.getElementById('filter-date-end');
      if (endInput) endInput.value = '';

      const sortSelect = document.getElementById('filter-sort-by');
      if (sortSelect) sortSelect.value = 'date-desc';

      document.querySelectorAll('.filter-type-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.type === 'all');
      });

      this.renderTransactions();
      window.MoneyMate.UI.showToast('Filters reset', 'info');
    },

    bindDemoControls() {
      const resetDemoBtn = document.getElementById('btn-reset-demo-data');
      if (resetDemoBtn) {
        resetDemoBtn.addEventListener('click', () => {
          window.MoneyMate.UI.confirmAction({
            title: 'Reset to Sample Data?',
            message: 'This will replace all current data with the realistic student sample dataset. Are you sure?',
            danger: true,
            confirmText: 'Reset Data',
            onConfirm: () => {
              window.MoneyMate.Storage.resetToDemoData();
              this.renderAll();
              window.MoneyMate.UI.showToast('Sample dataset restored successfully!', 'success');
            }
          });
        });
      }

      const fabBtn = document.getElementById('fab-add-transaction');
      if (fabBtn) {
        fabBtn.addEventListener('click', () => {
          this.resetTransactionForm();
          window.MoneyMate.UI.openModal('modal-transaction');
        });
      }
    }
  };

  window.MoneyMate.App = App;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
