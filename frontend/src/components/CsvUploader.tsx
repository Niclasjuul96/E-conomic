"use client";

import { useState } from "react";

interface CsvUploaderProps {
  onDataParsed: (data: {
    income: Record<string, any>[];
    expenses: Record<string, any>[];
    disposableIncome: Record<string, any>[];
  }) => void;
}

export default function CsvUploader({ onDataParsed }: CsvUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      parseCsv(file);
    }
  };

  const parseCsv = async (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").map((row) => row.split(";"));

      if (rows.length < 2) return;

      const headers = rows[0].map(header => header.trim());
      const dataRows = rows.slice(1);

      const income: Record<string, any>[] = [];
      const expenses: Record<string, any>[] = [];

      for (const row of dataRows) {
        if (row.length < headers.length) continue;

        const entry: Record<string, any> = {};
        headers.forEach((header, index) => {
          entry[header] = row[index]?.trim();
        });

        const category = entry["Hovedkategori"] || "Unknown";
        let amountStr = entry["Beløb"] || "0";
        amountStr = amountStr.replace(/\./g, "").replace(",", ".");
        const amount = parseAmount(entry["Beløb"]);
        if (isNaN(amount)) continue;

        const dateString = entry["Dato"] || "";
        const transactionDate = new Date(dateString.split(".").reverse().join("-"));
        const month = transactionDate.toLocaleString("en-US", { month: "long" });

        if (!category) continue;

        const targetArray = amount >= 0 ? income : expenses;
        let existingEntry = targetArray.find((item) => item.category === category);

        if (!existingEntry) {
          existingEntry = { category };
          targetArray.push(existingEntry);
        }

        existingEntry[month] = (existingEntry[month] || 0) + amount;
      }

      // ✅ Calculate Total and Average for each entry
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const addTotalAndAverage = (entries: Record<string, any>[]) => {
        entries.forEach(entry => {
          const values = months.map(m => entry[m] || 0);
          const total = values.reduce((acc, val) => acc + val, 0);
          entry["Total"] = parseFloat(total).toFixed(2);
          entry["Average"] = parseFloat((total / 12).toFixed(2));

        });
      };
      

      addTotalAndAverage(income);
      addTotalAndAverage(expenses);

      // ✅ Disposable Income
      const disposableIncome: Record<string, any> = { category: "Disposable Income" };
      months.forEach((month) => {
        const totalIncome = income.reduce((sum, row) => sum + (row[month] || 0), 0);
        const totalExpenses = expenses.reduce((sum, row) => sum + (row[month] || 0), 0);
        disposableIncome[month] = totalIncome - totalExpenses;
      });

      const disposableValues = months.map(m => disposableIncome[m] || 0);
      disposableIncome["Total"] = disposableValues.reduce((a, b) => a + b, 0);
      disposableIncome["Average"] = disposableIncome["Total"] / months.length;

      onDataParsed({
        income,
        expenses,
        disposableIncome: [disposableIncome],
      });
    };

    reader.readAsText(file);
  };

  const parseAmount = (raw: string): number => {
    if (!raw) return 0;
    const cleaned = raw.replace(/\./g, "").replace(",", ".");
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  };

  return (
    <div className="flex flex-col items-center p-4">
      <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csvUpload" />
      <label htmlFor="csvUpload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Upload CSV
      </label>
      {selectedFile && <p className="mt-2 text-gray-700">File: {selectedFile.name}</p>}
    </div>
  );
}
