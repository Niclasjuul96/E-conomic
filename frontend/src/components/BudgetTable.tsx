"use client";

import React, { useEffect, useRef, useState } from "react";
import { BudgetRow, BudgetTableProps } from "@/types/types";
import { monthColumns } from "@/constants/months";

const BudgetTable: React.FC<BudgetTableProps> = ({
  incomeData,
  expenseData,
  disposableIncomeData,
  onCellClick,
}) => {
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const allHeaderRefs = useRef<(HTMLTableCellElement | null)[][]>([]);

  useEffect(() => {
    const columnCount = monthColumns.length + 1;
    const widths = new Array(columnCount).fill(0);

    allHeaderRefs.current.forEach((refs) => {
      refs.forEach((ref, index) => {
        if (ref) {
          widths[index] = Math.max(widths[index], ref.offsetWidth);
        }
      });
    });

    setColumnWidths(widths);
  }, [incomeData, expenseData, disposableIncomeData]);

  const renderTable = (
    title: string,
    data: BudgetRow[],
    tableIndex: number,
    type: "income" | "expense" | "disposable"
  ) => {
    const headerRefs: (HTMLTableCellElement | null)[] = [];
    allHeaderRefs.current[tableIndex] = headerRefs;

    return (
      <div key={title} className="mb-10 w-full overflow-x-auto">
        <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
        <table className="min-w-[1000px] border-collapse border border-gray-700 text-left bg-black text-white">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th
                ref={(el) => {
                  headerRefs[0] = el;
                }}
                style={{
                  minWidth: columnWidths[0] ? `${columnWidths[0]}px` : undefined,
                  maxWidth: columnWidths[0] ? `${columnWidths[0]}px` : undefined,
                }}
                className="border border-gray-700 px-4 py-2 font-bold"
              >
                Category
              </th>
              {monthColumns.map((month, i) => (
                <th
                  key={month}
                  ref={(el) => {
                    headerRefs[i + 1] = el;
                  }}
                  style={{
                    minWidth: columnWidths[i + 1] ? `${columnWidths[i + 1]}px` : undefined,
                    maxWidth: columnWidths[i + 1] ? `${columnWidths[i + 1]}px` : undefined,
                  }}
                  className="border border-gray-700 px-4 py-2 font-bold"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const isTotalRow =
                  row.category?.toLowerCase().includes("total") ||
                  row.category === "Disposable Income";

                const spacer =
                  isTotalRow && index > 0 ? (
                    <tr key={`spacer-${index}`}>
                      <td colSpan={monthColumns.length + 1} className="h-2"></td>
                    </tr>
                  ) : null;

                const category = row.category || "";

                return (
                  <React.Fragment key={index}>
                    {spacer}
                    <tr className="hover:bg-gray-800 transition-colors duration-200">
                      <td className="border border-gray-700 px-4 py-2 font-medium text-white">
                        {category}
                      </td>
                      {monthColumns.map((month) => {
                        const value = row[month];
                        const isNumber = typeof value === "number";
                        const isNegative = isNumber && value < 0;
                        const isAverageColumn = month === "Average";
                        const isDisposableRow = row.category === "Disposable Income";
                        const isClickable = isNumber && !isAverageColumn && !isDisposableRow;

                        return (
                          <td
                            key={month}
                            onClick={() => {
                              if (isClickable) {
                                onCellClick?.(category, month, type);
                              }
                            }}
                            className={`border border-gray-700 px-4 py-2 text-sm ${
                              isClickable ? "cursor-pointer" : ""
                            } ${
                              isNegative
                                ? "text-red-600"
                                : isNumber
                                ? "text-green-600"
                                : "text-white"
                            }`}
                          >
                            {isNumber
                              ? value.toLocaleString("da-DK", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : value || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={monthColumns.length + 1}
                  className="border px-4 py-2 text-center text-gray-400"
                >
                  No data available. Upload a CSV file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt-6 w-full max-w-full px-4">
      <h2 className="text-3xl font-semibold mb-6 text-white">Budget Overview</h2>
      {renderTable("Income Transactions", incomeData, 0, "income")}
      {renderTable("Expense Transactions", expenseData, 1, "expense")}
      {renderTable("Disposable Income", disposableIncomeData, 2, "disposable")}
    </div>
  );
};

export default BudgetTable;
 