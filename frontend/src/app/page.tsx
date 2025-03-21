"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import BudgetTable from "@/components/BudgetTable";

export default function Home() {

  type Transaction = {
    category: string;
    [key: string]: string | number; 
  };

  const [incomeData, setIncomeData] = useState<Transaction[]>([]);
  const [expenseData, setExpenseData] = useState<Transaction[]>([]);
  const [disposableIncomeData, setDisposableIncomeData] = useState<Transaction[]>([]);

  return (
    <main className="flex flex-col items-start justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">E-conomic</h1>


      <CsvUploader
        onDataParsed={(parsedData) => {
          setIncomeData(parsedData.income as Transaction[]);
          setExpenseData(parsedData.expenses as Transaction[]);
          setDisposableIncomeData(parsedData.disposableIncome as Transaction[]);
        }}
      />

      <BudgetTable
        incomeData={incomeData}
        expenseData={expenseData}
        disposableIncomeData={disposableIncomeData}
      />
    </main>
  );
}
