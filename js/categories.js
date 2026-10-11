/**
 * MoneyMate - Categories Module
 * Handles default and custom user categories with colors and icons.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  const Categories = {
    getAll() {
      const stored = window.MoneyMate.Storage.get(window.MoneyMate.Storage.KEYS.CATEGORIES);
      return stored && Array.isArray(stored) ? stored : window.MoneyMate.Storage.DEFAULT_CATEGORIES;
    },

    getByName(name) {
      if (!name) return null;
      const all = this.getAll();
      return all.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
    },

    getById(id) {
      const all = this.getAll();
      return all.find(c => c.id === id) || null;
    },

    getColor(categoryName) {
      const cat = this.getByName(categoryName);
      return cat ? cat.color : '#64748B';
    },

    getIcon(categoryName) {
      const cat = this.getByName(categoryName);
      return cat ? cat.icon : 'tag';
    },

    add(data) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Category name is required.');
      }

      const trimmedName = data.name.trim();
      const existing = this.getByName(trimmedName);
      if (existing) {
        throw new Error(`Category "${trimmedName}" already exists.`);
      }

      const newCategory = {
        id: 'cat_custom_' + Date.now(),
        name: trimmedName,
        icon: data.icon || 'tag',
        color: data.color || '#6366F1',
        isDefault: false,
        createdAt: Date.now()
      };

      const categories = this.getAll();
      categories.push(newCategory);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.CATEGORIES, categories);
      return newCategory;
    },

    delete(id) {
      const categories = this.getAll();
      const target = categories.find(c => c.id === id);

      if (!target) {
        throw new Error('Category not found.');
      }

      if (target.isDefault) {
        throw new Error('Standard system categories cannot be deleted.');
      }

      const filtered = categories.filter(c => c.id !== id);
      window.MoneyMate.Storage.set(window.MoneyMate.Storage.KEYS.CATEGORIES, filtered);

      if (window.MoneyMate.Expenses) {
        window.MoneyMate.Expenses.reassignCategory(target.name, 'Other');
      }

      return true;
    }
  };

  window.MoneyMate.Categories = Categories;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Categories = Categories;
})();
