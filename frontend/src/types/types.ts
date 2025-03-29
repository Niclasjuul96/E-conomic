export interface BudgetEntry {
    category: string;
    [key: string]: string | number | undefined;
  }

export interface TransactionDetail {
    date: string;
    title: string;
    amount: number;
    category: string;
    month: string;
}

export interface ParsedCsvData {
    income: BudgetEntry[];
    expenses: BudgetEntry[];
    disposableIncome: BudgetEntry[];
    transactions: TransactionDetail[];
    years: number[];
}

export interface BudgetRow {
    category: string;
    [key: string]: string | number | undefined;
}

export interface BudgetTableProps {
    incomeData: BudgetRow[];
    expenseData: BudgetRow[];
    disposableIncomeData: BudgetRow[];
    onCellClick?: (category: string, month: string) => void;
  }  
  
  