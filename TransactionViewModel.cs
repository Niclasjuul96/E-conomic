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
        public ObservableCollection<Income> IncomeData { get; set; }
        public ObservableCollection<Expense> ExpenseData { get; set; }

        public TransactionViewModel()
        {
            IncomeData = new ObservableCollection<Income>();
            ExpenseData = new ObservableCollection<Expense>();
        }

        public void LoadCsvData(string filePath)
        {
            if (!File.Exists(filePath)) return;

            var incomeDict = new Dictionary<string, Income>();
            var expenseDict = new Dictionary<string, Expense>();

            using (var reader = new StreamReader(filePath))
            {
                string headerLine = reader.ReadLine(); // Read headers
                if (headerLine == null) return;

                while (!reader.EndOfStream)
                {
                    string line = reader.ReadLine();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var values = line.Split(';'); // CSV uses semicolon as delimiter

                    if (values.Length < 9) continue; // Ensure there are enough columns

                    if (!DateTime.TryParseExact(values[0], "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime transactionDate))
                        continue;

                    string category = values[8]; // Correct "Kategori" column

                    string amountString = values[2].Replace(".", "").Replace(",", "."); // Convert Beløb
                    if (!decimal.TryParse(amountString, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal amount))
                        continue;

                    string month = transactionDate.ToString("MMMM", CultureInfo.InvariantCulture);

                    if (amount >= 0) // Income
                    {
                        if (!incomeDict.ContainsKey(category))
                            incomeDict[category] = new Income { Category = category };

                        typeof(Income).GetProperty(month)?.SetValue(incomeDict[category],
                            (decimal)typeof(Income).GetProperty(month)?.GetValue(incomeDict[category]) + amount);
                    }
                    else // Expense
                    {
                        if (!expenseDict.ContainsKey(category))
                            expenseDict[category] = new Expense { Category = category };

                        typeof(Expense).GetProperty(month)?.SetValue(expenseDict[category],
                            (decimal)typeof(Expense).GetProperty(month)?.GetValue(expenseDict[category]) + amount);
                    }
                }
            }

            // Update UI with parsed data
            IncomeData.Clear();
            ExpenseData.Clear();

            foreach (var income in incomeDict.Values) IncomeData.Add(income);
            foreach (var expense in expenseDict.Values) ExpenseData.Add(expense);

            OnPropertyChanged(nameof(IncomeData));
            OnPropertyChanged(nameof(ExpenseData));

            // Adjust column widths dynamically
            Application.Current.Dispatcher.Invoke(() =>
            {
                var mainWindow = Application.Current.MainWindow as MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.AdjustColumnWidths(mainWindow.IncomeDataGrid);
                    mainWindow.AdjustColumnWidths(mainWindow.ExpenseDataGrid);
                }
            });
        }

        public event PropertyChangedEventHandler PropertyChanged;
        public void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
