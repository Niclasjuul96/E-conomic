import { Component } from '@angular/core';
import { CsvUpload } from './components/csv-upload/csv-upload';
import { BudgetTable } from './components/budget-table/budget-table';
import { TransactionDetails } from './components/transaction-details/transaction-details';
import { ParsedCsvData, BudgetRow, TransactionDetail } from './models/types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CsvUpload, BudgetTable, TransactionDetails, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  allTransactions: TransactionDetail[] = [];
  incomeData: BudgetRow[] = [];
  expenseData: BudgetRow[] = [];
  disposableIncomeData: BudgetRow[] = [];

  availableYears: number[] = [];
  selectedYear: number | null = null;

  selectedDetails: {
    category: string;
    month: string;
    source: 'income' | 'expense' | 'disposable';
  } | null = null;

  handleCsvParsed(parsed: ParsedCsvData) {
    this.allTransactions = parsed.transactions;
    this.availableYears = parsed.years;
    this.selectedYear = parsed.years.at(-1) ?? null;

    this.incomeData = parsed.income;
    this.expenseData = parsed.expenses;
    this.disposableIncomeData = parsed.disposableIncome;
  }

  get filteredTransactions(): TransactionDetail[] {
    return this.selectedYear
      ? this.allTransactions.filter(
          (t) => new Date(t.date.split('.').reverse().join('-')).getFullYear() === this.selectedYear
        )
      : [];
  }

  onCellClick(details: { category: string; month: string; source: 'income' | 'expense' | 'disposable' }) {
    this.selectedDetails = details;
  }

  onCloseDetails() {
    this.selectedDetails = null;
  }
}
