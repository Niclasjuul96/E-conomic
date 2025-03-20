using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;

namespace E_conomic
{
    public class TransactionViewModel : INotifyPropertyChanged
    {
        public ObservableCollection<Income> IncomeData { get; set; } = new ObservableCollection<Income>();
        public ObservableCollection<Expense> ExpenseData { get; set; } = new ObservableCollection<Expense>();
        public ObservableCollection<DisposableIncome> DisposableIncomeData { get; set; } = new ObservableCollection<DisposableIncome>();

        public void LoadCsvData(string filePath)
        {
            if (!File.Exists(filePath)) return;

            var incomeDict = new Dictionary<string, Income>();
            var expenseDict = new Dictionary<string, Expense>();

            using var reader = new StreamReader(filePath);
            if (reader.ReadLine() == null) return; // Read and skip header

            while (!reader.EndOfStream)
            {
                var values = reader.ReadLine()?.Split(';'); // CSV uses semicolon as delimiter
                if (values == null || values.Length < 9) continue; // Ensure there are enough columns

                if (!DateTime.TryParseExact(values[0], "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime transactionDate))
                    continue;

                string category = values[8]?.Trim(); // Ensure category name is stored correctly
                string month = transactionDate.ToString("MMMM", CultureInfo.InvariantCulture);

                if (!TryParseAmount(values[2], out decimal amount)) continue;

                if (amount >= 0) // Income
                    AddTransaction(incomeDict, category, month, amount, isIncome: true);
                else // Expense
                    AddTransaction(expenseDict, category, month, amount, isIncome: false);
            }

            // Update UI with parsed data
            RefreshData(incomeDict, expenseDict);
            CalculateDisposableIncome();
            CalculateTotalExpenses();

            // Adjust column widths dynamically for all grids
            AdjustColumnWidths();
        }

        /// <summary>
        /// Parses amount values, handling different decimal separators.
        /// </summary>
        private bool TryParseAmount(string amountString, out decimal amount)
        {
            amountString = amountString.Replace(".", "").Replace(",", ".");
            return decimal.TryParse(amountString, NumberStyles.Any, CultureInfo.InvariantCulture, out amount);
        }

        /// <summary>
        /// Adds a transaction amount to the specified dictionary.
        /// </summary>
        private void AddTransaction<T>(Dictionary<string, T> dict, string category, string month, decimal amount, bool isIncome) where T : new()
        {
            if (!dict.ContainsKey(category))
            {
                dict[category] = (T)Activator.CreateInstance(typeof(T));
                var categoryProperty = typeof(T).GetProperty("Category");
                categoryProperty?.SetValue(dict[category], category);
            }

            var property = typeof(T).GetProperty(month);
            if (property != null)
            {
                decimal currentValue = (decimal?)property.GetValue(dict[category]) ?? 0m;
                property.SetValue(dict[category], currentValue + amount);
            }
        }

        /// <summary>
        /// Refreshes the observable collections with the new parsed data.
        /// </summary>
        private void RefreshData(Dictionary<string, Income> incomeDict, Dictionary<string, Expense> expenseDict)
        {
            IncomeData.Clear();
            ExpenseData.Clear();

            foreach (var income in incomeDict.Values) IncomeData.Add(income);
            foreach (var expense in expenseDict.Values) ExpenseData.Add(expense);

            OnPropertyChanged(nameof(IncomeData));
            OnPropertyChanged(nameof(ExpenseData));
        }

        /// <summary>
        /// Calculates disposable income for each month and updates the UI.
        /// </summary>
        private void CalculateDisposableIncome()
        {
            var disposable = new DisposableIncome();

            foreach (var month in typeof(DisposableIncome).GetProperties().Where(p => p.PropertyType == typeof(decimal) && p.CanWrite))
            {
                decimal totalIncome = IncomeData.Sum(i => (decimal?)typeof(Income).GetProperty(month.Name)?.GetValue(i) ?? 0m);

                // Exclude "Opsparing" from Expense Calculation
                decimal totalExpense = ExpenseData
                    .Where(e => e.Category != "Opsparing")
                    .Sum(e => (decimal?)typeof(Expense).GetProperty(month.Name)?.GetValue(e) ?? 0m);

                month.SetValue(disposable, totalIncome + totalExpense);
            }

            // Update UI
            DisposableIncomeData.Clear();
            DisposableIncomeData.Add(disposable);
            OnPropertyChanged(nameof(DisposableIncomeData));
        }

        /// <summary>
        /// Adds a total expenses row to the ExpenseData collection.
        /// </summary>
        private void CalculateTotalExpenses()
        {
            var totalExpenseRow = new Expense { Category = "Total Expenses" };

            foreach (var month in typeof(Expense).GetProperties().Where(p => p.PropertyType == typeof(decimal) && p.CanWrite))
            {
                decimal totalExpense = ExpenseData.Sum(e => (decimal?)month.GetValue(e) ?? 0m);
                month.SetValue(totalExpenseRow, totalExpense);
            }

            ExpenseData.Add(totalExpenseRow);
        }

        /// <summary>
        /// Adjusts column widths dynamically for all DataGrids.
        /// </summary>
        private void AdjustColumnWidths()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                if (Application.Current.MainWindow is MainWindow mainWindow)
                {
                    mainWindow.AdjustColumnWidths(mainWindow.IncomeDataGrid);
                    mainWindow.AdjustColumnWidths(mainWindow.ExpenseDataGrid);
                    mainWindow.AdjustColumnWidths(mainWindow.DisposableIncomeDataGrid);
                }
            });
        }

        public event PropertyChangedEventHandler PropertyChanged;
        public void OnPropertyChanged(string propertyName) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
