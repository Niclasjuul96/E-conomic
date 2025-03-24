export interface BudgetEntry {
    category: string;
    [key: string]: string | number | undefined;
  }
  
export interface ParsedCsvData {
    income: BudgetEntry[];
    expenses: BudgetEntry[];
    disposableIncome: BudgetEntry[];
}

export interface BudgetRow {
    category: string;
    [key: string]: string | number | undefined;
}

export interface BudgetTableProps {
    incomeData: BudgetRow[];
    expenseData: BudgetRow[];
    disposableIncomeData: BudgetRow[];
}
  
  