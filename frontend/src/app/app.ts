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
   * Recalculate budget data when year is selected
   */
  onYearSelected(): void {
    console.log('[App] onYearSelected() called');
    console.log('[App] selectedYear value:', this.selectedYear, 'type:', typeof this.selectedYear);
    console.log('[App] allTransactions length:', this.allTransactions.length);

    if (!this.selectedYear) {
      console.warn('[App] selectedYear is falsy:', this.selectedYear);
      return;
    }

    if (this.allTransactions.length === 0) {
      console.warn('[App] No transactions to recalculate');
      return;
    }

    console.log('[App] Calling recalculateBudgetForYear with:', this.selectedYear);
    this.recalculateBudgetForYear(this.selectedYear);
  }

  /**
   * Recalculate budget tables for specific year
   */
  private recalculateBudgetForYear(year: number | string): void {
    try {
      const yearNum = typeof year === 'string' ? parseInt(year) : year;
      console.log(`[App] recalculateBudgetForYear: converting year ${year} (${typeof year}) to number: ${yearNum}`);

      const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const income: BudgetRow[] = [];
      const expenses: BudgetRow[] = [];

      // Filter and aggregate transactions for this year
      const yearTransactions = this.allTransactions.filter((t) => {
        const dateArray = t.date.split('.');
        const txYear = parseInt(dateArray[2] || '0');
        return txYear === yearNum;
      });

      console.log(`[App] Year ${yearNum}: found ${yearTransactions.length} transactions (from ${this.allTransactions.length} total)`);
      if (yearTransactions.length > 0) {
        console.log('[App] Sample transactions:', yearTransactions.slice(0, 3).map(t => ({
          date: t.date,
          month: t.month,
          amount: t.amount,
          category: t.mainCategory
        })));
      }

      for (const transaction of yearTransactions) {
        const amount = transaction.amount;
        const category = transaction.mainCategory || 'Unknown';
        const month = transaction.month || 'Unknown';

        const targetArray = amount >= 0 ? income : expenses;
        let existing = targetArray.find((i) => i.category === category);

        if (!existing) {
          const newEntry: BudgetRow = { category };
          MONTH_NAMES.forEach((m) => (newEntry[m] = 0));
          targetArray.push(newEntry);
          existing = newEntry;
        }

        existing[month] = Number(existing[month] || 0) + Number(amount);
      }

      // Add totals
      this.addTotalsAndAverages(income);
      this.addTotalsAndAverages(expenses);

      // Calculate disposable for this year
      const disposable: BudgetRow = { category: 'Disposable Income' };
      MONTH_NAMES.forEach((month) => {
        const totalIncome = income.reduce((sum, row) => sum + Number(row[month] || 0), 0);
        const totalExpenses = expenses.reduce((sum, row) => sum + Number(row[month] || 0), 0);
        disposable[month] = totalIncome + totalExpenses;
      });
      this.addTotalsAndAverages([disposable]);

      // Update budget data
      this.incomeData = income;
      this.expenseData = expenses;
      this.disposableIncomeData = [disposable];

      console.log(`[App] Budget updated for year ${yearNum}:`, {
        incomeCategories: income.length,
        expenseCategories: expenses.length,
        hasDisposable: !!disposable
      });

      this.cdr.markForCheck();
      console.log(`[App] Change detection triggered`);
    } catch (error) {
      console.error(`[App] ERROR in recalculateBudgetForYear:`, error);
      // Reset to empty data on error
      this.incomeData = [];
      this.expenseData = [];
      this.disposableIncomeData = [];
      this.cdr.markForCheck();
    }
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

      // Recalculate budget for selected year
      if (this.selectedYear) {
        console.log('[App] Recalculating budget for year:', this.selectedYear);
        this.onYearSelected();
      }
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
    this.availableYears = Array.from(years).sort().reverse();
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

    // Recalculate budget for selected year (programmatic selection doesn't trigger (change) event)
    console.log('[App] CSV parsed. Recalculating budget for selected year:', this.selectedYear);
    this.onYearSelected();
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
    if (!this.selectedYear) return [];
    const yearNum = typeof this.selectedYear === 'string' ? parseInt(this.selectedYear) : this.selectedYear;
    return this.allTransactions.filter(
      (t) => new Date(t.date.split('.').reverse().join('-')).getFullYear() === yearNum
    );
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
