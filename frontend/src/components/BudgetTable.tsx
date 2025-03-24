"use client";

import React, { useEffect, useRef, useState } from "react";
import { BudgetRow, BudgetTableProps } from "@/types/types";
import { monthColumns } from "@/constants/months";

const BudgetTable: React.FC<BudgetTableProps> = ({
  incomeData,
  expenseData,
  disposableIncomeData,
}) => {
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const allHeaderRefs = useRef<(HTMLTableHeaderCellElement | null)[][]>([]); // 2D array: one per table

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
    tableIndex: number
  ) => {
    const headerRefs: (HTMLTableHeaderCellElement | null)[] = [];
    allHeaderRefs.current[tableIndex] = headerRefs;

    return (
      <div key={title} className="mb-10 w-full overflow-x-auto">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <table className="min-w-[1000px] border-collapse border border-gray-400 text-left">
          <thead>
            <tr className="bg-gray-100 text-black">
              <th
                ref={(el) => {
                  headerRefs[0] = el;
                }}
                style={{
                  minWidth: columnWidths[0] ? `${columnWidths[0]}px` : undefined,
                  maxWidth: columnWidths[0] ? `${columnWidths[0]}px` : undefined,
                }}
                className="border border-gray-300 px-4 py-2 font-bold"
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
                    minWidth: columnWidths[i + 1]
                      ? `${columnWidths[i + 1]}px`
                      : undefined,
                    maxWidth: columnWidths[i + 1]
                      ? `${columnWidths[i + 1]}px`
                      : undefined,
                  }}
                  className="border border-gray-300 px-4 py-2 font-bold"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const isNumber = (value: any): value is number =>
                  typeof value === "number";
                const isTotalRow =
                  row.category?.toLowerCase().includes("total") ||
                  row.category === "Disposable Income";

                const spacer =
                  isTotalRow && index > 0 ? (
                    <tr key={`spacer-${index}`}>
                      <td colSpan={monthColumns.length + 1} className="h-2"></td>
                    </tr>
                  ) : null;

                  return (
                    <React.Fragment key={index}>
                      {spacer}
                      <tr className="hover:bg-gray-800 group">
                        <td className="border border-gray-300 px-4 py-2 font-medium text-white group-hover:text-white">
                          {row.category}
                        </td>
                        {monthColumns.map((month) => {
                          const value = row[month];
                          const isNumber = typeof value === "number";
                          const isNegative = isNumber && value < 0;
                  
                          return (
                            <td
                              key={month}
                              className={`border border-gray-300 px-4 py-2 text-sm ${
                                isNegative
                                  ? "text-red-600"
                                  : isNumber
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {isNumber ? value.toFixed(2) : value || "-"}
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
                  className="border px-4 py-2 text-center text-gray-500"
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
      <h2 className="text-3xl font-semibold mb-6">Budget Overview</h2>
      {renderTable("Income Transactions", incomeData, 0)}
      {renderTable("Expense Transactions", expenseData, 1)}
      {renderTable("Disposable Income", disposableIncomeData, 2)}
    </div>
  );
};

export default BudgetTable;
