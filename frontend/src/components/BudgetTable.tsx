"use client";

import React from "react";
import { BudgetRow, BudgetTableProps } from "@/types/types";
import { monthColumns } from "@/constants/months";

const BudgetTable: React.FC<BudgetTableProps> = ({
  incomeData,
  expenseData,
  disposableIncomeData,
}) => {
  const renderTable = (title: string, data: BudgetRow[]) => (
    <div key={title} className="mb-10 w-full overflow-x-auto">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <table className="min-w-[1000px] border-collapse border border-gray-400 text-left">
        <thead>
          <tr className="bg-gray-100 text-black">
            <th className="border border-gray-300 px-4 py-2 font-bold">Category</th>
            {monthColumns.map((month) => (
              <th key={month} className="border border-gray-300 px-4 py-2 font-bold">
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  {row.category}
                </td>
                {monthColumns.map((month) => {
                  const value = row[month];
                  const isNumber = typeof value === "number";
                  const isNegative = isNumber && value < 0;
                  return (
                    <td
                      key={month}
                      className={`border border-gray-300 px-4 py-2 ${
                        isNegative ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isNumber
                        ? (value as number).toFixed(2)
                        : value || "-"}
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
  );

  return (
    <div className="mt-6 w-full max-w-full px-4">
      <h2 className="text-3xl font-semibold mb-6">Budget Overview</h2>
      {renderTable("Income Transactions", incomeData)}
      {renderTable("Expense Transactions", expenseData)}
      {renderTable("Disposable Income", disposableIncomeData)}
    </div>
  );
};

export default BudgetTable;
