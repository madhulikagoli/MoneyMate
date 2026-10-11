/**
 * MoneyMate - UI Controller Module
 * Handles themes, currency formatting, toast notifications, modals, tab navigation, and auth UI state.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const CURRENCY_MAP = {
    INR: { symbol: '₹', name: 'Indian Rupee' },
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' }
  };

  const UI = {
    currentTab: 'dashboard',
    activeModal: null,

    init() {
      this.initTheme();
      this.initCurrency();
      this.bindGlobalEvents();
      this.initRouting();
      this.checkAuthState();
    },

    initRouting() {
      const hashTab = window.location.hash ? window.location.hash.replace('#', '') : '';
      if (hashTab && document.getElementById(`view-${hashTab}`)) {
        this.switchTab(hashTab);
      }
      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (h && document.getElementById(`view-${h}`) && h !== this.currentTab) {
          this.switchTab(h);
        }
      });
    },

    /* ==========================================================================
       AUTHENTICATION UI STATE
       ========================================================================== */
    checkAuthState() {
      const currentUser = window.MoneyMate.Auth.getCurrentUser();
      const authOverlay = document.getElementById('auth-overlay');
      const appContainer = document.querySelector('.app-container');

      if (!currentUser) {
        if (authOverlay) authOverlay.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('auth-locked');
      } else {
        if (authOverlay) authOverlay.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('auth-locked');
        this.updateUserHeader(currentUser);
      }
    },

    updateUserHeader(user) {
      if (!user) return;
      const nameElem = document.getElementById('header-user-name');
      const avatarElem = document.getElementById('header-user-avatar');
      const greetingElem = document.getElementById('dashboard-user-greeting');
      const sidebarName = document.getElementById('sidebar-user-name');
      const sidebarEmail = document.getElementById('sidebar-user-email');

      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';

      if (nameElem) nameElem.textContent = user.name;
      if (avatarElem) avatarElem.textContent = initials;
      if (greetingElem) greetingElem.textContent = `Welcome back, ${user.name}!`;
      if (sidebarName) sidebarName.textContent = user.name;
      if (sidebarEmail) sidebarEmail.textContent = user.email;
    },

    /* ==========================================================================
       THEME MANAGEMENT
       ========================================================================== */
    initTheme() {
      const settings = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.SETTINGS) || {};
      const savedTheme = settings.theme || 'light';
      this.setTheme(savedTheme);
    },

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const settings = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.SETTINGS) || {};
      settings.theme = theme;
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.SETTINGS, settings);

      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      }

      if (window.MoneyMate.Charts) {
        window.MoneyMate.Charts.refreshTheme();
      }
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      this.showToast(`Switched to ${next} mode`, 'info');
    },

    /* ==========================================================================
       CURRENCY FORMATTING
       ========================================================================== */
    getCurrency() {
      const settings = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.SETTINGS) || {};
      return settings.currency || 'INR';
    },

    getCurrencySymbol() {
      const code = this.getCurrency();
      return (CURRENCY_MAP[code] && CURRENCY_MAP[code].symbol) || '₹';
    },

    setCurrency(code) {
      if (!CURRENCY_MAP[code]) return;
      const settings = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.SETTINGS) || {};
      settings.currency = code;
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.SETTINGS, settings);

      if (window.MoneyMate.App) {
        window.MoneyMate.App.renderAll();
      }
      this.showToast(`Currency changed to ${CURRENCY_MAP[code].name} (${CURRENCY_MAP[code].symbol})`, 'success');
    },

    initCurrency() {
      const currencySelect = document.getElementById('global-currency-select');
      if (currencySelect) {
        currencySelect.value = this.getCurrency();
        currencySelect.addEventListener('change', (e) => {
          this.setCurrency(e.target.value);
        });
      }
    },

    formatCurrency(amount, showDecimals = false) {
      const num = parseFloat(amount) || 0;
      const symbol = this.getCurrencySymbol();
      const formatted = num.toLocaleString('en-IN', {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: 2
      });
      return `${symbol}${formatted}`;
    },

    /* ==========================================================================
       TOAST NOTIFICATIONS
       ========================================================================== */
    showToast(message, type = 'info', duration = 3500) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type} animate-slide-in`;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      } else if (type === 'danger' || type === 'error') {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      } else if (type === 'warning') {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }

      toast.innerHTML = `
        <div class="toast-content">
          ${iconSvg}
          <span class="toast-message">${this.escapeHTML(message)}</span>
        </div>
        <button class="toast-close" aria-label="Dismiss">&times;</button>
      `;

      const removeToast = () => {
        toast.classList.remove('animate-slide-in');
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 250);
      };

      toast.querySelector('.toast-close').addEventListener('click', removeToast);
      container.appendChild(toast);

      setTimeout(() => {
        if (toast.parentElement) removeToast();
      }, duration);
    },

    /* ==========================================================================
       MODAL SYSTEM
       ========================================================================== */
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.classList.add('active');
      document.body.classList.add('modal-open');
      this.activeModal = modal;

      setTimeout(() => {
        const input = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (input) input.focus();
      }, 50);
    },

    closeModal(modalId) {
      const modal = modalId ? document.getElementById(modalId) : this.activeModal;
      if (!modal) return;

      modal.classList.remove('active');
      const anyActive = document.querySelector('.modal-backdrop.active');
      if (!anyActive) {
        document.body.classList.remove('modal-open');
        this.activeModal = null;
      }
    },

    confirmAction({ title, message, confirmText = 'Delete', danger = true, onConfirm }) {
      const modal = document.getElementById('modal-confirm');
      if (!modal) {
        if (confirm(`${title}\n${message}`)) {
          onConfirm();
        }
        return;
      }

      document.getElementById('confirm-modal-title').textContent = title;
      document.getElementById('confirm-modal-message').textContent = message;

      const confirmBtn = document.getElementById('confirm-modal-action-btn');
      confirmBtn.textContent = confirmText;
      confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';

      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

      newConfirmBtn.addEventListener('click', () => {
        this.closeModal('modal-confirm');
        onConfirm();
      });

      this.openModal('modal-confirm');
    },

    /* ==========================================================================
       TAB / NAVIGATION SYSTEM
       ========================================================================== */
    switchTab(tabName) {
      this.currentTab = tabName;

      document.querySelectorAll('.app-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${tabName}`);
      });

      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabName);
      });

      document.querySelectorAll('.bottom-nav .nav-item').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabName);
      });

      const mainContainer = document.querySelector('.main-content');
      if (mainContainer) mainContainer.scrollTop = 0;

      if (window.MoneyMate.App) {
        window.MoneyMate.App.renderView(tabName);
      }
    },

    /* ==========================================================================
       GLOBAL EVENT BINDINGS
       ========================================================================== */
    bindGlobalEvents() {
      document.addEventListener('click', (e) => {
        const navBtn = e.target.closest('[data-tab]');
        if (navBtn) {
          e.preventDefault();
          this.switchTab(navBtn.dataset.tab);
        }

        const modalOpenTrigger = e.target.closest('[data-open-modal]');
        if (modalOpenTrigger) {
          e.preventDefault();
          const targetModalId = modalOpenTrigger.dataset.openModal;
          this.openModal(targetModalId);
        }

        const modalCloseTrigger = e.target.closest('[data-close-modal]');
        if (modalCloseTrigger) {
          e.preventDefault();
          const targetModal = modalCloseTrigger.closest('.modal-backdrop');
          if (targetModal) this.closeModal(targetModal.id);
        }

        if (e.target.classList.contains('modal-backdrop')) {
          this.closeModal(e.target.id);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          this.closeModal(this.activeModal.id);
        }
      });

      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => this.toggleTheme());
      }
    },

    escapeHTML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.MoneyMate.UI = UI;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.UI = UI;
})();
