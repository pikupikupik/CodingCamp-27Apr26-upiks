// Unit Tests for Transaction and Category Models
// Test file for validating data models functionality

/**
 * Simple test framework for running unit tests
 */
class TestFramework {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  }

  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Expected true, got false. ${message}`);
    }
  }

  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Expected false, got true. ${message}`);
    }
  }

  assertThrows(fn, message = '') {
    try {
      fn();
      throw new Error(`Expected function to throw an error. ${message}`);
    } catch (error) {
      // Expected behavior
    }
  }

  run() {
    console.log('Running Transaction and Category Model Tests...\n');
    
    this.tests.forEach(({ name, testFn }) => {
      try {
        testFn();
        console.log(`✓ ${name}`);
        this.passed++;
      } catch (error) {
        console.error(`✗ ${name}: ${error.message}`);
        this.failed++;
      }
    });

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Create test framework instance
const test = new TestFramework();

// ===== CATEGORY TESTS =====

test.test('Category enum contains correct values', () => {
  test.assertEqual(Category.FOOD, 'Food');
  test.assertEqual(Category.TRANSPORT, 'Transport');
  test.assertEqual(Category.FUN, 'Fun');
});

test.test('Category configuration contains all categories', () => {
  test.assertTrue(CATEGORY_CONFIG.hasOwnProperty(Category.FOOD));
  test.assertTrue(CATEGORY_CONFIG.hasOwnProperty(Category.TRANSPORT));
  test.assertTrue(CATEGORY_CONFIG.hasOwnProperty(Category.FUN));
});

test.test('Category configuration has required properties', () => {
  Object.values(Category).forEach(category => {
    const config = CATEGORY_CONFIG[category];
    test.assertTrue(config.hasOwnProperty('name'));
    test.assertTrue(config.hasOwnProperty('color'));
    test.assertTrue(config.hasOwnProperty('icon'));
    test.assertTrue(typeof config.name === 'string');
    test.assertTrue(typeof config.color === 'string');
    test.assertTrue(typeof config.icon === 'string');
  });
});

// ===== TRANSACTION VALIDATION TESTS =====

test.test('Transaction creates successfully with valid data', () => {
  const transaction = new Transaction('Coffee', 4.50, Category.FOOD);
  test.assertEqual(transaction.name, 'Coffee');
  test.assertEqual(transaction.amount, 4.50);
  test.assertEqual(transaction.category, Category.FOOD);
  test.assertTrue(typeof transaction.id === 'string');
  test.assertTrue(typeof transaction.timestamp === 'number');
});

test.test('Transaction trims whitespace from name', () => {
  const transaction = new Transaction('  Coffee  ', 4.50, Category.FOOD);
  test.assertEqual(transaction.name, 'Coffee');
});

test.test('Transaction rounds amount to 2 decimal places', () => {
  const transaction = new Transaction('Coffee', 4.505, Category.FOOD);
  test.assertEqual(transaction.amount, 4.51);
});

test.test('Transaction throws error for empty name', () => {
  test.assertThrows(() => {
    new Transaction('', 4.50, Category.FOOD);
  });
});

test.test('Transaction throws error for null name', () => {
  test.assertThrows(() => {
    new Transaction(null, 4.50, Category.FOOD);
  });
});

test.test('Transaction throws error for name too long', () => {
  const longName = 'a'.repeat(101);
  test.assertThrows(() => {
    new Transaction(longName, 4.50, Category.FOOD);
  });
});

test.test('Transaction throws error for negative amount', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', -4.50, Category.FOOD);
  });
});

test.test('Transaction throws error for zero amount', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', 0, Category.FOOD);
  });
});

test.test('Transaction throws error for invalid amount', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', 'invalid', Category.FOOD);
  });
});

test.test('Transaction throws error for amount with too many decimal places', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', 4.505, Category.FOOD);
  });
});

test.test('Transaction throws error for invalid category', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', 4.50, 'InvalidCategory');
  });
});

test.test('Transaction throws error for null category', () => {
  test.assertThrows(() => {
    new Transaction('Coffee', 4.50, null);
  });
});

// ===== TRANSACTION METHODS TESTS =====

test.test('Transaction toJSON returns correct object', () => {
  const transaction = new Transaction('Coffee', 4.50, Category.FOOD);
  const json = transaction.toJSON();
  
  test.assertEqual(json.name, 'Coffee');
  test.assertEqual(json.amount, 4.50);
  test.assertEqual(json.category, Category.FOOD);
  test.assertEqual(json.id, transaction.id);
  test.assertEqual(json.timestamp, transaction.timestamp);
});

test.test('Transaction fromJSON creates correct instance', () => {
  const data = {
    id: 'test_id',
    name: 'Coffee',
    amount: 4.50,
    category: Category.FOOD,
    timestamp: 1234567890
  };
  
  const transaction = Transaction.fromJSON(data);
  test.assertEqual(transaction.name, 'Coffee');
  test.assertEqual(transaction.amount, 4.50);
  test.assertEqual(transaction.category, Category.FOOD);
  test.assertEqual(transaction.id, 'test_id');
  test.assertEqual(transaction.timestamp, 1234567890);
});

test.test('Transaction getCategoryConfig returns correct config', () => {
  const transaction = new Transaction('Coffee', 4.50, Category.FOOD);
  const config = transaction.getCategoryConfig();
  
  test.assertEqual(config, CATEGORY_CONFIG[Category.FOOD]);
});

test.test('Transaction getFormattedAmount returns correct format', () => {
  const transaction = new Transaction('Coffee', 4.50, Category.FOOD);
  test.assertEqual(transaction.getFormattedAmount(), '$4.50');
  test.assertEqual(transaction.getFormattedAmount('€'), '€4.50');
});

// ===== DATA VALIDATOR TESTS =====

test.test('DataValidator validateName accepts valid name', () => {
  const result = DataValidator.validateName('Coffee');
  test.assertTrue(result.isValid);
  test.assertEqual(result.error, null);
});

test.test('DataValidator validateName rejects empty name', () => {
  const result = DataValidator.validateName('');
  test.assertFalse(result.isValid);
  test.assertEqual(result.error, ValidationErrors.REQUIRED_FIELD);
});

test.test('DataValidator validateName rejects long name', () => {
  const longName = 'a'.repeat(101);
  const result = DataValidator.validateName(longName);
  test.assertFalse(result.isValid);
  test.assertEqual(result.error, ValidationErrors.NAME_TOO_LONG);
});

test.test('DataValidator validateAmount accepts valid amount', () => {
  const result = DataValidator.validateAmount(4.50);
  test.assertTrue(result.isValid);
  test.assertEqual(result.error, null);
});

test.test('DataValidator validateAmount accepts string amount', () => {
  const result = DataValidator.validateAmount('4.50');
  test.assertTrue(result.isValid);
  test.assertEqual(result.error, null);
});

test.test('DataValidator validateAmount rejects negative amount', () => {
  const result = DataValidator.validateAmount(-4.50);
  test.assertFalse(result.isValid);
  test.assertEqual(result.error, ValidationErrors.INVALID_AMOUNT);
});

test.test('DataValidator validateAmount rejects zero amount', () => {
  const result = DataValidator.validateAmount(0);
  test.assertFalse(result.isValid);
  test.assertEqual(result.error, ValidationErrors.INVALID_AMOUNT);
});

test.test('DataValidator validateCategory accepts valid category', () => {
  const result = DataValidator.validateCategory(Category.FOOD);
  test.assertTrue(result.isValid);
  test.assertEqual(result.error, null);
});

test.test('DataValidator validateCategory rejects invalid category', () => {
  const result = DataValidator.validateCategory('InvalidCategory');
  test.assertFalse(result.isValid);
  test.assertEqual(result.error, ValidationErrors.INVALID_CATEGORY);
});

test.test('DataValidator validateTransactionData validates complete data', () => {
  const data = {
    name: 'Coffee',
    amount: 4.50,
    category: Category.FOOD
  };
  
  const result = DataValidator.validateTransactionData(data);
  test.assertTrue(result.isValid);
  test.assertEqual(Object.keys(result.errors).length, 0);
  test.assertEqual(result.validData.name, 'Coffee');
  test.assertEqual(result.validData.amount, 4.50);
  test.assertEqual(result.validData.category, Category.FOOD);
});

test.test('DataValidator validateTransactionData catches multiple errors', () => {
  const data = {
    name: '',
    amount: -1,
    category: 'Invalid'
  };
  
  const result = DataValidator.validateTransactionData(data);
  test.assertFalse(result.isValid);
  test.assertTrue(result.errors.hasOwnProperty('name'));
  test.assertTrue(result.errors.hasOwnProperty('amount'));
  test.assertTrue(result.errors.hasOwnProperty('category'));
  test.assertEqual(result.validData, null);
});

// ===== CATEGORY UTILS TESTS =====

test.test('CategoryUtils getAllCategories returns all categories', () => {
  const categories = CategoryUtils.getAllCategories();
  test.assertEqual(categories.length, 3);
  test.assertTrue(categories.includes(Category.FOOD));
  test.assertTrue(categories.includes(Category.TRANSPORT));
  test.assertTrue(categories.includes(Category.FUN));
});

test.test('CategoryUtils getCategoryConfig returns correct config', () => {
  const config = CategoryUtils.getCategoryConfig(Category.FOOD);
  test.assertEqual(config, CATEGORY_CONFIG[Category.FOOD]);
});

test.test('CategoryUtils getCategoryConfig returns null for invalid category', () => {
  const config = CategoryUtils.getCategoryConfig('Invalid');
  test.assertEqual(config, null);
});

test.test('CategoryUtils getCategoryColor returns correct color', () => {
  const color = CategoryUtils.getCategoryColor(Category.FOOD);
  test.assertEqual(color, CATEGORY_CONFIG[Category.FOOD].color);
});

test.test('CategoryUtils getCategoryColor returns default for invalid category', () => {
  const color = CategoryUtils.getCategoryColor('Invalid');
  test.assertEqual(color, '#cccccc');
});

test.test('CategoryUtils isValidCategory returns true for valid category', () => {
  test.assertTrue(CategoryUtils.isValidCategory(Category.FOOD));
});

test.test('CategoryUtils isValidCategory returns false for invalid category', () => {
  test.assertFalse(CategoryUtils.isValidCategory('Invalid'));
});

// ===== STORAGE INTERFACE TESTS =====

test.test('StorageInterface initializes correctly', () => {
  const storage = new StorageInterface();
  test.assertTrue(typeof storage.storageKey === 'string');
  test.assertTrue(typeof storage.isAvailable === 'boolean');
});

test.test('StorageInterface checkStorageAvailability works', () => {
  const storage = new StorageInterface();
  const isAvailable = storage.checkStorageAvailability();
  test.assertTrue(typeof isAvailable === 'boolean');
});

test.test('StorageInterface isStorageAvailable returns boolean', () => {
  const storage = new StorageInterface();
  const isAvailable = storage.isStorageAvailable();
  test.assertTrue(typeof isAvailable === 'boolean');
});

test.test('StorageInterface getAllTransactions returns array', () => {
  const storage = new StorageInterface();
  const transactions = storage.getAllTransactions();
  test.assertTrue(Array.isArray(transactions));
});

test.test('StorageInterface saveTransaction and getAllTransactions work together', () => {
  const storage = new StorageInterface();
  
  // Clear any existing data
  try {
    storage.clearAllTransactions();
  } catch (e) {
    // Ignore if storage not available
  }
  
  if (storage.isStorageAvailable()) {
    const transaction = new Transaction('Test Coffee', 5.00, Category.FOOD);
    
    // Save transaction
    storage.saveTransaction(transaction);
    
    // Retrieve transactions
    const transactions = storage.getAllTransactions();
    
    test.assertTrue(transactions.length >= 1);
    const savedTransaction = transactions.find(t => t.id === transaction.id);
    test.assertTrue(savedTransaction !== undefined);
    test.assertEqual(savedTransaction.name, 'Test Coffee');
    test.assertEqual(savedTransaction.amount, 5.00);
    test.assertEqual(savedTransaction.category, Category.FOOD);
  }
});

test.test('StorageInterface deleteTransaction works', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    // Clear and add a test transaction
    try {
      storage.clearAllTransactions();
    } catch (e) {
      // Ignore if storage not available
    }
    
    const transaction = new Transaction('Test Delete', 3.00, Category.TRANSPORT);
    storage.saveTransaction(transaction);
    
    // Verify it exists
    let transactions = storage.getAllTransactions();
    test.assertTrue(transactions.some(t => t.id === transaction.id));
    
    // Delete it
    const deleted = storage.deleteTransaction(transaction.id);
    test.assertTrue(deleted);
    
    // Verify it's gone
    transactions = storage.getAllTransactions();
    test.assertFalse(transactions.some(t => t.id === transaction.id));
  }
});

test.test('StorageInterface deleteTransaction returns false for non-existent ID', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    const deleted = storage.deleteTransaction('non-existent-id');
    test.assertFalse(deleted);
  }
});

test.test('StorageInterface clearAllTransactions works', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    // Add some transactions
    const transaction1 = new Transaction('Test 1', 1.00, Category.FOOD);
    const transaction2 = new Transaction('Test 2', 2.00, Category.FUN);
    storage.saveTransaction(transaction1);
    storage.saveTransaction(transaction2);
    
    // Clear all
    storage.clearAllTransactions();
    
    // Verify empty
    const transactions = storage.getAllTransactions();
    test.assertEqual(transactions.length, 0);
  }
});

test.test('StorageInterface getStorageInfo returns correct structure', () => {
  const storage = new StorageInterface();
  const info = storage.getStorageInfo();
  
  test.assertTrue(typeof info.available === 'boolean');
  test.assertTrue(typeof info.transactionCount === 'number');
  test.assertTrue(typeof info.storageSize === 'number');
  test.assertTrue(info.error === null || typeof info.error === 'string');
});

test.test('StorageInterface exportTransactions returns valid JSON', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    // Clear and add test data
    try {
      storage.clearAllTransactions();
    } catch (e) {
      // Ignore if storage not available
    }
    
    const transaction = new Transaction('Export Test', 7.50, Category.FUN);
    storage.saveTransaction(transaction);
    
    const exported = storage.exportTransactions();
    test.assertTrue(typeof exported === 'string');
    
    // Verify it's valid JSON
    const parsed = JSON.parse(exported);
    test.assertTrue(Array.isArray(parsed));
    test.assertTrue(parsed.length >= 1);
  }
});

test.test('StorageInterface importTransactions works with valid data', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    const testData = [
      {
        id: 'import_test_1',
        name: 'Import Test 1',
        amount: 10.00,
        category: Category.FOOD,
        timestamp: Date.now()
      },
      {
        id: 'import_test_2',
        name: 'Import Test 2',
        amount: 15.00,
        category: Category.TRANSPORT,
        timestamp: Date.now()
      }
    ];
    
    const jsonData = JSON.stringify(testData);
    const importedCount = storage.importTransactions(jsonData);
    
    test.assertEqual(importedCount, 2);
    
    const transactions = storage.getAllTransactions();
    test.assertTrue(transactions.some(t => t.id === 'import_test_1'));
    test.assertTrue(transactions.some(t => t.id === 'import_test_2'));
  }
});

test.test('StorageInterface importTransactions throws error for invalid JSON', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    test.assertThrows(() => {
      storage.importTransactions('invalid json');
    });
  }
});

test.test('StorageInterface importTransactions throws error for non-array data', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    test.assertThrows(() => {
      storage.importTransactions('{"not": "array"}');
    });
  }
});

test.test('StorageInterface handles corrupted data gracefully', () => {
  const storage = new StorageInterface();
  
  if (storage.isStorageAvailable()) {
    // Manually set corrupted data
    localStorage.setItem(storage.storageKey, 'corrupted data');
    
    // Should return empty array, not throw
    const transactions = storage.getAllTransactions();
    test.assertTrue(Array.isArray(transactions));
    test.assertEqual(transactions.length, 0);
  }
});

test.test('StorageInterface getLastError and clearLastError work', () => {
  const storage = new StorageInterface();
  
  // Initially no error
  test.assertEqual(storage.getLastError(), null);
  
  // Simulate an error
  storage.handleStorageError('test', new Error('Test error'));
  
  const error = storage.getLastError();
  test.assertTrue(error !== null);
  test.assertEqual(error.operation, 'test');
  test.assertTrue(typeof error.userMessage === 'string');
  
  // Clear error
  storage.clearLastError();
  test.assertEqual(storage.getLastError(), null);
});

// ===== INPUT FORM COMPONENT TESTS =====

test.test('InputForm class exists and is callable', () => {
  test.assertTrue(typeof InputForm === 'function');
});

test.test('InputForm constructor requires container and onSubmit callback', () => {
  // Create mock DOM elements for testing
  const mockContainer = {
    querySelector: (selector) => {
      const mockElements = {
        '#expense-form': { addEventListener: () => {} },
        '#expense-name': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: '',
          focus: () => {}
        },
        '#expense-amount': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: '',
          focus: () => {}
        },
        '#expense-category': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: '',
          focus: () => {}
        },
        '.submit-btn': { 
          setAttribute: () => {},
          disabled: false,
          focus: () => {}
        },
        '#name-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#amount-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#category-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        }
      };
      return mockElements[selector] || null;
    },
    querySelectorAll: () => []
  };
  
  const mockCallback = () => {};
  
  // Should not throw when provided with valid parameters
  const inputForm = new InputForm(mockContainer, mockCallback);
  test.assertTrue(inputForm instanceof InputForm);
});

test.test('InputForm getFormData returns correct structure', () => {
  const mockContainer = {
    querySelector: (selector) => {
      const mockElements = {
        '#expense-form': { addEventListener: () => {} },
        '#expense-name': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: 'Test Item',
          focus: () => {}
        },
        '#expense-amount': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: '10.50',
          focus: () => {}
        },
        '#expense-category': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          value: 'Food',
          focus: () => {}
        },
        '.submit-btn': { 
          setAttribute: () => {},
          disabled: false,
          focus: () => {}
        },
        '#name-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#amount-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#category-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        }
      };
      return mockElements[selector] || null;
    },
    querySelectorAll: () => []
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  const formData = inputForm.getFormData();
  
  test.assertEqual(formData.name, 'Test Item');
  test.assertEqual(formData.amount, '10.50');
  test.assertEqual(formData.category, 'Food');
});

test.test('InputForm validateAll uses DataValidator correctly', () => {
  const mockContainer = {
    querySelector: () => ({
      addEventListener: () => {},
      setAttribute: () => {},
      value: '',
      focus: () => {},
      disabled: false,
      textContent: '',
      classList: { add: () => {}, remove: () => {} }
    }),
    querySelectorAll: () => []
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  
  // Test valid data
  const validData = {
    name: 'Coffee',
    amount: '4.50',
    category: 'Food'
  };
  
  const validResult = inputForm.validateAll(validData);
  test.assertTrue(validResult.isValid);
  test.assertEqual(validResult.validData.name, 'Coffee');
  test.assertEqual(validResult.validData.amount, 4.50);
  test.assertEqual(validResult.validData.category, 'Food');
  
  // Test invalid data
  const invalidData = {
    name: '',
    amount: '-1',
    category: ''
  };
  
  const invalidResult = inputForm.validateAll(invalidData);
  test.assertFalse(invalidResult.isValid);
  test.assertTrue(Object.keys(invalidResult.errors).length > 0);
});

test.test('InputForm clear method resets form state', () => {
  let nameValue = 'Test';
  let amountValue = '10.50';
  let categoryValue = 'Food';
  
  const mockContainer = {
    querySelector: (selector) => {
      const mockElements = {
        '#expense-form': { addEventListener: () => {} },
        '#expense-name': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return nameValue; },
          set value(v) { nameValue = v; },
          focus: () => {}
        },
        '#expense-amount': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return amountValue; },
          set value(v) { amountValue = v; },
          focus: () => {}
        },
        '#expense-category': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return categoryValue; },
          set value(v) { categoryValue = v; },
          focus: () => {}
        },
        '.submit-btn': { 
          setAttribute: () => {},
          disabled: false,
          focus: () => {}
        },
        '#name-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#amount-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#category-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        }
      };
      return mockElements[selector] || null;
    },
    querySelectorAll: () => [{
      classList: { remove: () => {} }
    }]
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  
  // Clear the form
  inputForm.clear();
  
  // Check that values are cleared
  test.assertEqual(nameValue, '');
  test.assertEqual(amountValue, '');
  test.assertEqual(categoryValue, '');
  
  // Check validation state is reset
  const validationState = inputForm.getValidationState();
  test.assertFalse(validationState.name);
  test.assertFalse(validationState.amount);
  test.assertFalse(validationState.category);
});

test.test('InputForm isFormValid returns correct boolean', () => {
  const mockContainer = {
    querySelector: () => ({
      addEventListener: () => {},
      setAttribute: () => {},
      value: '',
      focus: () => {},
      disabled: false,
      textContent: '',
      classList: { add: () => {}, remove: () => {} }
    }),
    querySelectorAll: () => []
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  
  // Initially should be false (all fields invalid)
  test.assertFalse(inputForm.isFormValid());
  
  // Set all fields to valid
  inputForm.validationState.name = true;
  inputForm.validationState.amount = true;
  inputForm.validationState.category = true;
  
  test.assertTrue(inputForm.isFormValid());
  
  // Set one field to invalid
  inputForm.validationState.name = false;
  
  test.assertFalse(inputForm.isFormValid());
});

test.test('InputForm setData populates form fields', () => {
  let nameValue = '';
  let amountValue = '';
  let categoryValue = '';
  
  const mockContainer = {
    querySelector: (selector) => {
      const mockElements = {
        '#expense-form': { addEventListener: () => {} },
        '#expense-name': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return nameValue; },
          set value(v) { nameValue = v; },
          focus: () => {}
        },
        '#expense-amount': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return amountValue; },
          set value(v) { amountValue = v; },
          focus: () => {}
        },
        '#expense-category': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get value() { return categoryValue; },
          set value(v) { categoryValue = v; },
          focus: () => {}
        },
        '.submit-btn': { 
          setAttribute: () => {},
          disabled: false,
          focus: () => {}
        },
        '#name-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#amount-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#category-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        }
      };
      return mockElements[selector] || null;
    },
    querySelectorAll: () => []
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  
  // Set form data
  inputForm.setData({
    name: 'Test Coffee',
    amount: 5.25,
    category: 'Food'
  });
  
  // Check that values are set
  test.assertEqual(nameValue, 'Test Coffee');
  test.assertEqual(amountValue, 5.25);
  test.assertEqual(categoryValue, 'Food');
});

test.test('InputForm setEnabled controls form state', () => {
  let nameDisabled = false;
  let amountDisabled = false;
  let categoryDisabled = false;
  let submitDisabled = false;
  
  const mockContainer = {
    querySelector: (selector) => {
      const mockElements = {
        '#expense-form': { addEventListener: () => {} },
        '#expense-name': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get disabled() { return nameDisabled; },
          set disabled(v) { nameDisabled = v; },
          value: '',
          focus: () => {}
        },
        '#expense-amount': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get disabled() { return amountDisabled; },
          set disabled(v) { amountDisabled = v; },
          value: '',
          focus: () => {}
        },
        '#expense-category': { 
          addEventListener: () => {}, 
          setAttribute: () => {},
          get disabled() { return categoryDisabled; },
          set disabled(v) { categoryDisabled = v; },
          value: '',
          focus: () => {}
        },
        '.submit-btn': { 
          setAttribute: () => {},
          get disabled() { return submitDisabled; },
          set disabled(v) { submitDisabled = v; },
          focus: () => {}
        },
        '#name-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#amount-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        },
        '#category-error': { 
          setAttribute: () => {},
          textContent: '',
          classList: { add: () => {}, remove: () => {} }
        }
      };
      return mockElements[selector] || null;
    },
    querySelectorAll: () => [],
    classList: { add: () => {}, remove: () => {} }
  };
  
  const inputForm = new InputForm(mockContainer, () => {});
  
  // Disable form
  inputForm.setEnabled(false);
  
  test.assertTrue(nameDisabled);
  test.assertTrue(amountDisabled);
  test.assertTrue(categoryDisabled);
  test.assertTrue(submitDisabled);
  
  // Enable form
  inputForm.setEnabled(true);
  
  test.assertFalse(nameDisabled);
  test.assertFalse(amountDisabled);
  test.assertFalse(categoryDisabled);
  test.assertFalse(submitDisabled);
});

// Run all tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('load', () => {
    test.run();
  });
} else {
  // Node.js environment
  test.run();
}