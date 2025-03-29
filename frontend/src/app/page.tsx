"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import BudgetTable from "@/components/BudgetTable";
import TransactionDetails from "@/components/TransactionDetails";
import { TransactionDetail, BudgetRow } from "@/types/types";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Home() {
  const [allTransactions, setAllTransactions] = useState<TransactionDetail[]>([]);
  const [incomeData, setIncomeData] = useState<BudgetRow[]>([]);
  const [expenseData, setExpenseData] = useState<BudgetRow[]>([]);
  const [disposableIncomeData, setDisposableIncomeData] = useState<BudgetRow[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<{ category: string; month: string } | null>(null);

  const handleCsvParsed = (parsedData: any) => {
    setAllTransactions(parsedData.transactions);
    setAvailableYears(parsedData.years);
    setSelectedYear(parsedData.years.at(-1) || null); // default to latest year

    setIncomeData(parsedData.income);
    setExpenseData(parsedData.expenses);
    setDisposableIncomeData(parsedData.disposableIncome);
  };

  const filteredTransactions = selectedYear
    ? allTransactions.filter((t) => new Date(t.date.split(".").reverse().join("-")).getFullYear() === selectedYear)
    : [];

    const buildBudgetData = (
      transactions: TransactionDetail[],
      isIncome: boolean
    ): BudgetRow[] => {
      const map = new Map<string, BudgetRow>();
    
      transactions.forEach((t) => {
        if ((isIncome && t.amount >= 0) || (!isIncome && t.amount < 0)) {
          const category = t.category;
          if (!map.has(category)) {
            map.set(category, { category });
          }
          const row = map.get(category)!;
          row[t.month] = (Number(row[t.month]) || 0) + t.amount;
        }
      });
    
      const rows = Array.from(map.values());
    
      // Add Total and Average for each row
      rows.forEach((row) => {
        const total = months.reduce((sum, m) => sum + Number(row[m] || 0), 0);
        row.Total = parseFloat(total.toFixed(2));
        row.Average = parseFloat((total / 12).toFixed(2));
      });
    
      // Add Total row
      const totalRow: BudgetRow = {
        category: isIncome ? "Total Income" : "Total Expenses",
      };
      months.forEach((month) => {
        totalRow[month] = rows.reduce((sum, r) => sum + Number(r[month] || 0), 0);
      });
      const total = months.reduce((sum, m) => sum + Number(totalRow[m] || 0), 0);
      totalRow.Total = parseFloat(total.toFixed(2));
      totalRow.Average = parseFloat((total / 12).toFixed(2));
      rows.push(totalRow);
    
      return rows;
    };
    
    const buildDisposableIncome = (
      incomeRows: BudgetRow[],
      expenseRows: BudgetRow[]
    ): BudgetRow[] => {
      const row: BudgetRow = { category: "Disposable Income" };
      months.forEach((month) => {
        const incomeSum = incomeRows.reduce((sum, r) => sum + Number(r[month] || 0), 0);
        const expenseSum = expenseRows.reduce((sum, r) => sum + Number(r[month] || 0), 0);
        row[month] = incomeSum + expenseSum;
      });
      const total = months.reduce((sum, m) => sum + Number(row[m] || 0), 0);
      row.Total = parseFloat(total.toFixed(2));
      row.Average = parseFloat((total / 12).toFixed(2));
      return [row];
    };
    
    const filteredIncomeData = buildBudgetData(filteredTransactions, true);
    const filteredExpenseData = buildBudgetData(filteredTransactions, false);
    const filteredDisposableIncome = buildDisposableIncome(filteredIncomeData, filteredExpenseData);
    


  return (
    <main className="flex flex-col items-start justify-center min-h-screen p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">E-conomic</h1>

      <CsvUploader onDataParsed={handleCsvParsed} />

      {availableYears.length > 0 && (
        <div className="mt-4 mb-6">
          <label className="mr-2 font-semibold">Select Year:</label>
          <select
            value={selectedYear ?? ""}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-800 text-white border border-gray-600 px-2 py-1 rounded"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedYear && (
        <>
          <BudgetTable
            incomeData={filteredIncomeData}
            expenseData={filteredExpenseData}
            disposableIncomeData={filteredDisposableIncome}
            onCellClick={(category, month) => setSelectedDetails({ category, month })}
          />


          {selectedDetails && (
            <TransactionDetails
              selectedDetails={selectedDetails}
              transactions={filteredTransactions}
              onClose={() => setSelectedDetails(null)}
            />
          )}
        </>
      )}
    </main>
  );
}
