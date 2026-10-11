/**
 * MoneyMate - Authentication Module
 * Manages user registration, sign in, session persistence, and logout using localStorage.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Auth = {
    /**
     * Gets all registered users from storage
     */
    getUsers() {
      const users = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.USERS);
      return Array.isArray(users) ? users : [];
    },

    /**
     * Gets currently active logged-in user
     */
    getCurrentUser() {
      return window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.CURRENT_USER);
    },

    /**
     * Checks if a user session is active
     */
    isAuthenticated() {
      return !!this.getCurrentUser();
    },

    /**
     * Registers a new user account
     * @param {Object} userData { name, email, password, seedSampleData }
     */
    register({ name, email, password, seedSampleData = true }) {
      if (!name || !name.trim()) {
        throw new Error('Please enter your full name.');
      }
      if (!email || !email.trim()) {
        throw new Error('Please enter a valid email address.');
      }
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address format.');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const users = this.getUsers();
      const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
      if (existing) {
        throw new Error('An account with this email already exists. Please sign in.');
      }

      const newUser = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: trimmedEmail,
        password: password, // In client-side offline app, stored in users table
        createdAt: Date.now()
      };

      users.push(newUser);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.USERS, users);

      // Auto login newly registered user
      this.login(trimmedEmail, password);

      // Seed data if opted
      if (seedSampleData) {
        window.MoneyMate.Storage.init(true);
      }

      return newUser;
    },

    /**
     * Authenticates an existing user
     * @param {string} email
     * @param {string} password
     */
    login(email, password) {
      if (!email || !password) {
        throw new Error('Please provide both email and password.');
      }

      const trimmedEmail = email.trim().toLowerCase();
      const users = this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === trimmedEmail && u.password === password);

      if (!user) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        loggedInAt: Date.now()
      };

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.CURRENT_USER, sessionUser);
      return sessionUser;
    },

    /**
     * One-click demo login for instant testing
     */
    loginDemo() {
      const users = this.getUsers();
      let demoUser = users.find(u => u.email === 'jeevan@moneymate.app');

      if (!demoUser) {
        demoUser = {
          id: 'usr_demo_1',
          name: 'Jeevan Kishore',
          email: 'jeevan@moneymate.app',
          password: 'password123',
          createdAt: Date.now()
        };
        users.push(demoUser);
        window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.USERS, users);
      }

      // Ensure demo data is seeded
      window.MoneyMate.Storage.init(true);

      const sessionUser = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        loggedInAt: Date.now()
      };

      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.CURRENT_USER, sessionUser);
      return sessionUser;
    },

    /**
     * Logs out the active user session
     */
    logout() {
      window.MoneyMate.Storage.remove(window.MoneyMate.Storage.KEYS.CURRENT_USER);
      return true;
    }
  };

  window.MoneyMate.Auth = Auth;
})();
