// Expense & Budget Visualizer Application
// Main JavaScript file containing all application logic

// ===== DATA MODELS =====

/**
 * Category enum for expense classification
 * Requirements: 1.6 - Category options: Food, Transport, Fun
 */
const Category = {
  FOOD: 'Food',
  TRANSPORT: 'Transport',
  FUN: 'Fun'
};

/**
 * Category configuration with display metadata
 * Used for UI rendering and chart visualization
 */
const CATEGORY_CONFIG = {
  [Category.FOOD]: {
    name: 'Food',
    color: '#FF6384',
    icon: 'food-icon'
  },
  [Category.TRANSPORT]: {
    name: 'Transport',
    color: '#36A2EB',
    icon: 'transport-icon'
  },
  [Category.FUN]: {
    name: 'Fun',
    color: '#FFCE56',
    icon: 'fun-icon'
  }
};

/**
 * Validation error messages
 */
const ValidationErrors = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_AMOUNT: 'Amount must be a positive number',
  INVALID_CATEGORY: 'Please select a valid category',
  NAME_TOO_LONG: 'Item name must be 100 characters or less',
  AMOUNT_PRECISION: 'Amount cannot have more than 2 decimal places',
  AMOUNT_TOO_LARGE: 'Amount is too large'
};

/**
 * Transaction class representing a single expense entry
 * Requirements: 1.4 - All fields required for transactions
 * Requirements: 1.5 - Amount must be positive number
 */
class Transaction {
  /**
   * Create a new Transaction
   * @param {string} name - Item/expense description (1-100 characters)
   * @param {number} amount - Expense amount (positive number, max 2 decimal places)
   * @param {string} category - Expense category (must be valid Category enum value)
   * @param {string} [id] - Unique identifier (auto-generated if not provided)
   * @param {number} [timestamp] - Creation timestamp (auto-generated if not provided)
   */
  constructor(name, amount, category, id = null, timestamp = null) {
    this.id = id || this.generateId();
    this.name = name;
    this.amount = amount;
    this.category = category;
    this.timestamp = timestamp || Date.now();
    
    // Validate the transaction data
    this.validate();
  }

  /**
   * Generate a unique identifier for the transaction
   * @returns {string} Unique ID based on timestamp and random number
   */
  generateId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate transaction data
   * @throws {Error} If validation fails
   */
  validate() {
    const errors = [];

    // Validate name
    if (!this.name || typeof this.name !== 'string') {
      errors.push(ValidationErrors.REQUIRED_FIELD + ' (name)');
    } else {
      const trimmedName = this.name.trim();
      if (trimmedName.length === 0) {
        errors.push(ValidationErrors.REQUIRED_FIELD + ' (name)');
      } else if (trimmedName.length > 100) {
        errors.push(ValidationErrors.NAME_TOO_LONG);
      } else {
        this.name = trimmedName; // Store trimmed version
      }
    }

    // Validate amount
    if (this.amount === null || this.amount === undefined || typeof this.amount !== 'number') {
      errors.push(ValidationErrors.REQUIRED_FIELD + ' (amount)');
    } else if (isNaN(this.amount) || this.amount <= 0) {
      errors.push(ValidationErrors.INVALID_AMOUNT);
    } else if (this.amount > 999999999.99) {
      errors.push(ValidationErrors.AMOUNT_TOO_LARGE);
    } else {
      // Check decimal places
      const decimalPlaces = (this.amount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        errors.push(ValidationErrors.AMOUNT_PRECISION);
      } else {
        // Round to 2 decimal places to handle floating point precision
        this.amount = Math.round(this.amount * 100) / 100;
      }
    }

    // Validate category
    if (!this.category || typeof this.category !== 'string') {
      errors.push(ValidationErrors.REQUIRED_FIELD + ' (category)');
    } else if (!Object.values(Category).includes(this.category)) {
      errors.push(ValidationErrors.INVALID_CATEGORY);
    }

    // Validate ID
    if (!this.id || typeof this.id !== 'string') {
      errors.push('Invalid transaction ID');
    }

    // Validate timestamp
    if (!this.timestamp || typeof this.timestamp !== 'number' || this.timestamp <= 0) {
      errors.push('Invalid timestamp');
    }

    if (errors.length > 0) {
      throw new Error(`Transaction validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Convert transaction to plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      amount: this.amount,
      category: this.category,
      timestamp: this.timestamp
    };
  }

  /**
   * Create Transaction from plain object
   * @param {Object} data - Plain object with transaction data
   * @returns {Transaction} New Transaction instance
   */
  static fromJSON(data) {
    return new Transaction(
      data.name,
      data.amount,
      data.category,
      data.id,
      data.timestamp
    );
  }

  /**
   * Get category configuration for this transaction
   * @returns {Object} Category configuration object
   */
  getCategoryConfig() {
    return CATEGORY_CONFIG[this.category] || null;
  }

  /**
   * Format amount as currency string
   * @param {string} [currency='$'] - Currency symbol
   * @returns {string} Formatted currency string
   */
  getFormattedAmount(currency = '$') {
    return `${currency}${this.amount.toFixed(2)}`;
  }

  /**
   * Get formatted date string
   * @returns {string} Formatted date
   */
  getFormattedDate() {
    return new Date(this.timestamp).toLocaleDateString();
  }

  /**
   * Get formatted time string
   * @returns {string} Formatted time
   */
  getFormattedTime() {
    return new Date(this.timestamp).toLocaleTimeString();
  }
}

/**
 * Data validation utility functions
 */
const DataValidator = {
  /**
   * Validate transaction name
   * @param {string} name - Name to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: ValidationErrors.REQUIRED_FIELD };
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return { isValid: false, error: ValidationErrors.REQUIRED_FIELD };
    }
    
    if (trimmedName.length > 100) {
      return { isValid: false, error: ValidationErrors.NAME_TOO_LONG };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate transaction amount
   * @param {any} amount - Amount to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateAmount(amount) {
    // Convert string to number if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return { isValid: false, error: ValidationErrors.REQUIRED_FIELD };
    }
    
    if (numAmount <= 0) {
      return { isValid: false, error: ValidationErrors.INVALID_AMOUNT };
    }
    
    if (numAmount > 999999999.99) {
      return { isValid: false, error: ValidationErrors.AMOUNT_TOO_LARGE };
    }
    
    // Check decimal places
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { isValid: false, error: ValidationErrors.AMOUNT_PRECISION };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate transaction category
   * @param {string} category - Category to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateCategory(category) {
    if (!category || typeof category !== 'string') {
      return { isValid: false, error: ValidationErrors.REQUIRED_FIELD };
    }
    
    if (!Object.values(Category).includes(category)) {
      return { isValid: false, error: ValidationErrors.INVALID_CATEGORY };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate complete transaction data
   * @param {Object} data - Transaction data to validate
   * @returns {Object} Validation result with isValid, errors, and validData properties
   */
  validateTransactionData(data) {
    const errors = {};
    let isValid = true;

    // Validate name
    const nameResult = this.validateName(data.name);
    if (!nameResult.isValid) {
      errors.name = nameResult.error;
      isValid = false;
    }

    // Validate amount
    const amountResult = this.validateAmount(data.amount);
    if (!amountResult.isValid) {
      errors.amount = amountResult.error;
      isValid = false;
    }

    // Validate category
    const categoryResult = this.validateCategory(data.category);
    if (!categoryResult.isValid) {
      errors.category = categoryResult.error;
      isValid = false;
    }

    // Prepare valid data
    const validData = isValid ? {
      name: data.name ? data.name.trim() : '',
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      category: data.category
    } : null;

    return {
      isValid,
      errors,
      validData
    };
  }
};

/**
 * Category utility functions
 */
const CategoryUtils = {
  /**
   * Get all available categories
   * @returns {Array} Array of category values
   */
  getAllCategories() {
    return Object.values(Category);
  },

  /**
   * Get category configuration
   * @param {string} category - Category name
   * @returns {Object|null} Category configuration or null if not found
   */
  getCategoryConfig(category) {
    return CATEGORY_CONFIG[category] || null;
  },

  /**
   * Get category color
   * @param {string} category - Category name
   * @returns {string} Category color or default color
   */
  getCategoryColor(category) {
    const config = this.getCategoryConfig(category);
    return config ? config.color : '#cccccc';
  },

  /**
   * Get category display name
   * @param {string} category - Category name
   * @returns {string} Category display name
   */
  getCategoryDisplayName(category) {
    const config = this.getCategoryConfig(category);
    return config ? config.name : category;
  },

  /**
   * Check if category is valid
   * @param {string} category - Category to check
   * @returns {boolean} True if valid category
   */
  isValidCategory(category) {
    return Object.values(Category).includes(category);
  }
};

// ===== STORAGE INTERFACE =====

/**
 * Local Storage Interface for data persistence
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Handle all storage operations with error handling
 */
class StorageInterface {
  constructor() {
    this.storageKey = 'expense-tracker-transactions';
    this.isAvailable = this.checkStorageAvailability();
    this.errorHandlers = [];
    this.quotaWarningShown = false;
    this.fallbackMode = false;
    this.memoryStorage = []; // Fallback storage when localStorage unavailable
  }

  /**
   * Check if local storage is available
   * Requirements: 5.5 - Handle Local Storage errors gracefully
   * @returns {boolean} True if storage is available
   */
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('Local storage not available:', error.message);
      this.showStorageUnavailableNotification();
      return false;
    }
  }

  /**
   * Show notification when storage is unavailable
   * Requirements: 5.5 - Add user notifications for storage errors
   */
  showStorageUnavailableNotification() {
    this.showUserNotification(
      'Storage unavailable. Your data will not be saved between sessions.',
      'warning',
      10000
    );
  }

  /**
   * Show user notification for storage issues
   * Requirements: 5.5 - Add user notifications for storage errors
   */
  showUserNotification(message, type = 'error', duration = 5000) {
    // Create notification element
    let notificationContainer = document.querySelector('.storage-notifications');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'storage-notifications';
      notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
      `;
      document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `storage-notification storage-notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.style.cssText = `
      background: ${type === 'error' ? '#fee' : type === 'warning' ? '#fff3cd' : '#d4edda'};
      border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#c3e6cb'};
      color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#155724'};
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 12px;">×</button>
      </div>
    `;

    notificationContainer.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    // Add CSS animations if not already present
    if (!document.querySelector('#storage-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'storage-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Get storage availability status
   * @returns {boolean} True if storage is available
   */
  isStorageAvailable() {
    return this.isAvailable;
  }

  /**
   * Save a single transaction to storage
   * Requirements: 5.3 - Immediately save transactions when added
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   * @param {Transaction} transaction - Transaction to save
   * @throws {Error} If storage operation fails
   */
  saveTransaction(transaction) {
    if (!this.isAvailable) {
      // Graceful degradation - use memory storage
      this.saveToMemoryStorage(transaction);
      if (!this.fallbackMode) {
        this.fallbackMode = true;
        this.showUserNotification(
          'Using temporary storage. Data will be lost when you close the browser.',
          'warning',
          8000
        );
      }
      return;
    }

    try {
      const transactions = this.getAllTransactions();
      
      // Check if transaction already exists (update case)
      const existingIndex = transactions.findIndex(t => t.id === transaction.id);
      
      if (existingIndex >= 0) {
        // Update existing transaction
        transactions[existingIndex] = transaction.toJSON();
      } else {
        // Add new transaction
        transactions.push(transaction.toJSON());
      }

      localStorage.setItem(this.storageKey, JSON.stringify(transactions));
    } catch (error) {
      this.handleStorageError('save', error);
      
      // Fallback to memory storage
      this.saveToMemoryStorage(transaction);
      throw error;
    }
  }

  /**
   * Save transaction to memory storage as fallback
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   */
  saveToMemoryStorage(transaction) {
    const existingIndex = this.memoryStorage.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      this.memoryStorage[existingIndex] = transaction.toJSON();
    } else {
      this.memoryStorage.push(transaction.toJSON());
    }
  }

  /**
   * Delete a transaction from storage
   * Requirements: 5.4 - Immediately remove transactions when deleted
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   * @param {string} id - Transaction ID to delete
   * @returns {boolean} True if transaction was found and deleted
   * @throws {Error} If storage operation fails
   */
  deleteTransaction(id) {
    if (!this.isAvailable) {
      // Graceful degradation - use memory storage
      return this.deleteFromMemoryStorage(id);
    }

    try {
      const transactions = this.getAllTransactions();
      const initialLength = transactions.length;
      
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredTransactions));
      
      return filteredTransactions.length < initialLength;
    } catch (error) {
      this.handleStorageError('delete', error);
      
      // Fallback to memory storage
      const result = this.deleteFromMemoryStorage(id);
      throw error;
    }
  }

  /**
   * Delete transaction from memory storage as fallback
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   */
  deleteFromMemoryStorage(id) {
    const initialLength = this.memoryStorage.length;
    this.memoryStorage = this.memoryStorage.filter(t => t.id !== id);
    return this.memoryStorage.length < initialLength;
  }

  /**
   * Retrieve all transactions from storage
   * Requirements: 5.2 - Retrieve existing transactions on load
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   * @returns {Array<Transaction>} Array of Transaction objects
   */
  getAllTransactions() {
    if (!this.isAvailable) {
      // Graceful degradation - use memory storage
      return this.getFromMemoryStorage();
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      
      if (!data) {
        return [];
      }

      const transactionData = JSON.parse(data);
      
      if (!Array.isArray(transactionData)) {
        console.warn('Invalid transaction data format, returning empty array');
        return [];
      }

      // Convert plain objects back to Transaction instances
      return transactionData.map(data => {
        try {
          return Transaction.fromJSON(data);
        } catch (error) {
          console.warn('Failed to parse transaction:', data, error.message);
          return null;
        }
      }).filter(transaction => transaction !== null);

    } catch (error) {
      this.handleStorageError('load', error);
      
      // Fallback to memory storage
      return this.getFromMemoryStorage();
    }
  }

  /**
   * Get transactions from memory storage as fallback
   * Requirements: 5.5 - Implement graceful degradation when storage unavailable
   */
  getFromMemoryStorage() {
    return this.memoryStorage.map(data => {
      try {
        return Transaction.fromJSON(data);
      } catch (error) {
        console.warn('Failed to parse memory transaction:', data, error.message);
        return null;
      }
    }).filter(transaction => transaction !== null);
  }

  /**
   * Clear all transactions from storage
   * @throws {Error} If storage operation fails
   */
  clearAllTransactions() {
    if (!this.isAvailable) {
      throw new Error('Local storage is not available');
    }

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      this.handleStorageError('clear', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage statistics
   */
  getStorageInfo() {
    if (!this.isAvailable) {
      return {
        available: false,
        transactionCount: 0,
        storageSize: 0,
        error: 'Local storage not available'
      };
    }

    try {
      const transactions = this.getAllTransactions();
      const data = localStorage.getItem(this.storageKey) || '';
      
      return {
        available: true,
        transactionCount: transactions.length,
        storageSize: new Blob([data]).size,
        error: null
      };
    } catch (error) {
      return {
        available: false,
        transactionCount: 0,
        storageSize: 0,
        error: error.message
      };
    }
  }

  /**
   * Export all transactions as JSON string
   * @returns {string} JSON string of all transactions
   */
  exportTransactions() {
    try {
      const transactions = this.getAllTransactions();
      return JSON.stringify(transactions.map(t => t.toJSON()), null, 2);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw new Error('Failed to export transaction data');
    }
  }

  /**
   * Import transactions from JSON string
   * @param {string} jsonData - JSON string containing transaction data
   * @returns {number} Number of transactions imported
   * @throws {Error} If import fails
   */
  importTransactions(jsonData) {
    if (!this.isAvailable) {
      throw new Error('Local storage is not available');
    }

    try {
      const data = JSON.parse(jsonData);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }

      // Validate and convert to Transaction objects
      const transactions = data.map(item => Transaction.fromJSON(item));
      
      // Save all transactions
      localStorage.setItem(this.storageKey, JSON.stringify(transactions.map(t => t.toJSON())));
      
      return transactions.length;
    } catch (error) {
      console.error('Failed to import transactions:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Handle storage errors with appropriate logging and user feedback
   * Requirements: 5.5 - Handle Local Storage errors gracefully
   * Requirements: 5.5 - Implement quota exceeded error handling
   * @param {string} operation - The operation that failed
   * @param {Error} error - The error that occurred
   */
  handleStorageError(operation, error) {
    console.error(`Storage ${operation} failed:`, error);
    
    // Categorize error types for better user feedback
    let userMessage = '';
    let notificationType = 'error';
    
    switch (error.name) {
      case 'QuotaExceededError':
        userMessage = 'Storage is full. Please delete some transactions or clear browser data to continue saving.';
        notificationType = 'warning';
        this.handleQuotaExceeded();
        break;
      case 'SecurityError':
        userMessage = 'Storage access denied. Please check browser settings and allow local storage for this site.';
        break;
      case 'InvalidStateError':
        userMessage = 'Storage is in an invalid state. Please refresh the page to continue.';
        break;
      case 'SyntaxError':
        userMessage = 'Stored data is corrupted. You may need to clear your browser data for this site.';
        break;
      case 'TypeError':
        userMessage = 'Storage operation failed due to invalid data. Please try again.';
        break;
      default:
        userMessage = `Unable to ${operation} data. Your changes may not be saved permanently.`;
    }

    // Show user notification
    this.showUserNotification(userMessage, notificationType, 8000);

    // Store error for potential user notification
    this.lastError = {
      operation,
      error: error.message,
      userMessage,
      timestamp: Date.now(),
      errorName: error.name
    };

    // Trigger error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(operation, error, userMessage);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });
  }

  /**
   * Handle quota exceeded error specifically
   * Requirements: 5.5 - Implement quota exceeded error handling
   */
  handleQuotaExceeded() {
    if (this.quotaWarningShown) return;
    
    this.quotaWarningShown = true;
    
    // Show detailed quota exceeded notification
    const message = `
      <div>
        <strong>Storage Full</strong><br>
        Your browser's storage is full. To continue saving expenses:
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Delete old transactions you no longer need</li>
          <li>Clear browser data for this site</li>
          <li>Use browser settings to increase storage quota</li>
        </ul>
        <small>New expenses will be saved temporarily until you close the browser.</small>
      </div>
    `;
    
    this.showUserNotification(message, 'warning', 15000);
    
    // Enable fallback mode
    this.fallbackMode = true;
  }

  /**
   * Add error handler callback
   * @param {Function} handler - Error handler function
   */
  addErrorHandler(handler) {
    if (typeof handler === 'function') {
      this.errorHandlers.push(handler);
    }
  }

  /**
   * Remove error handler callback
   * @param {Function} handler - Error handler function to remove
   */
  removeErrorHandler(handler) {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * Get the last storage error
   * @returns {Object|null} Last error information or null
   */
  getLastError() {
    return this.lastError || null;
  }

  /**
   * Clear the last error
   */
  clearLastError() {
    this.lastError = null;
  }
}

// ===== INPUT FORM COMPONENT =====

/**
 * InputForm Component - Handles transaction input and validation
 * Requirements: 1.1 - Display fields for item name, amount, and category selection
 * Requirements: 1.7 - Clear all fields when transaction successfully added
 */
class InputForm {
  /**
   * Create InputForm component
   * @param {HTMLElement} container - Container element for the form
   * @param {Function} onSubmit - Callback function for form submission
   */
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    
    // Get form elements
    this.form = this.container.querySelector('#expense-form');
    this.nameInput = this.container.querySelector('#expense-name');
    this.amountInput = this.container.querySelector('#expense-amount');
    this.categorySelect = this.container.querySelector('#expense-category');
    this.submitButton = this.container.querySelector('.submit-btn');
    
    // Get error message elements
    this.nameError = this.container.querySelector('#name-error');
    this.amountError = this.container.querySelector('#amount-error');
    this.categoryError = this.container.querySelector('#category-error');
    
    // Validation state
    this.validationState = {
      name: false,
      amount: false,
      category: false
    };
    
    // Initialize component
    this.init();
  }

  /**
   * Initialize the InputForm component
   */
  init() {
    this.bindEvents();
    this.setupAccessibility();
    this.updateSubmitButton();
  }

  /**
   * Bind event listeners to form elements
   */
  bindEvents() {
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Real-time validation
    this.nameInput.addEventListener('input', this.handleNameInput.bind(this));
    this.nameInput.addEventListener('blur', this.handleNameBlur.bind(this));
    
    this.amountInput.addEventListener('input', this.handleAmountInput.bind(this));
    this.amountInput.addEventListener('blur', this.handleAmountBlur.bind(this));
    
    this.categorySelect.addEventListener('change', this.handleCategoryChange.bind(this));
    this.categorySelect.addEventListener('blur', this.handleCategoryBlur.bind(this));
    
    // Prevent form submission on Enter in input fields (except submit button)
    this.nameInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.amountInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.categorySelect.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    // Associate error messages with inputs using aria-describedby
    this.nameInput.setAttribute('aria-describedby', 'name-error');
    this.amountInput.setAttribute('aria-describedby', 'amount-error');
    this.categorySelect.setAttribute('aria-describedby', 'category-error');
    
    // Set initial aria-invalid state
    this.nameInput.setAttribute('aria-invalid', 'false');
    this.amountInput.setAttribute('aria-invalid', 'false');
    this.categorySelect.setAttribute('aria-invalid', 'false');
    
    // Add role and aria-live to error messages for screen readers
    this.nameError.setAttribute('role', 'alert');
    this.nameError.setAttribute('aria-live', 'polite');
    this.amountError.setAttribute('role', 'alert');
    this.amountError.setAttribute('aria-live', 'polite');
    this.categoryError.setAttribute('role', 'alert');
    this.categoryError.setAttribute('aria-live', 'polite');
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = this.getFormData();
    
    // Validate all fields
    const validation = this.validateAll(formData);
    
    if (validation.isValid) {
      // Call the onSubmit callback with valid data
      try {
        this.onSubmit(validation.validData);
        // Clear form after successful submission (Requirement 1.7)
        this.clear();
        this.showSuccessMessage('Expense added successfully!');
      } catch (error) {
        console.error('Error submitting form:', error);
        this.showFormError('Failed to add expense. Please try again.');
      }
    } else {
      // Display validation errors
      this.displayValidationErrors(validation.errors);
      
      // Focus on first invalid field
      this.focusFirstInvalidField();
    }
  }

  /**
   * Handle name input changes
   * @param {Event} event - Input event
   */
  handleNameInput(event) {
    const value = event.target.value;
    const validation = DataValidator.validateName(value);
    
    this.validationState.name = validation.isValid;
    this.updateFieldValidation('name', validation);
    this.updateSubmitButton();
    
    // Clear any form-level error messages when user starts typing
    this.clearFormMessages();
  }

  /**
   * Handle name input blur
   * @param {Event} event - Blur event
   */
  handleNameBlur(event) {
    const value = event.target.value;
    const validation = DataValidator.validateName(value);
    
    this.validationState.name = validation.isValid;
    this.updateFieldValidation('name', validation, true);
    this.updateSubmitButton();
  }

  /**
   * Handle amount input changes
   * @param {Event} event - Input event
   */
  handleAmountInput(event) {
    const value = event.target.value;
    const validation = DataValidator.validateAmount(value);
    
    this.validationState.amount = validation.isValid;
    this.updateFieldValidation('amount', validation);
    this.updateSubmitButton();
    
    // Clear any form-level error messages when user starts typing
    this.clearFormMessages();
  }

  /**
   * Handle amount input blur
   * @param {Event} event - Blur event
   */
  handleAmountBlur(event) {
    const value = event.target.value;
    const validation = DataValidator.validateAmount(value);
    
    this.validationState.amount = validation.isValid;
    this.updateFieldValidation('amount', validation, true);
    this.updateSubmitButton();
  }

  /**
   * Handle category selection changes
   * @param {Event} event - Change event
   */
  handleCategoryChange(event) {
    const value = event.target.value;
    const validation = DataValidator.validateCategory(value);
    
    this.validationState.category = validation.isValid;
    this.updateFieldValidation('category', validation, true);
    this.updateSubmitButton();
    
    // Clear any form-level error messages when user makes selection
    this.clearFormMessages();
  }

  /**
   * Handle category selection blur
   * @param {Event} event - Blur event
   */
  handleCategoryBlur(event) {
    const value = event.target.value;
    const validation = DataValidator.validateCategory(value);
    
    this.validationState.category = validation.isValid;
    this.updateFieldValidation('category', validation, true);
    this.updateSubmitButton();
  }

  /**
   * Handle keydown events for form navigation
   * @param {Event} event - Keydown event
   */
  handleKeyDown(event) {
    // Allow Enter to submit form only when all fields are valid
    if (event.key === 'Enter') {
      if (this.isFormValid()) {
        // Let the form submit naturally
        return;
      } else {
        // Prevent submission and move to next field
        event.preventDefault();
        this.focusNextField(event.target);
      }
    }
    
    // Escape key clears current field and errors
    if (event.key === 'Escape') {
      event.target.value = '';
      event.target.dispatchEvent(new Event('input', { bubbles: true }));
      this.clearFormMessages();
    }
  }

  /**
   * Get current form data
   * @returns {Object} Form data object
   */
  getFormData() {
    return {
      name: this.nameInput.value,
      amount: this.amountInput.value,
      category: this.categorySelect.value
    };
  }

  /**
   * Validate all form fields
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  validateAll(formData) {
    return DataValidator.validateTransactionData(formData);
  }

  /**
   * Update field validation state and display
   * @param {string} fieldName - Name of the field (name, amount, category)
   * @param {Object} validation - Validation result
   * @param {boolean} showError - Whether to show error message
   */
  updateFieldValidation(fieldName, validation, showError = false) {
    const input = this.getFieldInput(fieldName);
    const errorElement = this.getFieldError(fieldName);
    const formGroup = input.closest('.form-group');
    
    if (validation.isValid) {
      // Field is valid
      input.setAttribute('aria-invalid', 'false');
      formGroup.classList.remove('has-error');
      formGroup.classList.add('has-success');
      this.hideError(errorElement);
    } else if (showError || input.value.length > 0) {
      // Field is invalid and should show error
      input.setAttribute('aria-invalid', 'true');
      formGroup.classList.remove('has-success');
      formGroup.classList.add('has-error');
      this.showError(errorElement, validation.error);
    } else {
      // Field is invalid but don't show error yet (user hasn't finished typing)
      input.setAttribute('aria-invalid', 'false');
      formGroup.classList.remove('has-error', 'has-success');
      this.hideError(errorElement);
    }
    
    // Update field-specific accessibility attributes
    if (validation.isValid) {
      input.removeAttribute('aria-describedby');
    } else if (showError || input.value.length > 0) {
      input.setAttribute('aria-describedby', errorElement.id);
    }
  }

  /**
   * Get input element for field
   * @param {string} fieldName - Field name
   * @returns {HTMLElement} Input element
   */
  getFieldInput(fieldName) {
    switch (fieldName) {
      case 'name': return this.nameInput;
      case 'amount': return this.amountInput;
      case 'category': return this.categorySelect;
      default: throw new Error(`Unknown field: ${fieldName}`);
    }
  }

  /**
   * Get error element for field
   * @param {string} fieldName - Field name
   * @returns {HTMLElement} Error element
   */
  getFieldError(fieldName) {
    switch (fieldName) {
      case 'name': return this.nameError;
      case 'amount': return this.amountError;
      case 'category': return this.categoryError;
      default: throw new Error(`Unknown field: ${fieldName}`);
    }
  }

  /**
   * Show error message for a field
   * @param {HTMLElement} errorElement - Error message element
   * @param {string} message - Error message
   */
  showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  /**
   * Hide error message for a field
   * @param {HTMLElement} errorElement - Error message element
   */
  hideError(errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }

  /**
   * Display validation errors for all fields
   * @param {Object} errors - Validation errors object
   */
  displayValidationErrors(errors) {
    // Clear all previous errors
    this.hideAllErrors();
    
    // Show errors for each field
    Object.keys(errors).forEach(fieldName => {
      const validation = { isValid: false, error: errors[fieldName] };
      this.updateFieldValidation(fieldName, validation, true);
    });
  }

  /**
   * Hide all error messages
   */
  hideAllErrors() {
    this.hideError(this.nameError);
    this.hideError(this.amountError);
    this.hideError(this.categoryError);
    
    // Remove error classes from form groups
    this.container.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('has-error');
    });
  }

  /**
   * Clear form-level success and error messages
   */
  clearFormMessages() {
    const successElement = this.container.querySelector('.form-success-message');
    const errorElement = this.container.querySelector('.form-error-message');
    
    if (successElement) {
      successElement.classList.remove('show');
    }
    
    if (errorElement) {
      errorElement.classList.remove('show');
    }
  }

  /**
   * Show form-level success message
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    // Create or update success message element
    let successElement = this.container.querySelector('.form-success-message');
    
    if (!successElement) {
      successElement = document.createElement('div');
      successElement.className = 'success-message form-success-message';
      successElement.setAttribute('role', 'status');
      successElement.setAttribute('aria-live', 'polite');
      this.form.insertBefore(successElement, this.form.firstChild);
    }
    
    successElement.textContent = message;
    successElement.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successElement.classList.remove('show');
    }, 3000);
  }

  /**
   * Show form-level error message
   * @param {string} message - Error message
   */
  showFormError(message) {
    // Create or update error message element
    let errorElement = this.container.querySelector('.form-error-message');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message form-error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      this.form.insertBefore(errorElement, this.form.firstChild);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }

  /**
   * Check if the entire form is valid
   * @returns {boolean} True if all fields are valid
   */
  isFormValid() {
    return this.validationState.name && 
           this.validationState.amount && 
           this.validationState.category;
  }

  /**
   * Update submit button state based on form validity
   */
  updateSubmitButton() {
    const isValid = this.isFormValid();
    const wasDisabled = this.submitButton.disabled;
    
    this.submitButton.disabled = !isValid;
    
    if (isValid) {
      this.submitButton.setAttribute('aria-label', 'Add expense (form is valid)');
      this.submitButton.classList.add('form-valid');
      
      // Provide subtle feedback when form becomes valid
      if (wasDisabled) {
        this.submitButton.classList.add('newly-enabled');
        setTimeout(() => {
          this.submitButton.classList.remove('newly-enabled');
        }, 300);
      }
    } else {
      this.submitButton.setAttribute('aria-label', 'Add expense (please complete all fields)');
      this.submitButton.classList.remove('form-valid');
    }
  }

  /**
   * Focus on the first invalid field
   */
  focusFirstInvalidField() {
    if (!this.validationState.name) {
      this.nameInput.focus();
    } else if (!this.validationState.amount) {
      this.amountInput.focus();
    } else if (!this.validationState.category) {
      this.categorySelect.focus();
    }
  }

  /**
   * Focus on the next field in tab order
   * @param {HTMLElement} currentField - Currently focused field
   */
  focusNextField(currentField) {
    if (currentField === this.nameInput) {
      this.amountInput.focus();
    } else if (currentField === this.amountInput) {
      this.categorySelect.focus();
    } else if (currentField === this.categorySelect) {
      this.submitButton.focus();
    }
  }

  /**
   * Clear all form fields (Requirement 1.7)
   */
  clear() {
    // Clear input values
    this.nameInput.value = '';
    this.amountInput.value = '';
    this.categorySelect.value = '';
    
    // Reset validation state
    this.validationState = {
      name: false,
      amount: false,
      category: false
    };
    
    // Clear all error messages and validation classes
    this.hideAllErrors();
    this.container.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('has-error', 'has-success');
    });
    
    // Reset aria-invalid attributes
    this.nameInput.setAttribute('aria-invalid', 'false');
    this.amountInput.setAttribute('aria-invalid', 'false');
    this.categorySelect.setAttribute('aria-invalid', 'false');
    
    // Update submit button state
    this.updateSubmitButton();
    
    // Focus on first field for better UX
    this.nameInput.focus();
  }

  /**
   * Set form data (useful for editing)
   * @param {Object} data - Data to populate form with
   */
  setData(data) {
    if (data.name !== undefined) {
      this.nameInput.value = data.name;
      this.handleNameInput({ target: this.nameInput });
    }
    
    if (data.amount !== undefined) {
      this.amountInput.value = data.amount;
      this.handleAmountInput({ target: this.amountInput });
    }
    
    if (data.category !== undefined) {
      this.categorySelect.value = data.category;
      this.handleCategoryChange({ target: this.categorySelect });
    }
  }

  /**
   * Get form validation state
   * @returns {Object} Current validation state
   */
  getValidationState() {
    return { ...this.validationState };
  }

  /**
   * Enable or disable the form
   * @param {boolean} enabled - Whether form should be enabled
   */
  setEnabled(enabled) {
    this.nameInput.disabled = !enabled;
    this.amountInput.disabled = !enabled;
    this.categorySelect.disabled = !enabled;
    this.submitButton.disabled = !enabled;
    
    if (enabled) {
      this.container.classList.remove('component-loading');
    } else {
      this.container.classList.add('component-loading');
    }
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy() {
    // Remove event listeners
    this.form.removeEventListener('submit', this.handleSubmit);
    this.nameInput.removeEventListener('input', this.handleNameInput);
    this.nameInput.removeEventListener('blur', this.handleNameBlur);
    this.amountInput.removeEventListener('input', this.handleAmountInput);
    this.amountInput.removeEventListener('blur', this.handleAmountBlur);
    this.categorySelect.removeEventListener('change', this.handleCategoryChange);
    this.categorySelect.removeEventListener('blur', this.handleCategoryBlur);
    
    // Clear references
    this.container = null;
    this.onSubmit = null;
  }
}

// ===== TRANSACTION LIST COMPONENT =====

/**
 * TransactionList Component - Displays all transactions with delete functionality
 * Requirements: 2.1 - Display all stored transactions with name, amount, and category
 * Requirements: 2.6 - Display appropriate empty state message when no transactions exist
 */
class TransactionList {
  /**
   * Create TransactionList component
   * @param {HTMLElement} container - Container element for the transaction list
   * @param {Function} onDelete - Callback function for transaction deletion
   */
  constructor(container, onDelete) {
    this.container = container;
    this.onDelete = onDelete;
    
    // Get list container and empty state elements
    this.listContainer = this.container.querySelector('#transaction-list');
    this.emptyState = this.container.querySelector('#empty-state');
    
    // Current transactions data
    this.transactions = [];
    
    // Initialize component
    this.init();
  }

  /**
   * Initialize the TransactionList component
   */
  init() {
    this.setupAccessibility();
    this.bindEvents();
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    // Add ARIA attributes for screen readers
    this.listContainer.setAttribute('role', 'list');
    this.listContainer.setAttribute('aria-label', 'Transaction history');
    
    // Add live region for dynamic updates
    this.listContainer.setAttribute('aria-live', 'polite');
    this.listContainer.setAttribute('aria-relevant', 'additions removals');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Handle scroll events for fade indicators
    this.listContainer.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Handle delete button clicks using event delegation
    this.listContainer.addEventListener('click', this.handleDeleteClick.bind(this));
    
    // Handle keyboard navigation
    this.listContainer.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle scroll events to update fade indicators
   * @param {Event} event - Scroll event
   */
  handleScroll(event) {
    const container = event.target;
    const isScrolledTop = container.scrollTop === 0;
    const isScrolledBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
    
    // Update CSS classes for fade indicators
    container.classList.toggle('scrolled-top', isScrolledTop);
    container.classList.toggle('scrolled-bottom', isScrolledBottom);
  }

  /**
   * Handle delete button clicks
   * @param {Event} event - Click event
   */
  handleDeleteClick(event) {
    // Check if clicked element is a delete button
    if (event.target.classList.contains('delete-btn')) {
      event.preventDefault();
      event.stopPropagation();
      
      const transactionId = event.target.getAttribute('data-transaction-id');
      const transactionItem = event.target.closest('.transaction-item');
      
      if (transactionId && transactionItem) {
        this.handleDelete(transactionId, transactionItem);
      }
    }
  }

  /**
   * Handle keyboard navigation
   * @param {Event} event - Keydown event
   */
  handleKeyDown(event) {
    // Handle Enter and Space on delete buttons
    if ((event.key === 'Enter' || event.key === ' ') && 
        event.target.classList.contains('delete-btn')) {
      event.preventDefault();
      event.target.click();
    }
    
    // Handle Escape to clear focus
    if (event.key === 'Escape') {
      event.target.blur();
    }
  }

  /**
   * Handle transaction deletion with animation
   * @param {string} transactionId - ID of transaction to delete
   * @param {HTMLElement} transactionItem - Transaction item element
   */
  handleDelete(transactionId, transactionItem) {
    // Add leaving animation
    transactionItem.classList.add('leaving');
    
    // Wait for animation to complete before calling delete callback
    setTimeout(() => {
      try {
        this.onDelete(transactionId);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        // Remove leaving class if deletion failed
        transactionItem.classList.remove('leaving');
        this.showError('Failed to delete transaction. Please try again.');
      }
    }, 300); // Match CSS animation duration
  }

  /**
   * Render all transactions (Requirements: 2.1, 2.6)
   * @param {Array<Transaction>} transactions - Array of transactions to display
   */
  render(transactions) {
    // Store current transactions
    this.transactions = [...transactions];
    
    // Clear existing content
    this.listContainer.innerHTML = '';
    
    if (transactions.length === 0) {
      // Show empty state (Requirement 2.6)
      this.renderEmptyState();
    } else {
      // Sort transactions by timestamp (newest first) - Requirement 2.5
      const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
      
      // Render each transaction
      sortedTransactions.forEach((transaction, index) => {
        const transactionElement = this.renderTransactionItem(transaction, index);
        this.listContainer.appendChild(transactionElement);
      });
      
      // Update scroll indicators
      this.updateScrollIndicators();
    }
    
    // Announce changes to screen readers
    this.announceUpdate(transactions.length);
  }

  /**
   * Render empty state display (Requirement 2.6)
   */
  renderEmptyState() {
    const emptyStateElement = document.createElement('div');
    emptyStateElement.className = 'empty-state';
    emptyStateElement.id = 'empty-state';
    emptyStateElement.setAttribute('role', 'status');
    emptyStateElement.setAttribute('aria-label', 'No transactions available');
    
    const message = document.createElement('p');
    message.textContent = 'No transactions yet. Add your first expense above!';
    emptyStateElement.appendChild(message);
    
    this.listContainer.appendChild(emptyStateElement);
  }

  /**
   * Render a single transaction item
   * @param {Transaction} transaction - Transaction to render
   * @param {number} index - Index for accessibility
   * @returns {HTMLElement} Transaction item element
   */
  renderTransactionItem(transaction, index) {
    // Create main container
    const item = document.createElement('div');
    item.className = 'transaction-item entering';
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', `Transaction ${index + 1}: ${transaction.name}, ${transaction.getFormattedAmount()}, ${transaction.category}`);
    
    // Create transaction info section
    const info = document.createElement('div');
    info.className = 'transaction-info';
    
    // Transaction name
    const name = document.createElement('div');
    name.className = 'transaction-name';
    name.textContent = transaction.name;
    info.appendChild(name);
    
    // Transaction details container
    const details = document.createElement('div');
    details.className = 'transaction-details';
    
    // Amount
    const amount = document.createElement('span');
    amount.className = 'transaction-amount';
    amount.textContent = transaction.getFormattedAmount();
    details.appendChild(amount);
    
    // Category with styling
    const category = document.createElement('span');
    category.className = `transaction-category category-${transaction.category.toLowerCase()}`;
    category.textContent = transaction.category;
    details.appendChild(category);
    
    // Date (optional, for better UX)
    const date = document.createElement('span');
    date.className = 'transaction-date';
    date.textContent = transaction.getFormattedDate();
    details.appendChild(date);
    
    info.appendChild(details);
    item.appendChild(info);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('data-transaction-id', transaction.id);
    deleteBtn.setAttribute('aria-label', `Delete ${transaction.name} transaction`);
    deleteBtn.setAttribute('title', 'Delete transaction');
    deleteBtn.textContent = 'Delete';
    
    item.appendChild(deleteBtn);
    
    // Remove entering class after animation
    setTimeout(() => {
      item.classList.remove('entering');
    }, 300);
    
    return item;
  }

  /**
   * Update scroll indicators based on content
   */
  updateScrollIndicators() {
    // Trigger scroll event to update indicators
    setTimeout(() => {
      this.handleScroll({ target: this.listContainer });
    }, 0);
  }

  /**
   * Announce updates to screen readers
   * @param {number} count - Number of transactions
   */
  announceUpdate(count) {
    const message = count === 0 
      ? 'No transactions to display'
      : `${count} transaction${count === 1 ? '' : 's'} displayed`;
    
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    this.container.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Add a new transaction with animation
   * @param {Transaction} transaction - Transaction to add
   */
  addTransaction(transaction) {
    // Update transactions array
    this.transactions.push(transaction);
    
    // Re-render with updated data
    this.render(this.transactions);
    
    // Scroll to top to show new transaction
    this.listContainer.scrollTop = 0;
  }

  /**
   * Remove a transaction with animation
   * @param {string} transactionId - ID of transaction to remove
   * @returns {boolean} True if transaction was found and removed
   */
  removeTransaction(transactionId) {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== transactionId);
    
    if (this.transactions.length < initialLength) {
      // Re-render with updated data
      this.render(this.transactions);
      return true;
    }
    
    return false;
  }

  /**
   * Update an existing transaction
   * @param {Transaction} updatedTransaction - Updated transaction data
   * @returns {boolean} True if transaction was found and updated
   */
  updateTransaction(updatedTransaction) {
    const index = this.transactions.findIndex(t => t.id === updatedTransaction.id);
    
    if (index >= 0) {
      this.transactions[index] = updatedTransaction;
      this.render(this.transactions);
      return true;
    }
    
    return false;
  }

  /**
   * Get current transactions
   * @returns {Array<Transaction>} Current transactions array
   */
  getTransactions() {
    return [...this.transactions];
  }

  /**
   * Clear all transactions
   */
  clear() {
    this.transactions = [];
    this.render(this.transactions);
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    // Create or update error message element
    let errorElement = this.container.querySelector('.transaction-list-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message transaction-list-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      this.container.insertBefore(errorElement, this.listContainer);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }

  /**
   * Set loading state
   * @param {boolean} loading - Whether component is loading
   */
  setLoading(loading) {
    if (loading) {
      this.container.classList.add('component-loading');
      this.listContainer.setAttribute('aria-busy', 'true');
    } else {
      this.container.classList.remove('component-loading');
      this.listContainer.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Enable or disable the component
   * @param {boolean} enabled - Whether component should be enabled
   */
  setEnabled(enabled) {
    if (enabled) {
      this.container.classList.remove('component-loading');
      this.listContainer.removeAttribute('aria-disabled');
    } else {
      this.container.classList.add('component-loading');
      this.listContainer.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy() {
    // Remove event listeners
    this.listContainer.removeEventListener('scroll', this.handleScroll);
    this.listContainer.removeEventListener('click', this.handleDeleteClick);
    this.listContainer.removeEventListener('keydown', this.handleKeyDown);
    
    // Clear references
    this.container = null;
    this.onDelete = null;
    this.transactions = [];
  }
}

// ===== BALANCE DISPLAY COMPONENT =====

/**
 * BalanceDisplay Component - Shows total spending amount with proper formatting
 * Requirements: 3.1 - Show sum of all transaction amounts
 * Requirements: 3.4 - Format amounts with appropriate currency symbols
 * Requirements: 3.5 - Be prominently positioned at top of interface
 */
class BalanceDisplay {
  /**
   * Create BalanceDisplay component
   * @param {HTMLElement} container - Container element for the balance display
   */
  constructor(container) {
    this.container = container;
    
    // Get balance display elements
    this.balanceDisplay = this.container.querySelector('#balance-display');
    this.balanceAmount = this.container.querySelector('#balance-amount');
    
    // Current balance state
    this.currentBalance = 0;
    this.currency = '$'; // Default currency symbol
    
    // Animation state
    this.isAnimating = false;
    
    // Initialize component
    this.init();
  }

  /**
   * Initialize the BalanceDisplay component
   */
  init() {
    this.setupAccessibility();
    this.render();
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    // Add ARIA attributes for screen readers
    this.balanceDisplay.setAttribute('role', 'status');
    this.balanceDisplay.setAttribute('aria-label', 'Total spending amount');
    this.balanceDisplay.setAttribute('aria-live', 'polite');
    
    // Add semantic meaning to the amount element
    this.balanceAmount.setAttribute('aria-label', `Total spending: ${this.formatCurrency(this.currentBalance)}`);
  }

  /**
   * Calculate total from array of transactions (Requirement 3.1)
   * @param {Array<Transaction>} transactions - Array of transactions
   * @returns {number} Total amount
   */
  calculateTotal(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return 0;
    }

    return transactions.reduce((total, transaction) => {
      // Ensure transaction has valid amount
      if (transaction && typeof transaction.amount === 'number' && !isNaN(transaction.amount)) {
        return total + transaction.amount;
      }
      return total;
    }, 0);
  }

  /**
   * Format amount with currency symbol (Requirement 3.4)
   * @param {number} amount - Amount to format
   * @param {string} [currency] - Currency symbol to use
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = this.currency) {
    // Ensure amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }

    // Round to 2 decimal places to handle floating point precision
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Format with 2 decimal places
    const formattedNumber = roundedAmount.toFixed(2);
    
    // Add currency symbol
    return `${currency}${formattedNumber}`;
  }

  /**
   * Update balance display with new total (Requirements: 3.2, 3.3)
   * @param {number|Array<Transaction>} totalOrTransactions - Total amount or array of transactions
   */
  update(totalOrTransactions) {
    let newBalance;
    
    // Handle both direct total and transactions array
    if (typeof totalOrTransactions === 'number') {
      newBalance = totalOrTransactions;
    } else if (Array.isArray(totalOrTransactions)) {
      newBalance = this.calculateTotal(totalOrTransactions);
    } else {
      console.warn('BalanceDisplay.update: Invalid input type, expected number or array');
      return;
    }

    // Update balance if it has changed
    if (newBalance !== this.currentBalance) {
      this.currentBalance = newBalance;
      this.render(true); // Render with animation
      this.announceChange();
    }
  }

  /**
   * Render the balance display
   * @param {boolean} [animate=false] - Whether to animate the update
   */
  render(animate = false) {
    const formattedAmount = this.formatCurrency(this.currentBalance);
    
    // Update the display
    this.balanceAmount.textContent = formattedAmount;
    
    // Update accessibility label
    this.balanceAmount.setAttribute('aria-label', `Total spending: ${formattedAmount}`);
    
    // Add animation if requested
    if (animate && !this.isAnimating) {
      this.animateUpdate();
    }
  }

  /**
   * Animate balance update for visual feedback
   */
  animateUpdate() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Add animation class
    this.balanceAmount.classList.add('updating');
    
    // Remove animation class after animation completes
    setTimeout(() => {
      this.balanceAmount.classList.remove('updating');
      this.isAnimating = false;
    }, 600); // Match CSS animation duration
  }

  /**
   * Announce balance change to screen readers
   */
  announceChange() {
    const formattedAmount = this.formatCurrency(this.currentBalance);
    
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Total spending updated to ${formattedAmount}`;
    
    this.container.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Get current balance
   * @returns {number} Current balance amount
   */
  getCurrentBalance() {
    return this.currentBalance;
  }

  /**
   * Get formatted current balance
   * @returns {string} Formatted currency string
   */
  getFormattedBalance() {
    return this.formatCurrency(this.currentBalance);
  }

  /**
   * Set currency symbol
   * @param {string} currency - Currency symbol to use
   */
  setCurrency(currency) {
    if (typeof currency === 'string' && currency.length > 0) {
      this.currency = currency;
      this.render(); // Re-render with new currency
    }
  }

  /**
   * Get current currency symbol
   * @returns {string} Current currency symbol
   */
  getCurrency() {
    return this.currency;
  }

  /**
   * Reset balance to zero
   */
  reset() {
    this.update(0);
  }

  /**
   * Set loading state
   * @param {boolean} loading - Whether component is loading
   */
  setLoading(loading) {
    if (loading) {
      this.container.classList.add('component-loading');
      this.balanceDisplay.setAttribute('aria-busy', 'true');
    } else {
      this.container.classList.remove('component-loading');
      this.balanceDisplay.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Show error state
   * @param {string} [message] - Optional error message
   */
  showError(message = 'Error calculating balance') {
    this.container.classList.add('component-error');
    
    // Show error message if provided
    if (message) {
      let errorElement = this.container.querySelector('.balance-error');
      
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message balance-error';
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'assertive');
        this.balanceDisplay.appendChild(errorElement);
      }
      
      errorElement.textContent = message;
      errorElement.classList.add('show');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorElement.classList.remove('show');
        this.container.classList.remove('component-error');
      }, 5000);
    }
  }

  /**
   * Clear error state
   */
  clearError() {
    this.container.classList.remove('component-error');
    
    const errorElement = this.container.querySelector('.balance-error');
    if (errorElement) {
      errorElement.classList.remove('show');
    }
  }

  /**
   * Enable or disable the component
   * @param {boolean} enabled - Whether component should be enabled
   */
  setEnabled(enabled) {
    if (enabled) {
      this.container.classList.remove('component-loading');
      this.balanceDisplay.removeAttribute('aria-disabled');
    } else {
      this.container.classList.add('component-loading');
      this.balanceDisplay.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Clear any pending animations
    this.balanceAmount.classList.remove('updating');
    this.isAnimating = false;
    
    // Clear references
    this.container = null;
    this.balanceDisplay = null;
    this.balanceAmount = null;
  }
}

// ===== PIE CHART COMPONENT =====

/**
 * PieChart Component - Visualizes spending distribution using Chart.js
 * Requirements: 4.1 - Display spending distribution across Food, Transport, and Fun categories
 * Requirements: 4.2 - Update automatically when transactions are added or deleted
 * Requirements: 4.3 - Use Chart.js library for rendering
 * Requirements: 4.4 - Display category labels and percentage values
 * Requirements: 4.5 - Use distinct colors for each category
 * Requirements: 4.6 - Display appropriate empty state when no transactions exist
 * Requirements: 4.7 - Be responsive and maintain readability across different screen sizes
 * Requirements: 6.5 - Implement fallback when Chart.js fails to load
 */
class PieChart {
  /**
   * Create PieChart component
   * @param {HTMLElement} container - Container element for the chart
   */
  constructor(container) {
    this.container = container;
    
    // Get chart elements
    this.chartContainer = this.container.querySelector('.chart-container');
    this.canvas = this.container.querySelector('#spending-chart');
    this.emptyState = this.container.querySelector('#chart-empty-state');
    
    // Chart.js instance
    this.chart = null;
    
    // Current data state
    this.categoryData = {};
    this.hasData = false;
    
    // Chart configuration
    this.chartConfig = this.createChartConfig();
    
    // Responsive behavior
    this.resizeObserver = null;
    
    // Error handling state
    this.chartJsAvailable = this.checkChartJsAvailability();
    this.fallbackMode = false;
    this.renderingErrors = 0;
    this.maxRenderingErrors = 3;
    
    // Initialize component
    this.init();
  }

  /**
   * Check if Chart.js is available
   * Requirements: 6.5 - Implement fallback when Chart.js fails to load
   */
  checkChartJsAvailability() {
    try {
      return typeof Chart !== 'undefined' && Chart.version;
    } catch (error) {
      console.warn('Chart.js not available:', error);
      this.showChartError('Chart.js library failed to load. Using fallback display.');
      return false;
    }
  }

  /**
   * Show chart-specific error message
   * Requirements: 6.5 - Add chart rendering error recovery
   */
  showChartError(message, persistent = false) {
    let errorElement = this.container.querySelector('.chart-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message chart-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      errorElement.style.cssText = `
        background: #fee;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 4px;
        font-size: 14px;
      `;
      this.container.insertBefore(errorElement, this.chartContainer);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 8 seconds unless persistent
    if (!persistent) {
      setTimeout(() => {
        errorElement.classList.remove('show');
      }, 8000);
    }
  }

  /**
   * Initialize the PieChart component
   */
  init() {
    this.setupAccessibility();
    this.setupResponsiveHandling();
    this.renderEmptyState();
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    // Add ARIA attributes for screen readers
    this.chartContainer.setAttribute('role', 'img');
    this.chartContainer.setAttribute('aria-label', 'Spending distribution pie chart');
    
    // Add live region for dynamic updates
    this.chartContainer.setAttribute('aria-live', 'polite');
    this.chartContainer.setAttribute('aria-relevant', 'all');
    
    // Canvas accessibility
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Pie chart showing spending by category');
  }

  /**
   * Setup responsive handling (Requirement 4.7)
   */
  setupResponsiveHandling() {
    // Use ResizeObserver for responsive behavior
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.chart && entries.length > 0) {
          // Debounce resize to avoid excessive updates
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.handleResize();
          }, 150);
        }
      });
      
      this.resizeObserver.observe(this.chartContainer);
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  /**
   * Handle chart resize for responsive behavior
   */
  handleResize() {
    if (this.chart) {
      try {
        this.chart.resize();
        this.updateChartSize();
      } catch (error) {
        console.warn('Chart resize failed:', error);
      }
    }
  }

  /**
   * Update chart size based on container dimensions
   */
  updateChartSize() {
    if (!this.chart || !this.chartContainer) return;
    
    const containerWidth = this.chartContainer.clientWidth;
    const containerHeight = this.chartContainer.clientHeight;
    
    // Adjust chart options based on size
    if (containerWidth < 300) {
      // Small size adjustments
      this.chart.options.plugins.legend.display = false;
      this.chart.options.plugins.tooltip.enabled = true;
    } else if (containerWidth < 500) {
      // Medium size adjustments
      this.chart.options.plugins.legend.display = true;
      this.chart.options.plugins.legend.position = 'bottom';
    } else {
      // Large size adjustments
      this.chart.options.plugins.legend.display = true;
      this.chart.options.plugins.legend.position = 'right';
    }
    
    this.chart.update('none'); // Update without animation for resize
  }

  /**
   * Create Chart.js configuration (Requirements: 4.3, 4.4, 4.5)
   * @returns {Object} Chart.js configuration object
   */
  createChartConfig() {
    return {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 14,
                family: 'inherit'
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  const dataset = data.datasets[0];
                  const total = dataset.data.reduce((sum, value) => sum + value, 0);
                  
                  return data.labels.map((label, index) => {
                    const value = dataset.data[index];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    
                    return {
                      text: `${label}: ${percentage}%`,
                      fillStyle: dataset.backgroundColor[index],
                      strokeStyle: dataset.borderColor,
                      lineWidth: dataset.borderWidth,
                      hidden: false,
                      index: index
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const formattedValue = `$${value.toFixed(2)}`;
                
                return `${label}: ${formattedValue} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'point'
        },
        onHover: (event, activeElements) => {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      }
    };
  }

  /**
   * Calculate category data from transactions (Requirement 4.1)
   * @param {Array<Transaction>} transactions - Array of transactions
   * @returns {Object} Category totals object
   */
  calculateCategoryData(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {};
    }

    const categoryTotals = {};
    
    // Initialize all categories to ensure consistent ordering
    Object.values(Category).forEach(category => {
      categoryTotals[category] = 0;
    });

    // Calculate totals for each category
    transactions.forEach(transaction => {
      if (transaction && transaction.category && typeof transaction.amount === 'number') {
        const category = transaction.category;
        if (categoryTotals.hasOwnProperty(category)) {
          categoryTotals[category] += transaction.amount;
        }
      }
    });

    // Remove categories with zero amounts for cleaner display
    const filteredTotals = {};
    Object.keys(categoryTotals).forEach(category => {
      if (categoryTotals[category] > 0) {
        filteredTotals[category] = categoryTotals[category];
      }
    });

    return filteredTotals;
  }

  /**
   * Prepare chart data from category totals
   * @param {Object} categoryData - Category totals object
   * @returns {Object} Chart data object
   */
  prepareChartData(categoryData) {
    const labels = [];
    const data = [];
    const backgroundColor = [];

    // Sort categories by amount (largest first) for better visual hierarchy
    const sortedCategories = Object.entries(categoryData)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);

    sortedCategories.forEach(category => {
      const amount = categoryData[category];
      const config = CategoryUtils.getCategoryConfig(category);
      
      if (amount > 0 && config) {
        labels.push(config.name);
        data.push(amount);
        backgroundColor.push(config.color);
      }
    });

    return {
      labels,
      data,
      backgroundColor
    };
  }

  /**
   * Update chart with new transaction data (Requirement 4.2)
   * @param {Array<Transaction>|Object} transactionsOrCategoryData - Transactions array or category data object
   */
  update(transactionsOrCategoryData) {
    try {
      let categoryData;
      
      // Handle both transactions array and category data object
      if (Array.isArray(transactionsOrCategoryData)) {
        categoryData = this.calculateCategoryData(transactionsOrCategoryData);
      } else if (typeof transactionsOrCategoryData === 'object' && transactionsOrCategoryData !== null) {
        categoryData = transactionsOrCategoryData;
      } else {
        console.warn('PieChart.update: Invalid input type');
        categoryData = {};
      }

      // Store current data
      this.categoryData = categoryData;
      this.hasData = Object.keys(categoryData).length > 0 && 
                     Object.values(categoryData).some(value => value > 0);

      if (this.hasData) {
        this.renderChart();
        this.hideEmptyState();
        this.announceUpdate();
      } else {
        this.destroyChart();
        this.renderEmptyState();
        this.announceEmptyState();
      }

    } catch (error) {
      console.error('Failed to update pie chart:', error);
      this.showError('Failed to update chart');
    }
  }

  /**
   * Render the pie chart with Chart.js (Requirements: 4.3, 4.4, 4.5)
   * Requirements: 6.5 - Add chart rendering error recovery
   */
  renderChart() {
    try {
      // Check if Chart.js is available
      if (!this.chartJsAvailable) {
        this.renderFallbackDisplay();
        return;
      }

      // Prepare chart data
      const chartData = this.prepareChartData(this.categoryData);
      
      if (chartData.labels.length === 0) {
        this.renderEmptyState();
        return;
      }

      // Destroy existing chart if it exists
      this.destroyChart();

      // Update chart configuration with new data
      this.chartConfig.data.labels = chartData.labels;
      this.chartConfig.data.datasets[0].data = chartData.data;
      this.chartConfig.data.datasets[0].backgroundColor = chartData.backgroundColor;

      // Create new Chart.js instance with error handling
      const ctx = this.canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      this.chart = new Chart(ctx, this.chartConfig);

      // Update chart size for responsive behavior
      this.updateChartSize();

      // Update accessibility
      this.updateAccessibility(chartData);

      // Reset error count on successful render
      this.renderingErrors = 0;
      this.fallbackMode = false;

    } catch (error) {
      console.error('Failed to render pie chart:', error);
      this.handleChartRenderingError(error);
    }
  }

  /**
   * Handle chart rendering errors with recovery
   * Requirements: 6.5 - Add chart rendering error recovery
   */
  handleChartRenderingError(error) {
    this.renderingErrors++;
    
    if (this.renderingErrors >= this.maxRenderingErrors) {
      // Too many errors, switch to permanent fallback mode
      this.fallbackMode = true;
      this.showChartError(
        'Chart rendering has failed multiple times. Using text-based display.',
        true
      );
      this.renderFallbackDisplay();
    } else {
      // Try to recover
      this.showChartError(
        `Chart rendering failed (attempt ${this.renderingErrors}/${this.maxRenderingErrors}). Retrying with fallback display.`
      );
      
      // Wait a bit and try fallback
      setTimeout(() => {
        this.renderFallbackDisplay();
      }, 1000);
    }
  }

  /**
   * Render empty state display (Requirement 4.6)
   */
  renderEmptyState() {
    this.hideChart();
    this.showEmptyState();
  }

  /**
   * Show empty state element
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
      this.emptyState.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide empty state element
   */
  hideEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
      this.emptyState.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Show chart canvas
   */
  showChart() {
    if (this.canvas) {
      this.canvas.style.display = 'block';
      this.canvas.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide chart canvas
   */
  hideChart() {
    if (this.canvas) {
      this.canvas.style.display = 'none';
      this.canvas.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Update accessibility attributes with current data
   * @param {Object} chartData - Current chart data
   */
  updateAccessibility(chartData) {
    if (!chartData || !chartData.labels.length) return;

    // Create accessible description of chart data
    const total = chartData.data.reduce((sum, value) => sum + value, 0);
    const descriptions = chartData.labels.map((label, index) => {
      const value = chartData.data[index];
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return `${label}: $${value.toFixed(2)} (${percentage}%)`;
    });

    const fullDescription = `Spending distribution: ${descriptions.join(', ')}`;
    
    // Update ARIA labels
    this.canvas.setAttribute('aria-label', fullDescription);
    this.chartContainer.setAttribute('aria-label', `Pie chart showing ${fullDescription}`);
  }

  /**
   * Announce chart updates to screen readers
   */
  announceUpdate() {
    if (!this.hasData) return;

    const categoryCount = Object.keys(this.categoryData).length;
    const total = Object.values(this.categoryData).reduce((sum, value) => sum + value, 0);
    
    const message = `Chart updated: ${categoryCount} spending ${categoryCount === 1 ? 'category' : 'categories'}, total $${total.toFixed(2)}`;
    
    this.createAnnouncement(message);
  }

  /**
   * Announce empty state to screen readers
   */
  announceEmptyState() {
    this.createAnnouncement('No spending data to display in chart');
  }

  /**
   * Create temporary announcement for screen readers
   * @param {string} message - Message to announce
   */
  createAnnouncement(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    this.container.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Render fallback text display when Chart.js fails
   */
  renderFallbackDisplay() {
    if (!this.hasData) {
      this.renderEmptyState();
      return;
    }

    // Create text-based fallback
    let fallbackElement = this.container.querySelector('.chart-fallback');
    
    if (!fallbackElement) {
      fallbackElement = document.createElement('div');
      fallbackElement.className = 'chart-fallback';
      fallbackElement.style.cssText = `
        padding: 20px;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      `;
      this.chartContainer.appendChild(fallbackElement);
    }

    // Generate fallback content
    const total = Object.values(this.categoryData).reduce((sum, value) => sum + value, 0);
    const categoryList = Object.entries(this.categoryData)
      .sort(([,a], [,b]) => b - a)
      .map(([category, amount]) => {
        const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
        const config = CategoryUtils.getCategoryConfig(category);
        return `<div style="margin: 8px 0; color: ${config ? config.color : '#333'};">
          <strong>${category}:</strong> $${amount.toFixed(2)} (${percentage}%)
        </div>`;
      })
      .join('');

    fallbackElement.innerHTML = `
      <h3>Spending Breakdown</h3>
      <div>Total: $${total.toFixed(2)}</div>
      ${categoryList}
      <p style="margin-top: 16px; font-size: 0.9em; color: #666;">
        Chart visualization unavailable
      </p>
    `;

    this.hideChart();
    this.hideEmptyState();
  }

  /**
   * Destroy the Chart.js instance
   */
  destroyChart() {
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (error) {
        console.warn('Error destroying chart:', error);
      }
      this.chart = null;
    }
    
    // Remove fallback display
    const fallback = this.container.querySelector('.chart-fallback');
    if (fallback) {
      fallback.remove();
    }
    
    this.showChart(); // Ensure canvas is visible for next render
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    let errorElement = this.container.querySelector('.chart-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message chart-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      this.container.insertBefore(errorElement, this.chartContainer);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }

  /**
   * Get current category data
   * @returns {Object} Current category data
   */
  getCategoryData() {
    return { ...this.categoryData };
  }

  /**
   * Check if chart has data
   * @returns {boolean} True if chart has data to display
   */
  hasChartData() {
    return this.hasData;
  }

  /**
   * Set loading state
   * @param {boolean} loading - Whether component is loading
   */
  setLoading(loading) {
    if (loading) {
      this.container.classList.add('component-loading');
      this.chartContainer.setAttribute('aria-busy', 'true');
      
      // Add loading spinner
      if (!this.container.querySelector('.chart-loading')) {
        const spinner = document.createElement('div');
        spinner.className = 'chart-loading';
        this.chartContainer.appendChild(spinner);
      }
    } else {
      this.container.classList.remove('component-loading');
      this.chartContainer.setAttribute('aria-busy', 'false');
      
      // Remove loading spinner
      const spinner = this.container.querySelector('.chart-loading');
      if (spinner) {
        spinner.remove();
      }
    }
  }

  /**
   * Enable or disable the component
   * @param {boolean} enabled - Whether component should be enabled
   */
  setEnabled(enabled) {
    if (enabled) {
      this.container.classList.remove('component-loading');
      this.chartContainer.removeAttribute('aria-disabled');
    } else {
      this.container.classList.add('component-loading');
      this.chartContainer.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Destroy Chart.js instance
    this.destroyChart();
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Remove window resize listener (fallback)
    window.removeEventListener('resize', this.handleResize);
    
    // Clear references
    this.container = null;
    this.chartContainer = null;
    this.canvas = null;
    this.emptyState = null;
    this.categoryData = {};
    this.hasData = false;
  }
}

/**
 * ExpenseTracker - Main Application Controller
 * Coordinates between components and manages automatic updates
 * Implements Requirements 3.2, 3.3 for automatic balance updates
 */
class ExpenseTracker {
  /**
   * Create ExpenseTracker application controller
   */
  constructor() {
    // Component references
    this.inputForm = null;
    this.transactionList = null;
    this.balanceDisplay = null;
    this.pieChart = null;
    
    // Storage interface
    this.storage = new StorageInterface();
    
    // Application state
    this.transactions = [];
    this.isInitialized = false;
    
    // Event listeners for cleanup
    this.eventListeners = [];
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Expense Tracker...');
      
      // Get container elements
      const inputSection = document.querySelector('.input-section');
      const transactionSection = document.querySelector('.transactions-section');
      const balanceSection = document.querySelector('.balance-section');
      
      if (!inputSection || !transactionSection || !balanceSection) {
        throw new Error('Required DOM elements not found');
      }
      
      // Initialize components
      this.initializeComponents(inputSection, transactionSection, balanceSection);
      
      // Load existing transactions from storage
      await this.loadTransactions();
      
      // Update all components with loaded data
      this.updateAllComponents();
      
      this.isInitialized = true;
      console.log('Expense Tracker initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Expense Tracker:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize all components with event handlers
   */
  initializeComponents(inputSection, transactionSection, balanceSection) {
    // Initialize BalanceDisplay
    this.balanceDisplay = new BalanceDisplay(balanceSection);
    
    // Initialize InputForm with transaction submission handler
    this.inputForm = new InputForm(inputSection, (transactionData) => {
      this.handleTransactionSubmission(transactionData);
    });
    
    // Initialize TransactionList with deletion handler
    this.transactionList = new TransactionList(transactionSection, (transactionId) => {
      this.handleTransactionDeletion(transactionId);
    });
    
    // Initialize PieChart component
    const chartSection = document.querySelector('.chart-section');
    if (chartSection) {
      this.pieChart = new PieChart(chartSection);
    } else {
      console.warn('Chart section not found, PieChart component not initialized');
    }
    
    console.log('All components initialized');
  }

  /**
   * Handle new transaction submission (Requirement 3.2)
   * Automatically updates balance when transaction is added
   */
  async handleTransactionSubmission(transactionData) {
    try {
      console.log('Processing new transaction:', transactionData);
      
      // Create new transaction
      const transaction = new Transaction(
        transactionData.name,
        transactionData.amount,
        transactionData.category
      );
      
      // Save to storage with error handling
      try {
        await this.storage.saveTransaction(transaction);
      } catch (storageError) {
        // Storage failed, but continue with in-memory operation
        console.warn('Storage save failed, continuing with memory-only operation:', storageError);
      }
      
      // Add to local state
      this.transactions.push(transaction);
      
      // Update all components immediately (Requirement 3.2)
      this.updateAllComponents();
      
      // Show success feedback
      if (this.inputForm) {
        this.inputForm.showSuccessMessage('Expense added successfully!');
      }
      
      console.log('Transaction added and balance updated automatically');
      
    } catch (error) {
      console.error('Failed to add transaction:', error);
      
      // Show user-friendly error message
      const errorMessage = this.getTransactionErrorMessage(error);
      if (this.inputForm) {
        this.inputForm.showFormError(errorMessage);
      }
      
      // Don't throw - let the application continue
    }
  }

  /**
   * Get user-friendly error message for transaction errors
   */
  getTransactionErrorMessage(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('validation')) {
      return 'Please check your input and try again.';
    } else if (message.includes('storage') || message.includes('quota')) {
      return 'Unable to save expense due to storage limitations. The expense has been added temporarily.';
    } else if (message.includes('network')) {
      return 'Network error occurred. Please check your connection and try again.';
    } else {
      return 'Failed to add expense. Please try again.';
    }
  }

  /**
   * Handle transaction deletion (Requirement 3.3)
   * Automatically recalculates and updates balance when transaction is deleted
   */
  async handleTransactionDeletion(transactionId) {
    try {
      console.log('Processing transaction deletion:', transactionId);
      
      // Find transaction in local state
      const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
      if (transactionIndex === -1) {
        throw new Error('Transaction not found');
      }
      
      // Remove from storage with error handling
      try {
        await this.storage.deleteTransaction(transactionId);
      } catch (storageError) {
        // Storage failed, but continue with in-memory operation
        console.warn('Storage delete failed, continuing with memory-only operation:', storageError);
      }
      
      // Remove from local state
      this.transactions.splice(transactionIndex, 1);
      
      // Update all components immediately (Requirement 3.3)
      this.updateAllComponents();
      
      console.log('Transaction deleted and balance recalculated automatically');
      
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message.includes('not found') 
        ? 'Transaction not found. It may have already been deleted.'
        : 'Failed to delete expense. Please try again.';
        
      this.showError(errorMessage);
      
      // Don't throw - let the application continue
    }
  }

  /**
   * Load transactions from storage on application startup
   */
  async loadTransactions() {
    try {
      console.log('Loading transactions from storage...');
      
      const storedTransactions = await this.storage.getAllTransactions();
      this.transactions = storedTransactions || [];
      
      console.log(`Loaded ${this.transactions.length} transactions from storage`);
      
      // Set up storage error handler
      this.storage.addErrorHandler((operation, error, userMessage) => {
        console.warn(`Storage ${operation} error:`, error);
        // Don't show duplicate notifications - storage interface handles user notifications
      });
      
    } catch (error) {
      console.error('Failed to load transactions:', error);
      this.transactions = [];
      
      // Show user-friendly error message
      this.showError('Unable to load saved expenses. Starting with a fresh list.');
    }
  }

  /**
   * Update all components with current transaction data
   * Ensures automatic balance updates (Requirements 3.2, 3.3)
   */
  updateAllComponents() {
    if (!this.isInitialized && !this.balanceDisplay) {
      return; // Components not ready yet
    }
    
    try {
      // Update BalanceDisplay with current transactions (automatic recalculation)
      if (this.balanceDisplay) {
        this.balanceDisplay.update(this.transactions);
      }
      
      // Update TransactionList
      if (this.transactionList) {
        this.transactionList.render(this.transactions);
      }
      
      // Update PieChart with error handling
      if (this.pieChart) {
        try {
          this.pieChart.update(this.calculateCategoryData());
        } catch (chartError) {
          console.warn('Chart update failed:', chartError);
          // Chart component should handle its own errors and fallback
        }
      }
      
      console.log('All components updated with current transaction data');
      
    } catch (error) {
      console.error('Failed to update components:', error);
      
      // Try to update components individually to isolate the problem
      this.updateComponentsSafely();
    }
  }

  /**
   * Safely update components individually to isolate errors
   */
  updateComponentsSafely() {
    // Update balance display
    try {
      if (this.balanceDisplay) {
        this.balanceDisplay.update(this.transactions);
      }
    } catch (error) {
      console.error('Balance display update failed:', error);
      if (this.balanceDisplay) {
        this.balanceDisplay.showError('Error updating balance');
      }
    }

    // Update transaction list
    try {
      if (this.transactionList) {
        this.transactionList.render(this.transactions);
      }
    } catch (error) {
      console.error('Transaction list update failed:', error);
      if (this.transactionList) {
        this.transactionList.showError('Error updating transaction list');
      }
    }

    // Update pie chart
    try {
      if (this.pieChart) {
        this.pieChart.update(this.calculateCategoryData());
      }
    } catch (error) {
      console.error('Pie chart update failed:', error);
      if (this.pieChart) {
        this.pieChart.showError('Error updating chart');
      }
    }
  }

  /**
   * Calculate category data for pie chart
   */
  calculateCategoryData() {
    const categoryTotals = {};
    
    this.transactions.forEach(transaction => {
      const category = transaction.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });
    
    return categoryTotals;
  }

  /**
   * Get current total balance
   */
  getCurrentBalance() {
    return this.balanceDisplay ? this.balanceDisplay.getCurrentBalance() : 0;
  }

  /**
   * Get all transactions
   */
  getTransactions() {
    return [...this.transactions]; // Return copy to prevent external modification
  }

  /**
   * Show error message to user
   */
  showError(message) {
    // Create or update error display
    let errorElement = document.querySelector('.app-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'app-error error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      
      const appMain = document.querySelector('.app-main');
      if (appMain) {
        appMain.insertBefore(errorElement, appMain.firstChild);
      }
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }

  /**
   * Clear all data (for testing/reset purposes)
   */
  async clearAllData() {
    try {
      await this.storage.clearAllTransactions();
      this.transactions = [];
      this.updateAllComponents();
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showError('Failed to clear data');
    }
  }

  /**
   * Destroy the application and clean up
   */
  destroy() {
    // Clean up components
    if (this.inputForm) {
      this.inputForm.destroy();
    }
    if (this.transactionList) {
      this.transactionList.destroy();
    }
    if (this.balanceDisplay) {
      this.balanceDisplay.destroy();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    
    // Clear references
    this.inputForm = null;
    this.transactionList = null;
    this.balanceDisplay = null;
    this.pieChart = null;
    this.storage = null;
    this.transactions = [];
    this.isInitialized = false;
    
    console.log('Expense Tracker destroyed');
  }
}

// ===== GLOBAL ERROR BOUNDARY =====

/**
 * Global Error Boundary - Handles uncaught errors and ensures application never crashes completely
 * Requirements: 6.5, 7.2 - Implement window error event handling and user-friendly error messages
 */
class GlobalErrorBoundary {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorCooldown = 60000; // 1 minute
    this.lastErrorTime = 0;
    this.criticalErrorShown = false;
    
    this.init();
  }

  /**
   * Initialize global error handling
   * Requirements: 6.5 - Implement window error event handling
   */
  init() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'javascript'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason,
        type: 'promise'
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event);
      }
    }, true);

    console.log('Global error boundary initialized');
  }

  /**
   * Handle JavaScript and promise errors
   * Requirements: 7.2 - Add user-friendly error messages
   */
  handleError(errorInfo) {
    const now = Date.now();
    
    // Implement error cooldown to prevent spam
    if (now - this.lastErrorTime < 1000) {
      return; // Ignore errors within 1 second of each other
    }
    
    this.lastErrorTime = now;
    this.errorCount++;

    console.error('Global error caught:', errorInfo);

    // Check if we've hit the error limit
    if (this.errorCount >= this.maxErrors) {
      this.handleCriticalErrorState();
      return;
    }

    // Determine error severity and user message
    const { severity, userMessage } = this.categorizeError(errorInfo);
    
    // Show appropriate user notification
    this.showErrorNotification(userMessage, severity);

    // Try to recover application state
    this.attemptRecovery(errorInfo);
  }

  /**
   * Handle resource loading errors (CSS, JS, images)
   * Requirements: 6.5 - Ensure application never crashes completely
   */
  handleResourceError(event) {
    const target = event.target;
    const resourceType = target.tagName.toLowerCase();
    const resourceUrl = target.src || target.href;

    console.warn(`Resource loading failed: ${resourceType} - ${resourceUrl}`);

    // Handle specific resource failures
    switch (resourceType) {
      case 'script':
        if (resourceUrl.includes('chart.js')) {
          this.handleChartJsLoadFailure();
        }
        break;
      case 'link':
        if (target.rel === 'stylesheet') {
          this.handleCssLoadFailure(resourceUrl);
        }
        break;
    }
  }

  /**
   * Handle Chart.js loading failure
   * Requirements: 6.5 - Implement fallback when Chart.js fails to load
   */
  handleChartJsLoadFailure() {
    this.showErrorNotification(
      'Chart visualization library failed to load. Charts will display as text.',
      'warning'
    );

    // Notify any chart components about the failure
    if (window.expenseTracker && window.expenseTracker.pieChart) {
      window.expenseTracker.pieChart.chartJsAvailable = false;
      window.expenseTracker.pieChart.fallbackMode = true;
    }
  }

  /**
   * Handle CSS loading failure
   */
  handleCssLoadFailure(cssUrl) {
    console.warn('CSS failed to load:', cssUrl);
    this.showErrorNotification(
      'Some styling may not display correctly due to a loading error.',
      'warning'
    );
  }

  /**
   * Categorize error severity and generate user message
   * Requirements: 7.2 - Add user-friendly error messages
   */
  categorizeError(errorInfo) {
    const message = errorInfo.message?.toLowerCase() || '';
    const filename = errorInfo.filename || '';

    // Critical errors that might break the app
    if (message.includes('cannot read property') || 
        message.includes('is not a function') ||
        message.includes('cannot access before initialization')) {
      return {
        severity: 'error',
        userMessage: 'A technical error occurred. The application will try to continue working, but some features may be unavailable.'
      };
    }

    // Network or resource errors
    if (message.includes('network') || 
        message.includes('fetch') ||
        message.includes('load')) {
      return {
        severity: 'warning',
        userMessage: 'A network error occurred. Please check your internet connection and try again.'
      };
    }

    // Storage errors
    if (message.includes('storage') || 
        message.includes('quota')) {
      return {
        severity: 'warning',
        userMessage: 'Storage error detected. Your data may not be saved properly.'
      };
    }

    // Chart.js errors
    if (filename.includes('chart') || message.includes('chart')) {
      return {
        severity: 'warning',
        userMessage: 'Chart display error. Data will be shown in text format instead.'
      };
    }

    // Generic error
    return {
      severity: 'info',
      userMessage: 'A minor error occurred but the application should continue working normally.'
    };
  }

  /**
   * Show error notification to user
   * Requirements: 7.2 - Add user-friendly error messages
   */
  showErrorNotification(message, severity = 'error') {
    // Create notification container if it doesn't exist
    let container = document.querySelector('.global-error-notifications');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'global-error-notifications';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        max-width: 500px;
        width: 90%;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `global-error-notification global-error-notification--${severity}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    const bgColor = {
      error: '#fee',
      warning: '#fff3cd',
      info: '#d1ecf1'
    }[severity] || '#fee';
    
    const borderColor = {
      error: '#f5c6cb',
      warning: '#ffeaa7',
      info: '#bee5eb'
    }[severity] || '#f5c6cb';
    
    const textColor = {
      error: '#721c24',
      warning: '#856404',
      info: '#0c5460'
    }[severity] || '#721c24';

    notification.style.cssText = `
      background: ${bgColor};
      border: 1px solid ${borderColor};
      color: ${textColor};
      padding: 16px 20px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInDown 0.3s ease-out;
      position: relative;
    `;

    const icon = {
      error: '⚠️',
      warning: '⚠️',
      info: 'ℹ️'
    }[severity] || '⚠️';

    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 18px; flex-shrink: 0;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${severity === 'error' ? 'Application Error' : severity === 'warning' ? 'Warning' : 'Information'}
          </div>
          <div>${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 20px; cursor: pointer; color: ${textColor}; opacity: 0.7; padding: 0; margin-left: 8px;">×</button>
      </div>
    `;

    container.appendChild(notification);

    // Auto-remove based on severity
    const duration = {
      error: 10000,
      warning: 8000,
      info: 5000
    }[severity] || 8000;

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    // Add CSS animations if not already present
    if (!document.querySelector('#global-error-styles')) {
      const style = document.createElement('style');
      style.id = 'global-error-styles';
      style.textContent = `
        @keyframes slideInDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutUp {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Attempt to recover from errors
   * Requirements: 6.5 - Ensure application never crashes completely
   */
  attemptRecovery(errorInfo) {
    try {
      // Try to reinitialize critical components if they're broken
      if (window.expenseTracker && !window.expenseTracker.isInitialized) {
        console.log('Attempting to reinitialize expense tracker...');
        setTimeout(() => {
          try {
            window.expenseTracker.init();
          } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
          }
        }, 2000);
      }

      // Clear any stuck loading states
      document.querySelectorAll('.component-loading').forEach(element => {
        element.classList.remove('component-loading');
      });

      // Re-enable disabled form elements
      document.querySelectorAll('input:disabled, button:disabled, select:disabled').forEach(element => {
        if (!element.hasAttribute('data-permanently-disabled')) {
          element.disabled = false;
        }
      });

    } catch (recoveryError) {
      console.error('Error during recovery attempt:', recoveryError);
    }
  }

  /**
   * Handle critical error state when too many errors occur
   * Requirements: 6.5 - Ensure application never crashes completely
   */
  handleCriticalErrorState() {
    if (this.criticalErrorShown) return;
    
    this.criticalErrorShown = true;
    
    console.error('Critical error state reached - too many errors occurred');
    
    // Show critical error message
    const criticalMessage = `
      <div>
        <strong>Multiple Errors Detected</strong><br>
        The application has encountered several errors. To ensure stability:
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Please refresh the page to restart the application</li>
          <li>Clear your browser cache if problems persist</li>
          <li>Check your internet connection</li>
        </ul>
        <button onclick="window.location.reload()" 
                style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px;">
          Refresh Page
        </button>
      </div>
    `;
    
    this.showErrorNotification(criticalMessage, 'error');
    
    // Disable further error notifications for a while
    setTimeout(() => {
      this.errorCount = 0;
      this.criticalErrorShown = false;
    }, this.errorCooldown);
  }

  /**
   * Reset error count (for testing or manual recovery)
   */
  reset() {
    this.errorCount = 0;
    this.criticalErrorShown = false;
    this.lastErrorTime = 0;
    console.log('Global error boundary reset');
  }

  /**
   * Get current error statistics
   */
  getStats() {
    return {
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
      criticalErrorShown: this.criticalErrorShown,
      lastErrorTime: this.lastErrorTime
    };
  }
}

// Initialize global error boundary
const globalErrorBoundary = new GlobalErrorBoundary();

// Export for testing purposes
if (typeof window !== 'undefined') {
  window.getGlobalErrorBoundary = () => globalErrorBoundary;
}

// Global application instance
let expenseTracker = null;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Expense Tracker...');
  
  expenseTracker = new ExpenseTracker();
  expenseTracker.init().catch(error => {
    console.error('Failed to initialize application:', error);
  });
});

// Export for testing purposes
if (typeof window !== 'undefined') {
  window.ExpenseTracker = ExpenseTracker;
  window.getExpenseTracker = () => expenseTracker;
}

console.log('Expense & Budget Visualizer - All Components and Application Controller loaded');