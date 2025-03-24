// /utils/csvParser.ts

import { BudgetEntry, ParsedCsvData } from "@/types/types";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const parseCsvContent = (text: string): ParsedCsvData => {
  const rows = text.split("\n").map((row) => row.split(";"));
  if (rows.length < 2) return { income: [], expenses: [], disposableIncome: [] };

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const income: BudgetEntry[] = [];
  const expenses: BudgetEntry[] = [];

  for (const row of dataRows) {
    if (row.length < headers.length) continue;

    const entry: Record<string, any> = {};
    headers.forEach((header, index) => {
      entry[header] = row[index]?.trim();
    });

    const category = entry["Hovedkategori"] || "Unknown";
    const amount = parseAmount(entry["Beløb"]);
    if (isNaN(amount)) continue;

    const transactionDate = new Date((entry["Dato"] || "").split(".").reverse().join("-"));
    const month = transactionDate.toLocaleString("en-US", { month: "long" });

    const targetArray = amount >= 0 ? income : expenses;
    let existing = targetArray.find((i) => i.category === category);
    if (!existing) {
      existing = { category };
      targetArray.push(existing);
    }
    existing[month] = (existing[month] || 0) as number + amount;
  }

  addTotals(income);
  addTotals(expenses);

  const disposable: BudgetEntry = { category: "Disposable Income" };
  months.forEach((m) => {
    const incomeSum = income.reduce((s, e) => s + Number(e[m] || 0), 0);
    const expenseSum = expenses.reduce((s, e) => s + Number(e[m] || 0), 0);    
    disposable[m] = incomeSum + expenseSum;
  });
  addTotals([disposable]);

  const incomeTotal: BudgetEntry = { category: "Total Income" };
  const expenseTotal: BudgetEntry = { category: "Total Expenses" };
  months.forEach((m) => {
    incomeTotal[m] = income.reduce((sum, r) => sum + Number(r[m] || 0), 0);
    expenseTotal[m] = expenses.reduce((sum, r) => sum + Number(r[m] || 0), 0);    
  });
  addTotals([incomeTotal]);
  addTotals([expenseTotal]);
  income.push(incomeTotal);
  expenses.push(expenseTotal);

  return {
    income,
    expenses,
    disposableIncome: [disposable],
  };
};

const parseAmount = (raw: string): number => {
  if (!raw) return 0;
  return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
};

const addTotals = (entries: BudgetEntry[]) => {
  entries.forEach((entry) => {
    const total = months.reduce((sum, m) => sum + Number(entry[m] || 0), 0);
    entry["Total"] = parseFloat(total.toFixed(2));
    entry["Average"] = parseFloat((total / 12).toFixed(2));
  });
};
