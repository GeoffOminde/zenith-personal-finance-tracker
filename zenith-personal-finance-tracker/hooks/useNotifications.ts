
import { useState, useMemo, useEffect } from 'react';
import { Notification, NotificationType, RecurringFrequency } from '../types';
import type { UseFinanceReturn } from './useFinance';

const generateId = () => crypto.randomUUID();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const useNotifications = (finance: UseFinanceReturn) => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const stored = localStorage.getItem('zenith_notifications');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('zenith_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const newNotifications: Notification[] = [];

        // 1. Budget Alerts
        finance.budgets.forEach(budget => {
            const expensesThisMonth = finance.transactions.filter(t => 
                t.categoryId === budget.categoryId &&
                t.type === 'Expense' &&
                new Date(t.date) >= startOfThisMonth
            );
            const spent = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0);
            
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            if (percentage >= 90) {
                const categoryName = finance.getCategoryById(budget.categoryId)?.name || 'A category';
                // Check if a similar notification for this budget was already created this month
                const existing = notifications.find(n =>
                    n.relatedId === budget.id &&
                    n.type === 'Budget' &&
                    new Date(n.date).getMonth() === now.getMonth() &&
                    new Date(n.date).getFullYear() === now.getFullYear()
                );
                if (!existing) {
                    newNotifications.push({
                        id: generateId(),
                        type: 'Budget',
                        message: `You've spent ${Math.round(percentage)}% of your '${categoryName}' budget for this month.`,
                        date: now.toISOString(),
                        isRead: false,
                        relatedId: budget.id
                    });
                }
            }
        });

        // 2. Goal Reached Alerts
        finance.goals.forEach(goal => {
            if (goal.currentAmount >= goal.targetAmount) {
                const existing = notifications.find(n => n.relatedId === goal.id && n.type === 'Goal');
                if (!existing) {
                    newNotifications.push({
                        id: generateId(),
                        type: 'Goal',
                        message: `Congratulations! You've reached your '${goal.name}' goal!`,
                        date: now.toISOString(),
                        isRead: false,
                        relatedId: goal.id
                    });
                }
            }
        });
        
        // 3. Upcoming Recurring Transaction Alerts
        finance.recurringTransactions.forEach(r => {
            const calculateNextDueDate = (from: Date, frequency: RecurringFrequency): Date => {
                const next = new Date(from);
                // Set to noon to avoid timezone issues with date changes
                next.setHours(12, 0, 0, 0);
                if (frequency === RecurringFrequency.Daily) next.setDate(next.getDate() + 1);
                else if (frequency === RecurringFrequency.Weekly) next.setDate(next.getDate() + 7);
                else if (frequency === RecurringFrequency.Monthly) next.setMonth(next.getMonth() + 1);
                return next;
            };

            const lastProcessed = new Date(r.lastProcessedDate);
            const startDate = new Date(r.startDate);
            let nextDueDate = (lastProcessed < startDate) ? startDate : calculateNextDueDate(lastProcessed, r.frequency);

            const daysUntilDue = (nextDueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

            if (daysUntilDue > -1 && daysUntilDue <= 3) { // Notify if due today or in the next 3 days
                // Unique identifier for this specific upcoming payment instance
                const uniquePaymentId = `${r.id}-${nextDueDate.toISOString().split('T')[0]}`;
                const existing = notifications.find(n => n.relatedId === uniquePaymentId);

                if (!existing) {
                    const days = Math.round(daysUntilDue);
                    const dueMessage = days === 0 ? "is due today" : `is due in ${days} day(s)`;
                    newNotifications.push({
                        id: generateId(),
                        type: 'Recurring',
                        message: `Your '${r.description}' payment of ${formatCurrency(r.amount)} ${dueMessage}.`,
                        date: now.toISOString(),
                        isRead: false,
                        relatedId: uniquePaymentId // Use unique ID for this instance
                    });
                }
            }
        });

        // 4. Bill Alerts
        finance.bills.forEach(bill => {
            const lastPaid = bill.lastPaidDate ? new Date(bill.lastPaidDate) : null;
            if (lastPaid && lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear()) {
                return; // Already paid this month
            }
            
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const dueDay = Math.min(bill.dueDay, daysInMonth);
            const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

            const uniqueBillId = `${bill.id}-${dueDate.toISOString().split('T')[0]}`;
            const existing = notifications.find(n => n.relatedId === uniqueBillId);
            if (existing) return;

            const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

            if (daysUntilDue < 0) { // Overdue
                 newNotifications.push({
                    id: generateId(),
                    type: 'Bill',
                    message: `Your '${bill.name}' bill was due on ${dueDate.toLocaleDateString()}.`,
                    date: now.toISOString(),
                    isRead: false,
                    relatedId: uniqueBillId
                });
            } else if (daysUntilDue <= 3) { // Upcoming
                const days = Math.round(daysUntilDue);
                const dueMessage = days === 0 ? "is due today" : `is due in ${days} day(s)`;
                 newNotifications.push({
                    id: generateId(),
                    type: 'Bill',
                    message: `Your '${bill.name}' bill of ${formatCurrency(bill.amount)} ${dueMessage}.`,
                    date: now.toISOString(),
                    isRead: false,
                    relatedId: uniqueBillId
                });
            }
        });

        // 5. Financial Health Alerts
        const { overallScore, metrics } = finance.financialHealth;
        if(overallScore < 50) {
            const existing = notifications.find(n => n.relatedId === 'health-score-low' && new Date(n.date).getMonth() === now.getMonth());
            if(!existing) {
                 newNotifications.push({
                    id: generateId(),
                    type: 'Health',
                    message: `Your financial health score is ${overallScore}. Check the report for tips on how to improve it.`,
                    date: now.toISOString(),
                    isRead: false,
                    relatedId: 'health-score-low'
                });
            }
        }


        if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finance.budgets, finance.goals, finance.recurringTransactions, finance.transactions, finance.bills, finance.loans, finance.financialHealth]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    
    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    return { notifications, unreadCount, markAsRead, markAllAsRead };
};

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
