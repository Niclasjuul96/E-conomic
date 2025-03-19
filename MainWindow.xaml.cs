using Microsoft.Win32;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace E_conomic
{
    public partial class MainWindow : Window
    {
        private TransactionViewModel ViewModel { get; set; }

        public MainWindow()
        {
            InitializeComponent();
            ViewModel = new TransactionViewModel();
            DataContext = ViewModel;

            // Ensure column width sync happens after UI is fully loaded
            this.Loaded += (s, e) => SynchronizeColumnWidths();
        }

        private void OnUploadButtonClick(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog
            {
                Filter = "CSV files (*.csv)|*.csv",
                Title = "Select a CSV File"
            };

            if (openFileDialog.ShowDialog() == true)
            {
                ViewModel.LoadCsvData(openFileDialog.FileName);    
            }

            
        }

        // ✅ New Method: Synchronize Column Widths Between Both DataGrids
        public void SynchronizeColumnWidths()
        {
            if (IncomeDataGrid == null || ExpenseDataGrid == null) return;
            if (IncomeDataGrid.Columns.Count == 0 || ExpenseDataGrid.Columns.Count == 0) return;

            for (int i = 0; i < Math.Min(IncomeDataGrid.Columns.Count, ExpenseDataGrid.Columns.Count); i++)
            {
                // Get the widest column between both grids
                double maxWidth = Math.Max(IncomeDataGrid.Columns[i].ActualWidth, ExpenseDataGrid.Columns[i].ActualWidth);

                // Set both columns to the widest width
                IncomeDataGrid.Columns[i].Width = new DataGridLength(maxWidth);
                ExpenseDataGrid.Columns[i].Width = new DataGridLength(maxWidth);
            }

            IncomeDataGrid.UpdateLayout();
            ExpenseDataGrid.UpdateLayout();
        }

        private void OnSettingsButtonClick(object sender, RoutedEventArgs e)
        {
            
        }

        public void AdjustColumnWidths(DataGrid dataGrid)
        {
            foreach (var column in dataGrid.Columns)
            {
                column.Width = DataGridLength.Auto; // Resize to fit content
                column.Width = new DataGridLength(1, DataGridLengthUnitType.Auto); // Ensure proper adjustment
            }
        }

        private void ExpenseDataGrid_LayoutUpdated(object sender, EventArgs e)
        {
            SynchronizeColumnWidths();
        }
    }
}
