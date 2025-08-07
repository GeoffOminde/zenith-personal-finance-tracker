export interface User {
  id: string; // email
  email: string;
  plan: 'free' | 'premium';
}

export type View = 'dashboard' | 'transactions' | 'accounts' | 'investments' | 'recurring' | 'bills' | 'loans' | 'budgets' | 'goals' | 'trends' | 'forecasting' | 'insights' | 'settings' | 'categories' | 'banksync' | 'debt' | 'health';

export const VIEW_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  accounts: 'Accounts',
  investments: 'Investments',
  recurring: 'Recurring Payments',
  bills: 'Bill Management',
  loans: 'Loan & Mortgage Tracker',
  budgets: 'Budgets',
  goals: 'Financial Goals',
  trends: 'Trends',
  forecasting: 'Financial Forecast',
  insights: 'AI Financial Assistant',
  settings: 'Settings',
  categories: 'Manage Categories',
  banksync: 'Connect an Account',
  debt: 'Debt Payoff Planner',
  health: 'Financial Health Check',
};

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
  Transfer = 'Transfer',
}

export enum AccountType {
  Checking = 'Checking',
  Savings = 'Savings',
  CreditCard = 'Credit Card',
  Cash = 'Cash',
  Investment = 'Investment',
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  interestRate?: number; // Annual Percentage Rate (e.g., 19.99 for 19.99%)
}

export interface Category {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  accountId: string; // For Income/Expense: the account. For Transfer: the source account.
  toAccountId?: string; // For Transfer: the destination account.
}

export interface Budget {
  id:string;
  categoryId: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}

export enum RecurringFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export interface RecurringTransaction {
  id:string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  lastProcessedDate: string; // YYYY-MM-DD
  accountId: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string | null; // Optional default payment account
  dueDay: number; // Day of the month (1-31)
  lastPaidDate?: string; // YYYY-MM-DD
}

export interface InvestmentHolding {
  id: string;
  accountId: string; // The investment account this belongs to
  name: string; // e.g., Apple Inc.
  ticker: string; // e.g., AAPL
  type: 'Stock' | 'ETF' | 'Crypto' | 'Mutual Fund';
  quantity: number;
  avgCost: number; // Average price per share/unit
}

export enum LoanType {
    Mortgage = 'Mortgage',
    Auto = 'Auto',
    Student = 'Student',
    Personal = 'Personal',
    Other = 'Other',
}

export interface Loan {
    id: string;
    name: string;
    type: LoanType;
    originalPrincipal: number;
    currentBalance: number;
    interestRate: number; // APR
    termInMonths: number;
    monthlyPayment: number;
    startDate: string; // YYYY-MM-DD
    linkedAccountId?: string | null; // Optional account for payments
}

export interface FinancialReport {
  reportTitle: string;
  overallSummary: string;
  keyInsights: string[];
  spendingBreakdown: {
    topCategory: {
      category: string;
      amount: number;
      percentage: number;
    };
    unusualSpending: Array<{
      description: string;
      amount: number;
      reason: string;
    }>;
  };
  budgetPerformance: Array<{
    category: string;
    budgeted: number;
    spent: number;
    status: string;
  }>;
  goalProgress: string;
  actionableTips: string[];
}

export type InsightType = 'Praise' | 'Warning' | 'Suggestion' | 'Observation';

export interface SmartFeedItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
}

export interface AIBudgetSuggestion {
  categoryId: string;
  suggestedAmount: number;
  reasoning: string;
}

export interface AIMonthlySummary {
  summaryText: string;
  spendingChangePercentage: number;
  topCategory: {
    name: string;
    amount: number;
  } | null;
}

export type NotificationType = 'Budget' | 'Goal' | 'Recurring' | 'Bill' | 'Loan' | 'Health';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  date: string; // ISO string
  isRead: boolean;
  relatedId: string; // ID of the budget, goal, or recurring transaction
}

export interface AIForecast {
  summary: string;
  potentialIssues: Array<{
    month: string;
    reason: string;
  }>;
  goalImpact: Array<{
    goalName: string;
    forecast: string;
  }>;
  recommendations: string[];
}

export interface ParsedReceipt {
  description: string; // The store or vendor name
  amount: number;      // The total amount
  date: string;        // The transaction date in YYYY-MM-DD format, if found
}

// --- Financial Health ---
export interface FinancialHealthMetrics {
  savingsRate: { value: number; score: number };
  debtToIncomeRatio: { value: number; score: number };
  emergencyFund: { value: number; score: number };
  budgetAdherence: { value: number; score: number };
  creditCardBurden: { value: number; score: number };
}

export interface FinancialHealthSummary {
  overallScore: number;
  metrics: FinancialHealthMetrics;
}

export interface AIFinancialHealthAnalysis {
    summary: string;
    strengths: Array<{ title: string; explanation: string; }>;
    areasForImprovement: Array<{ title: string; explanation: string; suggestion: string; }>;
}