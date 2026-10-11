# MoneyMate — Personal Expense & Budget Tracker

**MoneyMate** is a personal expense tracker web application built for students and individuals. It requires **no backend or database setup**, utilizing modern browser `localStorage` for complete client-side data persistence with Chart.js CDN for interactive visual analytics.

---

## 🌟 Key Features

### 1. User Authentication System (New)
- **Sign In**: Secure client-side authentication with email and password.
- **Create Account (Sign Up)**: Register new user profiles with name, email, and password.
- **⚡ One-Click Demo Login**: Instantly signs into the demo account (*Jeevan Kishore*) populated with realistic student transactions, budgets, and savings goals.
- **Password Visibility Toggle**: Show/hide password eye buttons.
- **Session Management**: Persistent login session stored in `localStorage`.
- **User Avatar & Sign Out**: Profile avatar in the header and sidebar with instant one-click sign out confirmation.

### 2. Expenses & Income Management
- **Full CRUD**: Record, edit, and delete transactions.
- **Transaction Attributes**: Amount, title/merchant, category, date, payment method (**Cash / UPI / Card**), and optional notes.
- **Dual Flow**: Supports both **Expenses** (outflows) and **Income** (scholarships, stipends, freelance projects).

### 3. Category Intelligence
- **9 Standard Categories**: Food, Travel, Rent, Shopping, Bills, Education, Entertainment, Health, Other.
- **Custom Categories**: Add your own custom categories with any hex color using the built-in color picker.
- Safe deletion with auto-reassignment to *Other*.

### 4. Multi-Faceted Search, Filter & Sort
- **Live Search**: Instant keyword search through transaction titles, notes, and categories.
- **Type Toggle Pills**: Quick filter by *All*, *Expenses*, or *Income*.
- **Category & Payment Method Filters**: Isolate transactions by category or by Cash/UPI/Card.
- **Date Presets & Range Picker**: *All Time*, *This Month*, *Last Month*, *Last 30 Days*, or custom start & end date.
- **Sorting**: Order by Date (Newest/Oldest) or Amount (Highest/Lowest).
- **Live Summary Tally**: Real-time transaction count and net total for active filter criteria.

### 5. Interactive Dashboard & Smart Insights
- **KPI Summary Cards**:
  - Total Spent This Month
  - Total Income
  - Net Balance (Cash Flow Surplus/Deficit)
  - Daily Average Spend
- **Smart Insights Engine**: Dynamic heuristics (e.g. *"You spent 35% more on Food this month compared to last month"* or *"Healthy Savings Rate: You've retained 51% of your income"*).
- **Interactive Visualizations**:
  - Category breakdown **Donut Chart** with percentage tooltips.
  - Multi-month Income vs. Expense **Monthly Trend Bar Chart**.
- **Recent Transactions Ledger**: Quick access to recent activity.

### 6. Monthly & Category Budgets
- **Master Overall Budget**: Set a monthly overall spending target.
- **Per-Category Limits**: Individual caps for Food, Travel, Shopping, etc.
- **3-Tier Visual Alerts**:
  - 🟢 **Safe**: Under 80% of budget utilized.
  - 🟡 **Warning**: 80% – 100% (approaching spending threshold).
  - 🔴 **Exceeded**: Over 100% (danger alert banner).

### 7. Savings Goals & Monthly Calculator
- **Target Tracking**: Set goal name (e.g. *M3 MacBook for Coding*), target amount, and target deadline.
- **Progress Monitoring**: Visual progress bar and percentage completion.
- **Required Monthly Savings Calculator**: Automatically computes how much you need to set aside every month to reach the goal before the deadline.
- **Quick Deposits**: Add contributions with notes directly to any goal.

### 8. Recurring Subscriptions & Bills
- **Automated Scheduling**: Add recurring items like Rent, Wi-Fi, or Spotify with **Weekly** or **Monthly** frequency.
- **Auto-Logging Engine**: On application load, MoneyMate detects overdue recurring items, records them as expenses, and notifies you via toast notifications.
- **Active / Pause Toggle**: Easily pause a subscription without deleting it.

### 9. Financial Reports & CSV Export
- **Monthly Financial Statements**: Overview of total inflow, outflow, net savings, and savings rate percentage.
- **Category Breakdown & Payment Method Shares**: Clear tables showing UPI, Card, and Cash proportions.
- **One-Click CSV Export**: Download transaction history in RFC 4180 CSV format compatible with Excel and Google Sheets.

### 10. Modern Fintech UI/UX
- **Mobile-First & Fully Responsive**: Collapsible desktop sidebar and ergonomic mobile bottom navigation bar.
- **Dark & Light Mode**: Seamless theme toggle with persistent preferences and synchronized chart palettes.
- **Global Currency Selector**: Toggle between **₹ INR** (default), **$ USD**, **€ EUR**, and **£ GBP**.
- **Floating Action Button (FAB)**: Quick `+` button available on every screen.
- **Toast Notifications**: Smooth slide-in feedback for all actions.

---

## 📁 File Structure

```text
/
├── index.html            # Semantic layout, auth views, modals, and templates
├── README.md             # Documentation and usage guide
├── css/
│   └── style.css         # Modern fintech styling, auth styles, responsive breakpoints
└── js/
    ├── storage.js        # LocalStorage wrapper, users registry, and sample dataset
    ├── auth.js           # Authentication module (sign in, register, demo login, logout)
    ├── categories.js     # Category registry and custom category creation
    ├── expenses.js       # Transaction CRUD, filters, sorting, stats, and CSV generator
    ├── budgets.js        # Budget calculations and 3-tier threshold checks
    ├── goals.js          # Savings goals math and monthly target calculator
    ├── recurring.js      # Recurring rules engine and auto-processor
    ├── charts.js         # Chart.js integration and high-resolution canvas fallbacks
    ├── ui.js             # UI controls: auth state, theme, currency, toasts, modals, hash routing
    └── app.js            # Main bootstrap, auth event listeners, and view lifecycles
```

---

## 🚀 How to Run Locally

### Option 1: Direct File Launch
Double-click `index.html` or open it in any modern web browser.

### Option 2: Local HTTP Server (Python)
```bash
# In the project directory:
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### 🔑 Demo Login Credentials
- **Email**: `jeevan@moneymate.app`
- **Password**: `password123`
- Or simply click the **"⚡ One-Click Demo Login"** button on the sign-in card!
