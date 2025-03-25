"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import BudgetTable from "@/components/BudgetTable";
import TransactionDetails from "@/components/TransactionDetails";
import { TransactionDetail } from "@/types/types";

export default function Home() {
  type Transaction = {
    category: string;
    [key: string]: string | number;
  };

  const [incomeData, setIncomeData] = useState<Transaction[]>([]);
  const [expenseData, setExpenseData] = useState<Transaction[]>([]);
  const [disposableIncomeData, setDisposableIncomeData] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<{ category: string; month: string } | null>(null);

  return (
    <main className="flex flex-col items-start justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">E-conomic</h1>

      <CsvUploader
        onDataParsed={(parsedData) => {
          setIncomeData(parsedData.income as Transaction[]);
          setExpenseData(parsedData.expenses as Transaction[]);
          setDisposableIncomeData(parsedData.disposableIncome as Transaction[]);
          setTransactions(parsedData.transactions);
        }}
      />

      <BudgetTable
        incomeData={incomeData}
        expenseData={expenseData}
        disposableIncomeData={disposableIncomeData}
        onCellClick={(category, month) => setSelectedDetails({ category, month })}
      />

      {/* ✅ Show transaction details if a cell was clicked */}
      {selectedDetails && (
        <TransactionDetails
          selectedDetails={selectedDetails}
          transactions={transactions}
          onClose={() => setSelectedDetails(null)}
        />
      )}
    </main>
  );
}
