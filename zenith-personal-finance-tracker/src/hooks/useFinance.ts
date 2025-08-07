
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, Budget, RecurringTransaction, RecurringFrequency, Goal, Category, Account, AccountType, InvestmentHolding, Bill, Loan, FinancialHealthSummary } from '../types';

const generateId = () => crypto.randomUUID();

const initialCategories: Category[] = [
    { id: 'cat-1', name: 'Food' },
    { id: 'cat-2', name: 'Transport' },
    { id: 'cat-3', name: 'Bills' },
    { id: 'cat-4', name: 'Entertainment' },
    { id: 'cat-5', name: 'Shopping' },
    { id: 'cat-6', name: 'Health' },
    { id: 'cat-7', name: 'Savings' },
    { id: 'cat-8', name: 'Other' },
    { id: 'cat-loan', name: 'Loan Payment' },
    { id: 'cat-transfer', name: 'Transfer' },
];

const initialTransactions: Transaction[] = [];
const initialBudgets: Budget[] = [];
const initialRecurringTransactions: RecurringTransaction[] = [];
const initialGoals: Goal[] = [];
const initialAccounts: Account[] = [];
const initialInvestments: InvestmentHolding[] = [];
const initialBills: Bill[] = [];
const initialLoans: Loan[] = [];

export const useFinance = (userId: string | null, userPlan: 'free' | 'premium' = 'free') => {
    const userKey = (baseKey: string) => userId ? `zenith_${baseKey}_${userId}` : `zenith_${baseKey}`;
    
    const [accounts, setAccounts] = useState<Account[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('accounts')) || JSON.stringify(initialAccounts)) : initialAccounts);
    const [transactions, setTransactions] = useState<Transaction[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('transactions')) || JSON.stringify(initialTransactions)) : initialTransactions);
    const [categories, setCategories] = useState<Category[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('categories')) || JSON.stringify(initialCategories)) : initialCategories);
    const [budgets, setBudgets] = useState<Budget[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('budgets')) || JSON.stringify(initialBudgets)) : initialBudgets);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('recurring_transactions')) || JSON.stringify(initialRecurringTransactions)) : initialRecurringTransactions);
    const [goals, setGoals] = useState<Goal[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('goals')) || JSON.stringify(initialGoals)) : initialGoals);
    const [investments, setInvestments] = useState<InvestmentHolding[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('investments')) || JSON.stringify(initialInvestments)) : initialInvestments);
    const [bills, setBills] = useState<Bill[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('bills')) || JSON.stringify(initialBills)) : initialBills);
    const [loans, setLoans] = useState<Loan[]>(() => userId ? JSON.parse(localStorage.getItem(userKey('loans')) || JSON.stringify(initialLoans)) : initialLoans);

    const budgetLimit = 3;

    useEffect(() => { if (userId) localStorage.setItem(userKey('accounts'), JSON.stringify(accounts)); }, [accounts, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('transactions'), JSON.stringify(transactions)); }, [transactions, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('categories'), JSON.stringify(categories)); }, [categories, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('budgets'), JSON.stringify(budgets)); }, [budgets, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('recurring_transactions'), JSON.stringify(recurringTransactions)); }, [recurringTransactions, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('goals'), JSON.stringify(goals)); }, [goals, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('investments'), JSON.stringify(investments)); }, [investments, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('bills'), JSON.stringify(bills)); }, [bills, userId]);
    useEffect(() => { if (userId) localStorage.setItem(userKey('loans'), JSON.stringify(loans)); }, [loans, userId]);
    
    const resetData = useCallback(() => {
        if (!userId) return;
        if (window.confirm("Are you sure you want to reset all financial data for your account? This action cannot be undone.")) {
            setTransactions(initialTransactions);
            setCategories(initialCategories);
            setBudgets(initialBudgets);
            setRecurringTransactions(initialRecurringTransactions);
            setGoals(initialGoals);
            setAccounts(initialAccounts);
            setInvestments(initialInvestments);
            setBills(initialBills);
            setLoans(initialLoans);
        }
    }, [userId]);

    const updateAccountBalance = useCallback((accountId: string, amount: number, transactionType: TransactionType, accountType: AccountType, operation: 'add' | 'subtract') => {
        setAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.id === accountId) {
                let newBalance = acc.balance;
                let effectiveAmount = amount;
                if (operation === 'subtract') {
                    effectiveAmount = -amount;
                }

                if (transactionType === TransactionType.Income) {
                     if (accountType === AccountType.CreditCard) {
                        newBalance -= effectiveAmount; // Income/refund decreases credit card debt
                    } else {
                        newBalance += effectiveAmount; // Income increases asset balance
                    }
                } else if (transactionType === TransactionType.Expense) {
                    if (accountType === AccountType.CreditCard) {
                        newBalance += effectiveAmount; // Expenses increase credit card debt
                    } else {
                        newBalance -= effectiveAmount; // Expenses decrease asset balance
                    }
                }
                return { ...acc, balance: newBalance };
            }
            return acc;
        }));
    }, []);
    
    // Account Management
    const addAccount = (name: string, type: AccountType, initialBalance: number, interestRate?: number) => {
        const newAccount: Account = { 
            id: generateId(), 
            name, 
            type, 
            balance: initialBalance,
            interestRate: type === AccountType.CreditCard ? interestRate : undefined,
        };
        setAccounts(prev => [...prev, newAccount]);

        if (initialBalance !== 0 && type !== AccountType.Investment) {
             const openingTransaction: Omit<Transaction, 'id' | 'date'> = {
                description: `Opening Balance for ${name}`,
                amount: Math.abs(initialBalance),
                type: initialBalance >= 0 ? TransactionType.Income : TransactionType.Expense,
                categoryId: 'cat-7', // Savings category
                accountId: newAccount.id,
            };
            addTransaction(openingTransaction, true); // `isOpeningBalance` flag to prevent double counting
        }
    };
    const editAccount = (updated: Account) => {
        setAccounts(prev => prev.map(a => a.id === updated.id ? {...a, 
            name: updated.name, 
            type: updated.type,
            interestRate: updated.type === AccountType.CreditCard ? updated.interestRate : undefined
        } : a));
    }
    const deleteAccount = (id: string) => {
        if(transactions.some(t => t.accountId === id || t.toAccountId === id)) {
            alert("Cannot delete an account with transactions. Please re-assign or delete its transactions first.");
            return;
        }
        if(recurringTransactions.some(r => r.accountId === id)) {
            alert("Cannot delete an account with recurring transactions. Please update or delete them first.");
            return;
        }
        if(investments.some(i => i.accountId === id)) {
            alert("Cannot delete an account with investments. Please move or delete its holdings first.");
            return;
        }
         if(bills.some(b => b.accountId === id)) {
            alert("Cannot delete an account with bills linked to it. Please update them first.");
            return;
        }
        if(loans.some(l => l.linkedAccountId === id)) {
            alert("Cannot delete an account linked to a loan. Please update the loan first.");
            return;
        }
        setAccounts(prev => prev.filter(a => a.id !== id));
    };

    useEffect(() => {
        if (!userId) return;
        const processRecurringTransactions = () => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            let hasChanges = false;
            let transactionsToAdd: Transaction[] = [];

            const updatedRecurring = recurringTransactions.map(r => {
                const updatedR = { ...r };
                let lastProcessed = new Date(updatedR.lastProcessedDate);
                const startDate = new Date(updatedR.startDate);

                const calculateNextDueDate = (from: Date, frequency: RecurringFrequency): Date => {
                    const next = new Date(from);
                    if (frequency === RecurringFrequency.Daily) next.setDate(next.getDate() + 1);
                    else if (frequency === RecurringFrequency.Weekly) next.setDate(next.getDate() + 7);
                    else if (frequency === RecurringFrequency.Monthly) next.setMonth(next.getMonth() + 1);
                    return next;
                };

                let nextDueDate = (lastProcessed < startDate) ? startDate : calculateNextDueDate(lastProcessed, updatedR.frequency);

                while (nextDueDate <= now) {
                    const newTransaction: Transaction = {
                        id: `recurring-${updatedR.id}-${nextDueDate.getTime()}`,
                        description: updatedR.description,
                        amount: updatedR.amount,
                        type: updatedR.type,
                        categoryId: updatedR.categoryId,
                        date: nextDueDate.toISOString(),
                        accountId: updatedR.accountId,
                    };
                    transactionsToAdd.push(newTransaction);
                    updatedR.lastProcessedDate = nextDueDate.toISOString().split('T')[0];
                    lastProcessed = nextDueDate;
                    nextDueDate = calculateNextDueDate(lastProcessed, updatedR.frequency);
                    hasChanges = true;
                }
                return updatedR;
            });
            
            if(hasChanges) {
                setTransactions(prev => [...transactionsToAdd, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setRecurringTransactions(updatedRecurring);
                // Batch update account balances
                const balanceUpdates: Record<string, number> = {};
                transactionsToAdd.forEach(t => {
                    const account = accounts.find(a => a.id === t.accountId);
                    if (account) {
                        const amountChange = t.type === TransactionType.Income 
                            ? t.amount 
                            : account.type === AccountType.CreditCard ? t.amount : -t.amount;
                        balanceUpdates[t.accountId] = (balanceUpdates[t.accountId] || 0) + amountChange;
                    }
                });

                setAccounts(prevAccounts => prevAccounts.map(acc => {
                    if (balanceUpdates[acc.id]) {
                        return { ...acc, balance: acc.balance + balanceUpdates[acc.id] };
                    }
                    return acc;
                }));
            }
        };

        if(accounts.length > 0) processRecurringTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);


    // Transaction Management
    const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>, isOpeningBalance = false) => {
        const newTransaction: Transaction = { ...transaction, id: generateId(), date: new Date().toISOString() };
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        if (isOpeningBalance) return;
        
        if (newTransaction.type === TransactionType.Transfer) {
            const fromAccount = accounts.find(a => a.id === newTransaction.accountId);
            const toAccount = accounts.find(a => a.id === newTransaction.toAccountId);
            if (fromAccount && toAccount) {
                // 'from' account is treated as an expense
                updateAccountBalance(fromAccount.id, newTransaction.amount, TransactionType.Expense, fromAccount.type, 'add');
                // 'to' account is treated as an income
                updateAccountBalance(toAccount.id, newTransaction.amount, TransactionType.Income, toAccount.type, 'add');
            }
        } else {
             const account = accounts.find(a => a.id === newTransaction.accountId);
            if(account) updateAccountBalance(newTransaction.accountId, newTransaction.amount, newTransaction.type, account.type, 'add');
        }
    };
    const addMultipleTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
        const transactionsToAdd: Transaction[] = newTransactions.map(t => ({
            ...t,
            id: `sync-${generateId()}`,
        }));
        setTransactions(prev => [...transactionsToAdd, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        // Batch update account balances
        const balanceUpdates: Record<string, number> = {};
        transactionsToAdd.forEach(t => {
            const account = accounts.find(a => a.id === t.accountId);
            if (account) {
                const amountChange = t.type === TransactionType.Income 
                    ? t.amount 
                    : account.type === AccountType.CreditCard ? t.amount : -t.amount;
                balanceUpdates[t.accountId] = (balanceUpdates[t.accountId] || 0) + amountChange;
            }
        });

        setAccounts(prevAccounts => prevAccounts.map(acc => {
            if (balanceUpdates[acc.id]) {
                return { ...acc, balance: acc.balance + balanceUpdates[acc.id] };
            }
            return acc;
        }));
    };
    const editTransaction = (updated: Transaction) => {
        const originalTransaction = transactions.find(t => t.id === updated.id);
        if (!originalTransaction) return;

        // --- 1. Revert the original transaction's impact ---
        if (originalTransaction.type === TransactionType.Transfer) {
            const fromAccount = accounts.find(a => a.id === originalTransaction.accountId);
            const toAccount = accounts.find(a => a.id === originalTransaction.toAccountId);
            if(fromAccount && toAccount) {
                // Reverse the 'from' account (which was an expense)
                updateAccountBalance(fromAccount.id, originalTransaction.amount, TransactionType.Expense, fromAccount.type, 'subtract');
                // Reverse the 'to' account (which was an income)
                updateAccountBalance(toAccount.id, originalTransaction.amount, TransactionType.Income, toAccount.type, 'subtract');
            }
        } else { // It was an Income or Expense
            const account = accounts.find(a => a.id === originalTransaction.accountId);
            if (account) {
                updateAccountBalance(originalTransaction.accountId, originalTransaction.amount, originalTransaction.type, account.type, 'subtract');
            }
        }

        // --- 2. Apply the updated transaction's impact ---
        if (updated.type === TransactionType.Transfer) {
            const fromAccount = accounts.find(a => a.id === updated.accountId);
            const toAccount = accounts.find(a => a.id === updated.toAccountId);
            if (fromAccount && toAccount) {
                 // 'from' account is treated as an expense
                updateAccountBalance(fromAccount.id, updated.amount, TransactionType.Expense, fromAccount.type, 'add');
                // 'to' account is treated as an income
                updateAccountBalance(toAccount.id, updated.amount, TransactionType.Income, toAccount.type, 'add');
            }
        } else { // It is an Income or Expense
            const account = accounts.find(a => a.id === updated.accountId);
            if (account) {
                updateAccountBalance(updated.accountId, updated.amount, updated.type, account.type, 'add');
            }
        }

        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    };
    const deleteTransaction = (id: string) => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;
        
        if (transactionToDelete.type === TransactionType.Transfer) {
            const fromAccount = accounts.find(a => a.id === transactionToDelete.accountId);
            const toAccount = accounts.find(a => a.id === transactionToDelete.toAccountId);
            if(fromAccount && toAccount) {
                // Reverse the 'from' account (which was an expense)
                updateAccountBalance(fromAccount.id, transactionToDelete.amount, TransactionType.Expense, fromAccount.type, 'subtract');
                // Reverse the 'to' account (which was an income)
                updateAccountBalance(toAccount.id, transactionToDelete.amount, TransactionType.Income, toAccount.type, 'subtract');
            }
        } else {
            const account = accounts.find(a => a.id === transactionToDelete.accountId);
            if (account) {
                updateAccountBalance(transactionToDelete.accountId, transactionToDelete.amount, transactionToDelete.type, account.type, 'subtract');
            }
        }
        
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    // Category Management
    const addCategory = (name: string) => {
        const newCategory: Category = { id: generateId(), name };
        setCategories(prev => [...prev, newCategory]);
    };
    const editCategory = (updated: Category) => setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    const deleteCategory = (id: string) => {
        if (id === 'cat-transfer' || id === 'cat-loan') {
            alert("Default categories cannot be deleted.");
            return;
        }
        const isUsedInTransactions = transactions.some(t => t.categoryId === id);
        const isUsedInBudgets = budgets.some(b => b.categoryId === id);
        const isUsedInRecurring = recurringTransactions.some(r => r.categoryId === id);
        const isUsedInBills = bills.some(b => b.categoryId === id);

        if (isUsedInTransactions || isUsedInBudgets || isUsedInRecurring || isUsedInBills) {
            alert("This category is in use by transactions, budgets, bills, or recurring payments and cannot be deleted.");
            return;
        }
        setCategories(prev => prev.filter(c => c.id !== id));
    };
    const getCategoryById = useCallback((id: string | null) => categories.find(c => c.id === id), [categories]);
    const getAccountById = useCallback((id: string | null) => accounts.find(a => a.id === id), [accounts]);


    // Recurring Transaction Management
    const addRecurringTransaction = (rec: Omit<RecurringTransaction, 'id' | 'lastProcessedDate'>) => {
        const startDate = new Date(rec.startDate);
        const lastProcessedDate = new Date(startDate);
        lastProcessedDate.setDate(lastProcessedDate.getDate() - 1);
        const newRec: RecurringTransaction = { ...rec, id: generateId(), lastProcessedDate: lastProcessedDate.toISOString().split('T')[0] };
        setRecurringTransactions(prev => [...prev, newRec]);
    };
    const editRecurringTransaction = (updated: RecurringTransaction) => setRecurringTransactions(prev => prev.map(r => r.id === updated.id ? updated : r));
    const deleteRecurringTransaction = (id: string) => setRecurringTransactions(prev => prev.filter(r => r.id !== id));

    // Budget Management
    const addBudget = (budget: Omit<Budget, 'id'>): boolean => {
        const isUpdating = budgets.some(b => b.categoryId === budget.categoryId);
        if (userPlan === 'free' && budgets.length >= budgetLimit && !isUpdating) {
            return false; // Signal failure to the UI
        }
        
        const existingIndex = budgets.findIndex(b => b.categoryId === budget.categoryId);
        if (existingIndex > -1) {
            setBudgets(prev => prev.map((b, i) => i === existingIndex ? { ...b, amount: budget.amount } : b));
        } else {
            setBudgets(prev => [...prev, { ...budget, id: generateId() }]);
        }
        return true; // Signal success
    };

    // Goal Management
    const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
        const newGoal: Goal = { ...goal, id: generateId(), currentAmount: 0 };
        setGoals(prev => [newGoal, ...prev]);
    };
    const editGoal = (updated: Goal) => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));
    const addContributionToGoal = (goalId: string, amount: number, fromAccountId: string) => {
        let goalName = '';
        const savingsCategoryId = categories.find(c => c.name.toLowerCase() === 'savings')?.id || null;
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                goalName = g.name;
                return { ...g, currentAmount: g.currentAmount + amount };
            }
            return g;
        }));
        if (goalName) addTransaction({ description: `Contribution to: ${goalName}`, amount, type: TransactionType.Expense, categoryId: savingsCategoryId, accountId: fromAccountId });
    };

    // Investment Management
    const addInvestment = (holding: Omit<InvestmentHolding, 'id'>) => {
        const newHolding: InvestmentHolding = { ...holding, id: generateId() };
        setInvestments(prev => [...prev, newHolding]);
    };
    const editInvestment = (updated: InvestmentHolding) => {
        setInvestments(prev => prev.map(i => i.id === updated.id ? updated : i));
    };
    const deleteInvestment = (id: string) => {
        setInvestments(prev => prev.filter(i => i.id !== id));
    };

    // Bill Management
    const addBill = (bill: Omit<Bill, 'id'>) => {
        const newBill: Bill = { ...bill, id: generateId() };
        setBills(prev => [...prev, newBill].sort((a,b) => a.dueDay - b.dueDay));
    };
    const editBill = (updated: Bill) => {
        setBills(prev => prev.map(b => b.id === updated.id ? updated : b).sort((a,b) => a.dueDay - b.dueDay));
    };
    const deleteBill = (id: string) => {
        setBills(prev => prev.filter(b => b.id !== id));
    };
    const markBillAsPaid = (billId: string, fromAccountId: string) => {
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;

        addTransaction({
            description: `Bill Payment: ${bill.name}`,
            amount: bill.amount,
            type: TransactionType.Expense,
            categoryId: bill.categoryId,
            accountId: fromAccountId,
        });

        setBills(prev => prev.map(b => 
            b.id === billId ? { ...b, lastPaidDate: new Date().toISOString().split('T')[0] } : b
        ));
    };

    // Loan Management
    const addLoan = (loan: Omit<Loan, 'id' | 'currentBalance'>) => {
        const newLoan: Loan = { ...loan, id: generateId(), currentBalance: loan.originalPrincipal };
        setLoans(prev => [...prev, newLoan]);
    };
    const editLoan = (updated: Loan) => {
        setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
    };
    const deleteLoan = (id: string) => {
        if (transactions.some(t => t.description.includes(`Payment for loan ${id}`))) {
            alert("Cannot delete a loan with associated payment transactions. Please delete them first.");
            return;
        }
        setLoans(prev => prev.filter(l => l.id !== id));
    };
    const makeLoanPayment = (loanId: string, paymentAmount: number, fromAccountId: string) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;

        const monthlyRate = (loan.interestRate / 100) / 12;
        const interestPaid = loan.currentBalance * monthlyRate;
        const principalPaid = paymentAmount - interestPaid;
        const newBalance = loan.currentBalance - principalPaid;
        
        const loanPaymentCategoryId = categories.find(c => c.name === 'Loan Payment')?.id || 'cat-loan';

        addTransaction({
            description: `Payment for ${loan.name}`,
            amount: paymentAmount,
            type: TransactionType.Expense,
            categoryId: loanPaymentCategoryId,
            accountId: fromAccountId,
        });

        setLoans(prev => prev.map(l => 
            l.id === loanId ? { ...l, currentBalance: newBalance } : l
        ));
    };


    // Data Selectors & Memoization
    const mockPrices = useMemo(() => {
        const uniqueTickers = [...new Set(investments.map(i => i.ticker))];
        const prices: Record<string, number> = {};
        uniqueTickers.forEach(ticker => {
            const basePrice = (ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 300) + 50;
            prices[ticker] = basePrice * (1 + (Math.random() - 0.5) * 0.1);
        });
        return prices;
    }, [investments]);

    const portfolioData = useMemo(() => {
        let totalValue = 0;
        let totalCost = 0;
        const holdingsWithValue = investments.map(h => {
            const currentPrice = mockPrices[h.ticker] || h.avgCost;
            const currentValue = h.quantity * currentPrice;
            const totalCostBasis = h.quantity * h.avgCost;
            const gainLoss = currentValue - totalCostBasis;
            totalValue += currentValue;
            totalCost += totalCostBasis;
            return { ...h, currentPrice, currentValue, gainLoss };
        });
        const totalGainLoss = totalValue - totalCost;
        return {
            holdings: holdingsWithValue,
            totalValue,
            totalGainLoss,
        };
    }, [investments, mockPrices]);
    
    const summary = useMemo(() => {
        const totalIncome = transactions.filter(t => t.type === TransactionType.Income).reduce((s, t) => s + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === TransactionType.Expense).reduce((s, t) => s + t.amount, 0);
        
        const assetBalance = accounts
            .filter(acc => acc.type !== AccountType.Investment && acc.type !== AccountType.CreditCard)
            .reduce((total, acc) => total + acc.balance, 0);
        
        const creditCardDebt = accounts
            .filter(acc => acc.type === AccountType.CreditCard)
            .reduce((total, acc) => total + acc.balance, 0);

        const loanDebt = loans.reduce((total, loan) => total + loan.currentBalance, 0);
            
        const netWorth = assetBalance + portfolioData.totalValue - creditCardDebt - loanDebt;
        
        return { totalIncome, totalExpenses, netWorth, loanDebt };
    }, [transactions, accounts, portfolioData.totalValue, loans]);

    const expensesByCategory = useMemo(() => {
        const categoryMap: { [key: string]: number } = {};
        transactions.filter(t => t.type === TransactionType.Expense && t.categoryId).forEach(t => {
            if (t.categoryId) {
                const categoryName = getCategoryById(t.categoryId)?.name || 'Uncategorized';
                categoryMap[categoryName] = (categoryMap[categoryName] || 0) + t.amount;
            }
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [transactions, getCategoryById]);

    const getSpentAmountForCategory = useCallback((categoryId: string) => {
        return transactions.filter(t => t.type === TransactionType.Expense && t.categoryId === categoryId).reduce((s, t) => s + t.amount, 0);
    }, [transactions]);

    const monthlySummary = useMemo(() => {
        const data: { [key: string]: { month: string; income: number; expenses: number } } = {};
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!data[month]) data[month] = { month, income: 0, expenses: 0 };
            if (t.type === TransactionType.Income) data[month].income += t.amount;
            else if (t.type === TransactionType.Expense) data[month].expenses += t.amount;
        });
        return Object.values(data).slice(-12);
    }, [transactions]);
    
    const financialHealth = useMemo((): FinancialHealthSummary => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentTransactions = transactions.filter(t => new Date(t.date) > threeMonthsAgo);
        const income = recentTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) / 3;
        const expenses = recentTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0) / 3;

        // 1. Savings Rate (Weight: 30%)
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        let savingsRateScore = 0;
        if (savingsRate >= 20) savingsRateScore = 30;
        else if (savingsRate >= 10) savingsRateScore = 20;
        else if (savingsRate >= 0) savingsRateScore = 10;

        // 2. Debt-to-Income Ratio (Weight: 25%)
        const monthlyLoanPayments = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
        const creditCardDebt = accounts.filter(a => a.type === 'Credit Card').reduce((sum, a) => sum + a.balance, 0);
        const creditCardMinPayment = creditCardDebt * 0.02; // Assuming 2% minimum
        const totalMonthlyDebt = monthlyLoanPayments + creditCardMinPayment;
        const dti = income > 0 ? (totalMonthlyDebt / income) * 100 : 100;
        let dtiScore = 0;
        if (dti <= 15) dtiScore = 25;
        else if (dti <= 30) dtiScore = 15;
        else if (dti <= 43) dtiScore = 5;

        // 3. Emergency Fund (Weight: 25%)
        const liquidAssets = accounts.filter(a => a.type === 'Checking' || a.type === 'Savings').reduce((sum, a) => sum + a.balance, 0);
        const emergencyFundMonths = expenses > 0 ? liquidAssets / expenses : 0;
        let emergencyFundScore = 0;
        if (emergencyFundMonths >= 6) emergencyFundScore = 25;
        else if (emergencyFundMonths >= 3) emergencyFundScore = 15;
        else if (emergencyFundMonths >= 1) emergencyFundScore = 5;

        // 4. Budget Adherence (Weight: 10%)
        let budgetAdherenceScore = 10;
        if (budgets.length > 0) {
            const adherenceRatios = budgets.map(b => {
                const spent = getSpentAmountForCategory(b.categoryId);
                return b.amount > 0 ? spent / b.amount : 1;
            });
            const avgAdherence = adherenceRatios.reduce((sum, r) => sum + r, 0) / adherenceRatios.length;
            if (avgAdherence > 1.2) budgetAdherenceScore = 0;
            else if (avgAdherence > 1.05) budgetAdherenceScore = 5;
        }

        // 5. Credit Card Burden (Weight: 10%)
        let creditCardBurdenScore = 10;
        if(liquidAssets > 0 && creditCardDebt > 0){
            const burdenRatio = creditCardDebt / liquidAssets;
            if (burdenRatio > 0.5) creditCardBurdenScore = 0;
            else if(burdenRatio > 0.2) creditCardBurdenScore = 5;
        } else if (creditCardDebt > 0) {
            creditCardBurdenScore = 0;
        }
        
        return {
            overallScore: savingsRateScore + dtiScore + emergencyFundScore + budgetAdherenceScore + creditCardBurdenScore,
            metrics: {
                savingsRate: { value: savingsRate, score: savingsRateScore },
                debtToIncomeRatio: { value: dti, score: dtiScore },
                emergencyFund: { value: emergencyFundMonths, score: emergencyFundScore },
                budgetAdherence: { value: 0, score: budgetAdherenceScore },
                creditCardBurden: { value: liquidAssets > 0 ? (creditCardDebt/liquidAssets) * 100 : 0, score: creditCardBurdenScore },
            }
        };

    }, [transactions, accounts, loans, budgets, getSpentAmountForCategory]);

    const netWorthData = useMemo(() => {
        if (monthlySummary.length === 0) return [];
        let cumulativeBalance = 0;
        return monthlySummary.map(s => {
            cumulativeBalance += s.income - s.expenses;
            return { month: s.month, balance: cumulativeBalance };
        });
    }, [monthlySummary]);

    return {
        accounts, transactions, categories, budgets, recurringTransactions, goals, investments, bills, loans,
        addAccount, editAccount, deleteAccount, getAccountById,
        addTransaction, editTransaction, deleteTransaction, addMultipleTransactions,
        addCategory, editCategory, deleteCategory, getCategoryById,
        addBudget, 
        addRecurringTransaction, editRecurringTransaction, deleteRecurringTransaction, 
        addGoal, editGoal, deleteGoal, addContributionToGoal, 
        addInvestment, editInvestment, deleteInvestment,
        addBill, editBill, deleteBill, markBillAsPaid,
        addLoan, editLoan, deleteLoan, makeLoanPayment,
        summary, expensesByCategory, getSpentAmountForCategory, monthlySummary, netWorthData, portfolioData,
        financialHealth,
        budgetLimit, resetData
    };
};

export type UseFinanceReturn = ReturnType<typeof useFinance>;