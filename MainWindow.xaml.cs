using Microsoft.Win32;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace E_conomic
{
    public partial class MainWindow : Window
    {
        private readonly TransactionViewModel ViewModel;

        public MainWindow()
        {
            InitializeComponent();
            ViewModel = new TransactionViewModel();
            DataContext = ViewModel;

            // Ensure column width sync happens after UI is fully loaded
            Loaded += (_, _) => SynchronizeColumnWidths();
        }

        private void OnUploadButtonClick(object sender, RoutedEventArgs e)
        {
            var openFileDialog = new OpenFileDialog
            {
                Filter = "CSV files (*.csv)|*.csv",
                Title = "Select a CSV File"
            };

            if (openFileDialog.ShowDialog() == true)
            {
                ViewModel.LoadCsvData(openFileDialog.FileName);

                // Schedule column width synchronization after UI update
                Dispatcher.BeginInvoke(DispatcherPriority.Background, new Action(SynchronizeColumnWidths));
            }
        }

        /// <summary>
        /// Synchronizes column widths across all DataGrids.
        /// </summary>
        public void SynchronizeColumnWidths()
        {
            if (IncomeDataGrid == null || ExpenseDataGrid == null || DisposableIncomeDataGrid == null) return;
            if (IncomeDataGrid.Columns.Count == 0 || ExpenseDataGrid.Columns.Count == 0 || DisposableIncomeDataGrid.Columns.Count == 0) return;

            for (int i = 0; i < Math.Min(Math.Min(IncomeDataGrid.Columns.Count, ExpenseDataGrid.Columns.Count), DisposableIncomeDataGrid.Columns.Count); i++)
            {
                // Get the widest column across all three grids
                double maxWidth = Math.Max(
                    Math.Max(IncomeDataGrid.Columns[i].ActualWidth, ExpenseDataGrid.Columns[i].ActualWidth),
                    DisposableIncomeDataGrid.Columns[i].ActualWidth
                );

                // Validate the width before setting
                if (!double.IsNaN(maxWidth) && maxWidth > 0)
                {
                    IncomeDataGrid.Columns[i].Width = new DataGridLength(maxWidth);
                    ExpenseDataGrid.Columns[i].Width = new DataGridLength(maxWidth);
                    DisposableIncomeDataGrid.Columns[i].Width = new DataGridLength(maxWidth);
                }
            }

            IncomeDataGrid.UpdateLayout();
            ExpenseDataGrid.UpdateLayout();
            DisposableIncomeDataGrid.UpdateLayout();
        }



        private void OnSettingsButtonClick(object sender, RoutedEventArgs e)
        {
            // Placeholder for settings functionality
        }

        /// <summary>
        /// Adjusts column widths dynamically based on content.
        /// </summary>
        public void AdjustColumnWidths(DataGrid dataGrid)
        {
            foreach (var column in dataGrid.Columns)
            {
                column.Width = new DataGridLength(1, DataGridLengthUnitType.Auto);
            }
        }

        private void ExpenseDataGrid_LayoutUpdated(object sender, EventArgs e) => SynchronizeColumnWidths();
    }
}
