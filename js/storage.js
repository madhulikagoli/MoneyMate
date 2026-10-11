/**
 * MoneyMate - Storage Module
 * Manages localStorage persistence, defaults, user tables, and realistic seed data.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const STORAGE_KEYS = {
    TRANSACTIONS: 'moneymate_transactions',
    CATEGORIES: 'moneymate_categories',
    BUDGETS: 'moneymate_budgets',
    GOALS: 'moneymate_goals',
    RECURRING: 'moneymate_recurring',
    SETTINGS: 'moneymate_settings',
    USERS: 'moneymate_users',
    CURRENT_USER: 'moneymate_current_user'
  };

  const DEFAULT_CATEGORIES = [
    { id: 'cat_food', name: 'Food', icon: 'utensils', color: '#F97316', isDefault: true },
    { id: 'cat_travel', name: 'Travel', icon: 'bus', color: '#0EA5E9', isDefault: true },
    { id: 'cat_rent', name: 'Rent', icon: 'home', color: '#8B5CF6', isDefault: true },
    { id: 'cat_shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', isDefault: true },
    { id: 'cat_bills', name: 'Bills', icon: 'zap', color: '#EAB308', isDefault: true },
    { id: 'cat_education', name: 'Education', icon: 'book-open', color: '#3B82F6', isDefault: true },
    { id: 'cat_entertainment', name: 'Entertainment', icon: 'film', color: '#A855F7', isDefault: true },
    { id: 'cat_health', name: 'Health', icon: 'heart-pulse', color: '#EF4444', isDefault: true },
    { id: 'cat_other', name: 'Other', icon: 'tag', color: '#64748B', isDefault: true }
  ];

  const DEFAULT_SETTINGS = {
    currency: 'INR',
    theme: 'light',
    hasSeeded: true
  };

  const DEFAULT_USERS = [
    {
      id: 'usr_demo_1',
      name: 'Jeevan Kishore',
      email: 'jeevan@moneymate.app',
      password: 'password123',
      createdAt: 1727740800000
    }
  ];

  function generateSampleTransactions() {
    return [
      // OCTOBER 2026 TRANSACTIONS (Current Month)
      {
        id: 'tx_demo_01',
        type: 'income',
        title: 'Monthly Stipend / Allowance',
        amount: 25000,
        category: 'Other',
        date: '2026-10-01',
        paymentMethod: 'UPI',
        notes: 'Monthly university research fellowship stipend',
        createdAt: 1727740800000
      },
      {
        id: 'tx_demo_02',
        type: 'expense',
        title: 'Apartment Rent (Shared)',
        amount: 11000,
        category: 'Rent',
        date: '2026-10-01',
        paymentMethod: 'UPI',
        notes: 'October monthly room share with roommates',
        createdAt: 1727744400000
      },
      {
        id: 'tx_demo_03',
        type: 'expense',
        title: 'Supermarket Groceries & Essentials',
        amount: 1850,
        category: 'Food',
        date: '2026-10-02',
        paymentMethod: 'Card',
        notes: 'Oats, milk, eggs, fruits, olive oil',
        createdAt: 1727830800000
      },
      {
        id: 'tx_demo_04',
        type: 'expense',
        title: 'Metro Smart Card Recharge',
        amount: 800,
        category: 'Travel',
        date: '2026-10-03',
        paymentMethod: 'UPI',
        notes: 'Monthly metro pass top-up for campus commute',
        createdAt: 1727917200000
      },
      {
        id: 'tx_demo_05',
        type: 'expense',
        title: 'Campus Cafeteria Lunch',
        amount: 240,
        category: 'Food',
        date: '2026-10-04',
        paymentMethod: 'UPI',
        notes: 'Lunch with college study group',
        createdAt: 1728003600000
      },
      {
        id: 'tx_demo_06',
        type: 'expense',
        title: 'High-speed Fiber Wi-Fi Bill',
        amount: 899,
        category: 'Bills',
        date: '2026-10-05',
        paymentMethod: 'Card',
        notes: 'October internet bill (split 50%)',
        createdAt: 1728090000000
      },
      {
        id: 'tx_demo_07',
        type: 'income',
        title: 'Freelance UI Design Project',
        amount: 14500,
        category: 'Other',
        date: '2026-10-06',
        paymentMethod: 'UPI',
        notes: 'Client payment for landing page redesign',
        createdAt: 1728176400000
      },
      {
        id: 'tx_demo_08',
        type: 'expense',
        title: 'Data Structures & Algorithms Book',
        amount: 720,
        category: 'Education',
        date: '2026-10-06',
        paymentMethod: 'Card',
        notes: 'Reference book for semester exam',
        createdAt: 1728180000000
      },
      {
        id: 'tx_demo_09',
        type: 'expense',
        title: 'Weekend Movie & Popcorn',
        amount: 650,
        category: 'Entertainment',
        date: '2026-10-07',
        paymentMethod: 'Card',
        notes: 'Evening IMAX show with friends',
        createdAt: 1728266400000
      },
      {
        id: 'tx_demo_10',
        type: 'expense',
        title: 'College Stationery & Notebooks',
        amount: 320,
        category: 'Education',
        date: '2026-10-08',
        paymentMethod: 'Cash',
        notes: 'Lab manuals, pens and sticky notes',
        createdAt: 1728352800000
      },
      {
        id: 'tx_demo_11',
        type: 'expense',
        title: 'Pharmacy & Multivitamins',
        amount: 540,
        category: 'Health',
        date: '2026-10-09',
        paymentMethod: 'UPI',
        notes: 'Vitamin D & Zinc supplements',
        createdAt: 1728439200000
      },
      {
        id: 'tx_demo_12',
        type: 'expense',
        title: 'Zomato Biryani Delivery',
        amount: 480,
        category: 'Food',
        date: '2026-10-09',
        paymentMethod: 'UPI',
        notes: 'Dinner during late night hackathon prep',
        createdAt: 1728446400000
      },
      {
        id: 'tx_demo_13',
        type: 'expense',
        title: 'New Wireless Mouse & Mousepad',
        amount: 1250,
        category: 'Shopping',
        date: '2026-10-10',
        paymentMethod: 'Card',
        notes: 'Ergonomic mouse for programming setup',
        createdAt: 1728525600000
      },
      {
        id: 'tx_demo_14',
        type: 'expense',
        title: 'Uber Auto Ride to Railway Station',
        amount: 220,
        category: 'Travel',
        date: '2026-10-11',
        paymentMethod: 'UPI',
        notes: 'Trip to pick up books from library depot',
        createdAt: 1728612000000
      },
      {
        id: 'tx_demo_15',
        type: 'expense',
        title: 'Artisan Coffee with Peer',
        amount: 260,
        category: 'Food',
        date: '2026-10-11',
        paymentMethod: 'Cash',
        notes: 'Iced caramel latte discussion',
        createdAt: 1728615600000
      },

      // SEPTEMBER 2026 TRANSACTIONS
      {
        id: 'tx_demo_16',
        type: 'income',
        title: 'Monthly Stipend / Allowance',
        amount: 25000,
        category: 'Other',
        date: '2026-09-01',
        paymentMethod: 'UPI',
        notes: 'September stipend payment',
        createdAt: 1725148800000
      },
      {
        id: 'tx_demo_17',
        type: 'expense',
        title: 'Apartment Rent (Shared)',
        amount: 11000,
        category: 'Rent',
        date: '2026-09-01',
        paymentMethod: 'UPI',
        notes: 'September room rent',
        createdAt: 1725152400000
      },
      {
        id: 'tx_demo_18',
        type: 'expense',
        title: 'Semester Textbooks & Lab Kits',
        amount: 2800,
        category: 'Education',
        date: '2026-09-03',
        paymentMethod: 'Card',
        notes: 'Engineering textbooks and electronics kit',
        createdAt: 1725321600000
      },
      {
        id: 'tx_demo_19',
        type: 'expense',
        title: 'Grocery Store Run',
        amount: 2100,
        category: 'Food',
        date: '2026-09-05',
        paymentMethod: 'UPI',
        notes: 'Monthly staples & snacks',
        createdAt: 1725494400000
      },
      {
        id: 'tx_demo_20',
        type: 'expense',
        title: 'Electricity & Utility Bill',
        amount: 1150,
        category: 'Bills',
        date: '2026-09-10',
        paymentMethod: 'UPI',
        notes: 'Power bill split',
        createdAt: 1725926400000
      },
      {
        id: 'tx_demo_21',
        type: 'income',
        title: 'Tutoring Coding Basics',
        amount: 6000,
        category: 'Other',
        date: '2026-09-15',
        paymentMethod: 'Cash',
        notes: 'Weekend Python coaching classes',
        createdAt: 1726358400000
      },
      {
        id: 'tx_demo_22',
        type: 'expense',
        title: 'Concert & College Fest Ticket',
        amount: 1400,
        category: 'Entertainment',
        date: '2026-09-18',
        paymentMethod: 'Card',
        notes: 'Annual tech fest celebrity night',
        createdAt: 1726617600000
      },
      {
        id: 'tx_demo_23',
        type: 'expense',
        title: 'Gym Membership (Monthly)',
        amount: 1200,
        category: 'Health',
        date: '2026-09-20',
        paymentMethod: 'UPI',
        notes: 'Student fitness center pass',
        createdAt: 1726790400000
      },
      {
        id: 'tx_demo_24',
        type: 'expense',
        title: 'Sneakers Casual Shoes',
        amount: 2499,
        category: 'Shopping',
        date: '2026-09-24',
        paymentMethod: 'Card',
        notes: 'Sale discount on footwear',
        createdAt: 1727136000000
      },
      {
        id: 'tx_demo_25',
        type: 'expense',
        title: 'Train Ticket to Hometown',
        amount: 950,
        category: 'Travel',
        date: '2026-09-28',
        paymentMethod: 'UPI',
        notes: 'Weekend return visit train ticket',
        createdAt: 1727481600000
      },

      // AUGUST 2026 TRANSACTIONS
      {
        id: 'tx_demo_26',
        type: 'income',
        title: 'Monthly Stipend / Allowance',
        amount: 25000,
        category: 'Other',
        date: '2026-08-01',
        paymentMethod: 'UPI',
        notes: 'August stipend',
        createdAt: 1722470400000
      },
      {
        id: 'tx_demo_27',
        type: 'expense',
        title: 'Apartment Rent (Shared)',
        amount: 11000,
        category: 'Rent',
        date: '2026-08-01',
        paymentMethod: 'UPI',
        notes: 'August rent',
        createdAt: 1722474000000
      },
      {
        id: 'tx_demo_28',
        type: 'expense',
        title: 'August Living & Food Expenses',
        amount: 5400,
        category: 'Food',
        date: '2026-08-15',
        paymentMethod: 'UPI',
        notes: 'Dining and cafeteria',
        createdAt: 1723680000000
      },
      {
        id: 'tx_demo_29',
        type: 'expense',
        title: 'Course Fee & Online Certifications',
        amount: 3500,
        category: 'Education',
        date: '2026-08-20',
        paymentMethod: 'Card',
        notes: 'Cloud architect certification voucher',
        createdAt: 1724112000000
      }
    ];
  }

  function generateSampleBudgets() {
    return {
      overall: 26000,
      categories: {
        'Food': 4000,
        'Travel': 1200,
        'Rent': 11000,
        'Shopping': 1000,
        'Bills': 1500,
        'Education': 1500,
        'Entertainment': 1000,
        'Health': 1000
      }
    };
  }

  function generateSampleGoals() {
    return [
      {
        id: 'goal_demo_1',
        name: 'M3 MacBook for Coding & ML',
        targetAmount: 85000,
        currentAmount: 52000,
        deadline: '2027-03-31',
        color: '#4F46E5',
        icon: 'laptop',
        contributions: [
          { id: 'c_1', date: '2026-08-10', amount: 20000, notes: 'Freelance savings deposit' },
          { id: 'c_2', date: '2026-09-12', amount: 18000, notes: 'Part-time tutoring saving' },
          { id: 'c_3', date: '2026-10-06', amount: 14000, notes: 'Design sprint milestone deposit' }
        ]
      },
      {
        id: 'goal_demo_2',
        name: 'Emergency Fund (6 Months Buffer)',
        targetAmount: 40000,
        currentAmount: 26500,
        deadline: '2026-12-31',
        color: '#10B981',
        icon: 'shield-check',
        contributions: [
          { id: 'c_4', date: '2026-07-20', amount: 10000, notes: 'Initial rainy day cushion' },
          { id: 'c_5', date: '2026-08-25', amount: 8500, notes: 'Summer stipend allocation' },
          { id: 'c_6', date: '2026-09-28', amount: 8000, notes: 'Monthly savings contribution' }
        ]
      },
      {
        id: 'goal_demo_3',
        name: 'Goa Tech Conference Trip',
        targetAmount: 12000,
        currentAmount: 4000,
        deadline: '2026-11-25',
        color: '#F59E0B',
        icon: 'plane',
        contributions: [
          { id: 'c_7', date: '2026-10-02', amount: 4000, notes: 'Conference travel fund' }
        ]
      }
    ];
  }

  function generateSampleRecurring() {
    return [
      {
        id: 'rec_demo_1',
        title: 'Apartment Rent (Monthly)',
        amount: 11000,
        type: 'expense',
        category: 'Rent',
        paymentMethod: 'UPI',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: '2026-08-01',
        lastProcessed: '2026-10-01',
        nextDueDate: '2026-11-01',
        active: true
      },
      {
        id: 'rec_demo_2',
        title: 'High-speed Fiber Wi-Fi',
        amount: 899,
        type: 'expense',
        category: 'Bills',
        paymentMethod: 'Card',
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: '2026-08-05',
        lastProcessed: '2026-10-05',
        nextDueDate: '2026-11-05',
        active: true
      },
      {
        id: 'rec_demo_3',
        title: 'Spotify Student Subscription',
        amount: 59,
        type: 'expense',
        category: 'Entertainment',
        paymentMethod: 'Card',
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: '2026-07-15',
        lastProcessed: '2026-09-15',
        nextDueDate: '2026-10-15',
        active: true
      },
      {
        id: 'rec_demo_4',
        title: 'Weekly Grocery Fund',
        amount: 750,
        type: 'expense',
        category: 'Food',
        paymentMethod: 'UPI',
        frequency: 'weekly',
        dayOfWeek: 1,
        startDate: '2026-09-01',
        lastProcessed: '2026-10-05',
        nextDueDate: '2026-10-12',
        active: true
      }
    ];
  }

  const Storage = {
    KEYS: STORAGE_KEYS,
    DEFAULT_CATEGORIES,

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (err) {
        console.error(`Error reading ${key} from localStorage:`, err);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error(`Error saving ${key} to localStorage:`, err);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error(`Error removing ${key} from localStorage:`, err);
      }
    },

    /**
     * Seeds initial data if not already present or if forced.
     */
    init(force = false) {
      // Ensure users exist
      const existingUsers = this.get(STORAGE_KEYS.USERS);
      if (!existingUsers || existingUsers.length === 0) {
        this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
      }

      const settings = this.get(STORAGE_KEYS.SETTINGS);
      if (!settings || force) {
        this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
        this.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        this.set(STORAGE_KEYS.TRANSACTIONS, generateSampleTransactions());
        this.set(STORAGE_KEYS.BUDGETS, generateSampleBudgets());
        this.set(STORAGE_KEYS.GOALS, generateSampleGoals());
        this.set(STORAGE_KEYS.RECURRING, generateSampleRecurring());
        return true;
      }

      if (!this.get(STORAGE_KEYS.CATEGORIES)) {
        this.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      }
      return false;
    },

    resetToDemoData() {
      return this.init(true);
    },

    clearAll() {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    }
  };

  // Provide both MoneyMate and backwards-compatible SpendWise namespaces
  window.MoneyMate.Storage = Storage;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Storage = Storage;
})();
