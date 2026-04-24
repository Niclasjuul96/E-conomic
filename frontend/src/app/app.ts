import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CsvUpload } from './components/csv-upload/csv-upload';
import { BudgetTable } from './components/budget-table/budget-table';
import { TransactionDetails } from './components/transaction-details/transaction-details';
import { SheetSelector } from './components/sheet-selector/sheet-selector';
import { ParsedCsvData, BudgetRow, TransactionDetail } from './models/types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from './services/google-auth.service';
import { GoogleSheetsService } from './services/google-sheets.service';
import { CsvParserService } from './services/csv-parser.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CsvUpload, BudgetTable, TransactionDetails, SheetSelector, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  authService = inject(GoogleAuthService);
  sheetsService = inject(GoogleSheetsService);
  csvParser = inject(CsvParserService);
  cdr = inject(ChangeDetectorRef);

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

  // Observable properties for template
  isAuthenticated$ = this.authService.isAuthenticated;
  userName$ = this.authService.userName;
  userPicture$ = this.authService.userPicture;
  syncStatus$ = new BehaviorSubject<'idle' | 'syncing' | 'success' | 'error'>('idle');

  ngOnInit(): void {
    // Load transactions when user is authenticated
    this.authService.isAuthenticated.subscribe(async (isAuthenticated) => {
      if (isAuthenticated) {
        try {
          await this.loadInitialData();
        } catch (error) {
          console.error('Failed to load initial data:', error);
        }
      }
    });

    // Reload transactions when sheet is changed
    this.sheetsService.sheetIdChanged.subscribe(async (sheetId) => {
      if (sheetId) {
        try {
          await this.loadInitialData();
        } catch (error) {
          console.error('Failed to load data after sheet change:', error);
        }
      }
    });
  }

  /**
   * Load initial transactions from Google Sheets on app startup
   */
  private async loadInitialData(): Promise<void> {
    try {
      const sheetId = this.sheetsService.getSheetId();
      
      if (!sheetId) {
        console.log('[App] No sheet ID found. User will need to import CSV first.');
        return;
      }

      // Ensure headers exist before loading transactions
      console.log('[App] Ensuring headers exist in sheet...');
      await this.sheetsService.ensureHeaders(sheetId);

      // Load transactions from Google Sheets
      console.log('[App] Loading transactions from sheet:', sheetId);
      const loadedTransactions = await this.sheetsService.loadTransactions(sheetId);
      console.log('[App] Loaded', loadedTransactions.length, 'transactions');
      
      if (loadedTransactions.length > 0) {
        // Merge with current transactions
        this.allTransactions = this.mergeTransactions(this.allTransactions, loadedTransactions);
        console.log('[App] Merged transactions, total:', this.allTransactions.length);
        
        // Re-aggregate data
        this.aggregateTransactions();
      } else {
        // Even if no transactions, reset UI data
        console.log('[App] No transactions found, resetting UI');
        this.allTransactions = [];
        this.incomeData = [];
        this.expenseData = [];
        this.disposableIncomeData = [];
        this.availableYears = [];
        this.selectedYear = null;
      }
      
      // Force Angular to detect changes
      this.cdr.markForCheck();
      console.log('[App] Change detection triggered');
    } catch (error) {
      console.error('[App] Error loading initial data:', error);
    }
  }

  /**
   * Merge transactions, avoiding duplicates by timestamp
   */
  private mergeTransactions(
    current: TransactionDetail[],
    loaded: TransactionDetail[]
  ): TransactionDetail[] {
    // Combine without duplicates
    // Since we're just loading from scratch, just return loaded transactions
    return loaded;
  }

  /**
   * Re-aggregate transactions directly (without re-parsing numbers)
   * This avoids the double-parsing bug when reloading from Google Sheets
   */
  private aggregateTransactions(): void {
    if (this.allTransactions.length === 0) return;

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const income: BudgetRow[] = [];
    const expenses: BudgetRow[] = [];
    const years = new Set<number>();

    // Direct aggregation without re-parsing
    for (const transaction of this.allTransactions) {
      const amount = transaction.amount; // Already a number, don't re-parse!
      const category = transaction.mainCategory || 'Unknown';
      const month = transaction.month || 'Unknown';
      
      // Extract year from date string (format: DD.MM.YYYY)
      const dateArray = transaction.date.split('.');
      const year = parseInt(dateArray[2] || '0');
      if (year > 0) years.add(year);

      // Find or create category entry
      const targetArray = amount >= 0 ? income : expenses;
      let existing = targetArray.find((i) => i.category === category);

      if (!existing) {
        const newEntry: BudgetRow = { category };
        MONTH_NAMES.forEach((m) => (newEntry[m] = 0));
        targetArray.push(newEntry);
        existing = newEntry;
      }

      // Add amount to month (convert to number to ensure it's numeric)
      existing[month] = Number(existing[month] || 0) + Number(amount);
    }

    // Add totals and averages
    this.addTotalsAndAverages(income);
    this.addTotalsAndAverages(expenses);

    // Calculate disposable income
    const disposable: BudgetRow = { category: 'Disposable Income' };
    const MONTH_NAMES_CONST = MONTH_NAMES;
    MONTH_NAMES_CONST.forEach((month) => {
      const totalIncome = income.reduce((sum, row) => sum + Number(row[month] || 0), 0);
      const totalExpenses = expenses.reduce((sum, row) => sum + Number(row[month] || 0), 0);
      disposable[month] = totalIncome + totalExpenses;
    });
    this.addTotalsAndAverages([disposable]);

    // Add total rows
    const totalIncome: BudgetRow = { category: 'Total Income' };
    MONTH_NAMES_CONST.forEach((month) => {
      totalIncome[month] = income.reduce((sum, row) => sum + Number(row[month] || 0), 0);
    });
    this.addTotalsAndAverages([totalIncome]);
    income.push(totalIncome);

    const totalExpenses: BudgetRow = { category: 'Total Expenses' };
    MONTH_NAMES_CONST.forEach((month) => {
      totalExpenses[month] = expenses.reduce((sum, row) => sum + Number(row[month] || 0), 0);
    });
    this.addTotalsAndAverages([totalExpenses]);
    expenses.push(totalExpenses);

    this.incomeData = income;
    this.expenseData = expenses;
    this.disposableIncomeData = [disposable];
    this.availableYears = Array.from(years).sort();
    this.selectedYear = this.availableYears.at(-1) ?? null;
    
    // Force change detection after aggregation
    this.cdr.markForCheck();
    console.log('[App] Aggregation complete. Years:', this.availableYears, 'Selected:', this.selectedYear);
  }

  /**
   * Add totals and averages to budget rows
   */
  private addTotalsAndAverages(entries: BudgetRow[]): void {
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    entries.forEach((entry) => {
      const total = MONTH_NAMES.reduce((sum, m) => sum + Number(entry[m] || 0), 0);
      entry['Total'] = parseFloat(total.toFixed(2));
      entry['Average'] = parseFloat((total / 12).toFixed(2));
    });
  }

  /**
   * Handle CSV parse completion
   */
  handleCsvParsed(parsed: ParsedCsvData) {
    // Merge loaded transactions with newly parsed ones
    this.allTransactions = this.mergeTransactions(this.allTransactions, parsed.transactions);
    
    // Update aggregated data
    this.availableYears = parsed.years;
    this.selectedYear = parsed.years.at(-1) ?? null;
    this.incomeData = parsed.income;
    this.expenseData = parsed.expenses;
    this.disposableIncomeData = parsed.disposableIncome;
    
    // Force change detection
    this.cdr.markForCheck();
  }

  /**
   * Sync transactions to Google Sheets
   */
  syncTransactionsToSheet(transactions: TransactionDetail[]): void {
    console.log('[App] syncTransactionsToSheet called with', transactions.length, 'transactions');
    
    // Check authentication synchronously
    const isAuth = this.authService.isCurrentlyAuthenticated();
    console.log('[App] Authentication check:', isAuth);
    
    if (!isAuth) {
      console.warn('[App] User not authenticated. Skipping sync.');
      return;
    }

    this.syncStatus$.next('syncing');
    console.log('[App] Sync status set to: syncing');

    this.performSync(transactions);
  }

  /**
   * Perform the actual sync (separate method to avoid async issues)
   */
  private async performSync(transactions: TransactionDetail[]): Promise<void> {
    try {
      let sheetId = this.sheetsService.getSheetId();
      console.log('[App] Current sheet ID:', sheetId);

      // If no sheet exists, create one
      if (!sheetId) {
        console.log('[App] No sheet ID found. Creating new sheet for user...');
        sheetId = await this.sheetsService.initializeSheet();
        console.log('[App] New sheet created:', sheetId);
      }

      // Append transactions to sheet
      console.log('[App] Appending', transactions.length, 'transactions to sheet', sheetId);
      await this.sheetsService.appendTransactions(transactions, sheetId);
      
      // Create year sheets with budget tables
      console.log('[App] Creating year sheets with budget tables...');
      try {
        await this.sheetsService.addYearSheets(
          sheetId,
          this.allTransactions,
          this.incomeData,
          this.expenseData,
          this.disposableIncomeData
        );
        console.log('[App] ✓ Year sheets created successfully');
      } catch (error) {
        console.warn('[App] Warning: Could not create year sheets:', error);
        // Don't fail the entire sync if year sheets fail
      }
      
      this.syncStatus$.next('success');
      console.log('[App] Sync status set to: success');
      
      // Force change detection after sync
      this.cdr.markForCheck();
      
      // Reset status after 3 seconds
      setTimeout(() => {
        if (this.syncStatus$.value === 'success') {
          this.syncStatus$.next('idle');
        }
      }, 3000);

      console.log('[App] ✓ Transactions synced to Google Sheets');
    } catch (error) {
      console.error('[App] ✗ Failed to sync transactions:', error);
      this.syncStatus$.next('error');
      this.cdr.markForCheck();
    }
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

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
