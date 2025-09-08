import { BudgetEntry, ParsedCsvData, TransactionDetail } from "@/types/types";
import { defaultCsvStructure } from "@/constants/csvStructure";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const parseCsvContent = (text: string, structure = defaultCsvStructure): ParsedCsvData => {
  const rows = text.split("\n").map((row) => row.split(";"));
  if (rows.length < 2) return { income: [], expenses: [], disposableIncome: [], transactions: [], years: [] };

  const dataRows = rows.slice(1);
  const income: BudgetEntry[] = [];
  const expenses: BudgetEntry[] = [];
  const transactions: TransactionDetail[] = [];
  const years = new Set<number>();

  for (const row of dataRows) {
    if (row.length <= Math.max(
      structure.date,
      structure.amount,
      structure.title,
      structure.mainCategory,
      structure.subCategory
    )) continue;

    const rawDate = row[structure.date]?.trim() || "";
    const rawAmount = row[structure.amount]?.trim() || "";
    const title = row[structure.title]?.trim() || "No title";
    const mainCategory = row[structure.mainCategory]?.trim() || "Unknown";
    const subCategory = row[structure.subCategory]?.trim() || "Unknown";

    const amount = parseAmount(rawAmount);
    const date = new Date(rawDate.split(".").reverse().join("-"));
    if (isNaN(date.getTime())) continue;

    let monthDate = new Date(date);
    const year = monthDate.getFullYear();
    years.add(year);

    if (amount >= 0 && isLastWorkingDayOfMonth(date)) {
      monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    }

    const month = monthDate.toLocaleString("en-US", { month: "long" });

    transactions.push({
      date: rawDate,
      title,
      amount,
      mainCategory,
      subCategory,
      month,
    });

    const targetArray = amount >= 0 ? income : expenses;
    const categoryKey = mainCategory;

    let existing = targetArray.find((i) => i.category === categoryKey);
    if (!existing) {
      existing = { category: categoryKey };
      targetArray.push(existing);
    }
    existing[month] = Number(existing[month] || 0) + amount;
  }

  addTotals(income);
  addTotals(expenses);

  const disposable: BudgetEntry = { category: "Disposable Income" };
  months.forEach((month) => {
    const totalIncome = income.reduce((sum, row) => sum + Number(row[month] || 0), 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + Number(row[month] || 0), 0);
    disposable[month] = totalIncome + totalExpenses;
  });
  addTotals([disposable]);

  const totalIncome: BudgetEntry = { category: "Total Income" };
  months.forEach((month) => {
    totalIncome[month] = income.reduce((sum, row) => sum + Number(row[month] || 0), 0);
  });
  addTotals([totalIncome]);
  income.push(totalIncome);

  const totalExpenses: BudgetEntry = { category: "Total Expenses" };
  months.forEach((month) => {
    totalExpenses[month] = expenses.reduce((sum, row) => sum + Number(row[month] || 0), 0);
  });
  addTotals([totalExpenses]);
  expenses.push(totalExpenses);

  return {
    income,
    expenses,
    disposableIncome: [disposable],
    transactions,
    years: Array.from(years).sort(),
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

const isLastWorkingDayOfMonth = (date: Date): boolean => {
  const lastDay = getLastWorkingDay(date.getFullYear(), date.getMonth());
  return (
    date.getDate() === lastDay.getDate() &&
    date.getMonth() === lastDay.getMonth() &&
    date.getFullYear() === lastDay.getFullYear()
  );
};

const getLastWorkingDay = (year: number, month: number): Date => {
  let date = new Date(year, month + 1, 0);
  while (date.getDay() === 6 || date.getDay() === 0) {
    date.setDate(date.getDate() - 1);
  }
  return date;
};
