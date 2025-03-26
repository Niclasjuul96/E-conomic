"use client";

import React, { useEffect, useRef } from "react";
import { TransactionDetail } from "@/types/types";

interface Props {
  selectedDetails: { category: string; month: string };
  transactions: TransactionDetail[];
  onClose: () => void;
}

const TransactionDetails: React.FC<Props> = ({
  selectedDetails,
  transactions,
  onClose,
}) => {
  const { category, month } = selectedDetails;
  const ref = useRef<HTMLDivElement>(null);
  const clickedInsideTable = useRef(false);

  const filtered = transactions.filter((t) => {
    if (category === "Total Income") {
      if (month === "Total") return t.amount >= 0;
      return t.amount >= 0 && t.month === month;
    } else if (category === "Total Expenses") {
      if (month === "Total") return t.amount < 0;
      return t.amount < 0 && t.month === month;
    } else if (month === "Total") {
      return t.category === category;
    } else {
      return t.category === category && t.month === month;
    }
  });
  
  

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if a clickable cell was clicked
      if (target.closest("td.cursor-pointer")) {
        clickedInsideTable.current = true;
      } else {
        clickedInsideTable.current = false;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (clickedInsideTable.current) {
        // Reset the flag and do nothing
        clickedInsideTable.current = false;
        return;
      }

      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown, true); // capture phase
    document.addEventListener("mouseup", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="mt-10 w-full max-w-4xl border border-gray-700 rounded bg-black text-white p-4"
    >
      <h3 className="text-lg font-semibold mb-4">
        Transactions in <span className="text-white">{month}</span> for{" "}
        <span className="text-white">{category}</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-700 px-4 py-2">Dato</th>
              <th className="border border-gray-700 px-4 py-2">Title</th>
              <th className="border border-gray-700 px-4 py-2">Beløb</th>
              <th className="border border-gray-700 px-4 py-2">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((t, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-800 transition-colors duration-200"
                >
                  <td className="border border-gray-700 px-4 py-2">{t.date}</td>
                  <td className="border border-gray-700 px-4 py-2">{t.title}</td>
                  <td
                    className={`border border-gray-700 px-4 py-2 ${
                      t.amount < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {t.amount.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border border-gray-700 px-4 py-2">
                    {t.category}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-400 border border-gray-700 px-4 py-2"
                >
                  No transactions found for this category and month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionDetails;
