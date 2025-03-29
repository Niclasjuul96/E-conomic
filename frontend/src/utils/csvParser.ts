import { BudgetEntry, ParsedCsvData, TransactionDetail } from "@/types/types";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const parseCsvContent = (text: string): ParsedCsvData => {
  const rows = text.split("\n").map((row) => row.split(";"));
  if (rows.length < 2) return { income: [], expenses: [], disposableIncome: [], transactions: [] };

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const income: BudgetEntry[] = [];
  const expenses: BudgetEntry[] = [];
  const transactions: TransactionDetail[] = [];

  for (const row of dataRows) {
    if (row.length < headers.length) continue;

    const entry: Record<string, any> = {};
    headers.forEach((header, index) => {
      entry[header] = row[index]?.trim();
    });

    const title = row[1]?.trim() || "No title";
    const amount = parseAmount(row[2]);
    const dateStr = row[0]?.trim() || "";
    const date = new Date(dateStr.split(".").reverse().join("-"));
    if (isNaN(date.getTime())) continue;

    let monthDate = new Date(date); // Clone to avoid mutation
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();

    // Shift income on the last working day of the month to the next month
    if (amount >= 0 && isLastWorkingDayOfMonth(date)) {
      monthDate.setMonth(monthDate.getMonth() + 1);
    }

    const month = monthDate.toLocaleString("en-US", { month: "long" });
    const hovedkategori = row[7]?.trim() || "Unknown";
    const kategori = row[8]?.trim() || "Unknown";

    transactions.push({
      date: dateStr,
      title,
      amount,
      category: amount >= 0 ? kategori : hovedkategori,
      month,
    });

    if (amount >= 0) {
      let existing = income.find((i) => i.category === kategori);
      if (!existing) {
        existing = { category: kategori };
        income.push(existing);
      }
      existing[month] = Number(existing[month] || 0) + amount;
    } else {
      let existing = expenses.find((i) => i.category === hovedkategori);
      if (!existing) {
        existing = { category: hovedkategori };
        expenses.push(existing);
      }
      existing[month] = Number(existing[month] || 0) + amount;
    }
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
  let date = new Date(year, month + 1, 0); // Last day of the month
  while (date.getDay() === 6 || date.getDay() === 0) {
    date.setDate(date.getDate() - 1); // Move to previous day if Saturday/Sunday
  }
  return date;
};
