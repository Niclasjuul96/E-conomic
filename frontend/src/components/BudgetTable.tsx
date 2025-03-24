"use client";

import React from "react";
import { BudgetRow } from "@/types/types";
import { monthColumns } from "@/constants/months";

interface BudgetTableProps {
  incomeData: BudgetRow[];
  expenseData: BudgetRow[];
  disposableIncomeData: BudgetRow[];
}

const BudgetTable: React.FC<BudgetTableProps> = ({
  incomeData,
  expenseData,
  disposableIncomeData,
}) => {
  const renderTable = (title: string, data: BudgetRow[]) => (
    <div key={title} className="mb-6">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-left">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">Category</th>
              {monthColumns.map((month) => (
                <th key={month} className="border border-gray-300 px-4 py-2">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{row.category}</td>
                  {monthColumns.map((month) => {
                    const value = row[month];
                    return (
                      <td key={month} className="border border-gray-300 px-4 py-2">
                        {typeof value === "number" ? value.toFixed(2) : value || "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={monthColumns.length + 1}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  No data available. Upload a CSV file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mt-6 w-full max-w-6xl">
      <h2 className="text-2xl font-semibold mb-4">Budget Overview</h2>
      {renderTable("Income Transactions", incomeData)}
      {renderTable("Expense Transactions", expenseData)}
      {renderTable("Disposable Income", disposableIncomeData)}
    </div>
  );
};

export default BudgetTable;
