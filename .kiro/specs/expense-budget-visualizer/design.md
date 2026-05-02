# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a client-side web application that provides users with an intuitive interface for tracking expenses and visualizing spending patterns. The system operates entirely within the browser, leveraging local storage for data persistence and Chart.js for interactive visualizations.

### Key Design Principles

- **Simplicity**: Clean, minimal interface with intuitive interactions
- **Performance**: Fast loading and responsive user experience
- **Reliability**: Robust local storage handling with graceful error recovery
- **Accessibility**: Clear visual hierarchy and readable typography
- **Portability**: Single-file architecture for easy deployment

### Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Visualization**: Chart.js library for pie chart rendering
- **Storage**: Browser Local Storage API
- **Architecture**: Single-page application (SPA) with component-based structure

## Architecture

### System Architecture

The application follows a client-side MVC (Model-View-Controller) pattern implemented in vanilla JavaScript:

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │      View       │  │   Controller    │  │    Model     │ │
│  │                 │  │                 │  │              │ │
│  │ • Input Form    │◄─┤ • Event Handler │◄─┤ • Transaction│ │
│  │ • Transaction   │  │ • Validation    │  │   Manager    │ │
│  │   List          │  │ • State Mgmt    │  │ • Storage    │ │
│  │ • Balance       │  │ • Chart Updates │  │   Interface  │ │
│  │   Display       │  │                 │  │              │ │
│  │ • Pie Chart     │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Local Storage API                         │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
expense-budget-visualizer/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css         # Single CSS file with all styles
├── js/
│   └── app.js            # Single JavaScript file with all logic
└── README.md             # Documentation and setup instructions
```

### Component Architecture

The application is structured around four main UI components, each with specific responsibilities:

1. **InputForm Component**: Handles transaction input and validation
2. **TransactionList Component**: Manages transaction display and deletion
3. **BalanceDisplay Component**: Shows total spending calculations
4. **PieChart Component**: Renders spending distribution visualization

## Components and Interfaces

### InputForm Component

**Purpose**: Provides user interface for adding new expense transactions

**Interface**:
```javascript
class InputForm {
  constructor(container, onSubmit)
  render()
  validate(formData)
  clear()
  showError(message)
  hideError()
}
```

**Responsibilities**:
- Render form fields (name, amount, category)
- Validate user input before submission
- Display validation error messages
- Clear form after successful submission
- Emit events to controller on form submission

**Validation Rules**:
- All fields required
- Amount must be positive number
- Category must be one of: Food, Transport, Fun

### TransactionList Component

**Purpose**: Displays all transactions with delete functionality

**Interface**:
```javascript
class TransactionList {
  constructor(container, onDelete)
  render(transactions)
  renderEmptyState()
  handleDelete(transactionId)
}
```

**Responsibilities**:
- Render scrollable list of transactions
- Display transactions in reverse chronological order
- Provide delete buttons for each transaction
- Show empty state when no transactions exist
- Emit delete events to controller

### BalanceDisplay Component

**Purpose**: Shows total spending amount with proper formatting

**Interface**:
```javascript
class BalanceDisplay {
  constructor(container)
  update(totalAmount)
  formatCurrency(amount)
}
```

**Responsibilities**:
- Calculate and display total spending
- Format amounts with currency symbols
- Update automatically when transactions change
- Maintain prominent visual positioning

### PieChart Component

**Purpose**: Visualizes spending distribution using Chart.js

**Interface**:
```javascript
class PieChart {
  constructor(container)
  update(categoryData)
  destroy()
  renderEmptyState()
}
```

**Responsibilities**:
- Render interactive pie chart using Chart.js
- Calculate category percentages
- Update chart when data changes
- Handle responsive resizing
- Show empty state when no data exists

**Chart Configuration**:
- Distinct colors for each category
- Category labels with percentage values
- Responsive design for different screen sizes
- Smooth animations for data updates

### Application Controller

**Purpose**: Coordinates between components and manages application state

**Interface**:
```javascript
class ExpenseTracker {
  constructor()
  init()
  addTransaction(transactionData)
  deleteTransaction(id)
  updateAllComponents()
  handleStorageError(error)
}
```

**Responsibilities**:
- Initialize all components
- Handle form submissions and validations
- Coordinate data flow between components
- Manage local storage operations
- Handle error states gracefully

## Data Models

### Transaction Model

The core data structure representing a single expense entry:

```javascript
interface Transaction {
  id: string;           // Unique identifier (UUID or timestamp-based)
  name: string;         // Item/expense description (1-100 characters)
  amount: number;       // Expense amount (positive number, max 2 decimal places)
  category: Category;   // Expense category
  timestamp: number;    // Creation timestamp (milliseconds since epoch)
}
```

**Validation Constraints**:
- `id`: Must be unique, non-empty string
- `name`: Required, 1-100 characters, trimmed of whitespace
- `amount`: Required, positive number, maximum 2 decimal places
- `category`: Must be one of the predefined Category enum values
- `timestamp`: Automatically generated, used for chronological ordering

### Category Model

Predefined expense categories with associated metadata:

```javascript
enum Category {
  FOOD = 'Food',
  TRANSPORT = 'Transport', 
  FUN = 'Fun'
}

interface CategoryConfig {
  name: string;         // Display name
  color: string;        // Hex color for chart visualization
  icon?: string;        // Optional icon class for UI
}

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
```

### Storage Model

Local storage interface for data persistence:

```javascript
interface StorageInterface {
  saveTransaction(transaction: Transaction): void;
  deleteTransaction(id: string): void;
  getAllTransactions(): Transaction[];
  clearAllTransactions(): void;
  isStorageAvailable(): boolean;
}
```

**Storage Key Structure**:
- Primary key: `expense-tracker-transactions`
- Data format: JSON array of Transaction objects
- Backup strategy: Graceful degradation when storage unavailable

### Application State Model

Runtime state management structure:

```javascript
interface AppState {
  transactions: Transaction[];
  totalBalance: number;
  categoryTotals: Map<Category, number>;
  isLoading: boolean;
  error: string | null;
}
```

**State Management Rules**:
- Single source of truth for all transaction data
- Derived values (balance, category totals) calculated from transactions
- Immutable updates to prevent state corruption
- Error states handled gracefully with user feedback

## Error Handling

### Input Validation Errors

**Form Validation Strategy**:
- Real-time validation with immediate user feedback
- Clear, actionable error messages positioned near relevant fields
- Prevention of form submission until all validation passes

**Validation Error Types**:
```javascript
const ValidationErrors = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_AMOUNT: 'Amount must be a positive number',
  INVALID_CATEGORY: 'Please select a valid category',
  NAME_TOO_LONG: 'Item name must be 100 characters or less',
  AMOUNT_PRECISION: 'Amount cannot have more than 2 decimal places'
};
```

**Error Display Pattern**:
- Show errors inline below form fields
- Use consistent error styling (red text, warning icons)
- Clear errors when user corrects input
- Prevent form submission while errors exist

### Local Storage Errors

**Storage Availability Handling**:
```javascript
function handleStorageError(operation, error) {
  console.error(`Storage ${operation} failed:`, error);
  
  switch(error.name) {
    case 'QuotaExceededError':
      showUserMessage('Storage full. Please delete some transactions.');
      break;
    case 'SecurityError':
      showUserMessage('Storage access denied. Check browser settings.');
      break;
    default:
      showUserMessage('Unable to save data. Changes may be lost.');
  }
}
```

**Graceful Degradation Strategy**:
- Continue operation in memory-only mode when storage fails
- Display clear warnings about data persistence issues
- Provide manual export/import functionality as backup
- Never crash the application due to storage errors

### Chart Rendering Errors

**Chart.js Error Handling**:
- Validate data before passing to Chart.js
- Handle canvas rendering failures gracefully
- Provide fallback text-based display when charts fail
- Log chart errors for debugging without exposing to users

**Error Recovery Patterns**:
```javascript
function renderChartSafely(data) {
  try {
    return new Chart(context, chartConfig);
  } catch (error) {
    console.error('Chart rendering failed:', error);
    renderFallbackChart(data);
    return null;
  }
}
```

### Network and Resource Errors

**Chart.js Library Loading**:
- Detect if Chart.js fails to load from CDN
- Provide fallback to local copy or graceful degradation
- Show appropriate user message if charts unavailable

**Error Boundary Implementation**:
```javascript
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showUserMessage('An unexpected error occurred. Please refresh the page.');
});
```

