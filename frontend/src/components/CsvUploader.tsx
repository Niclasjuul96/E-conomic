"use client";

import { useState } from "react";
import { parseCsvContent } from "@/utils/csvParser";
import { ParsedCsvData } from "@/types/types";
import { defaultCsvStructure } from "@/constants/csvStructure";

interface CsvUploaderProps {
  onDataParsed: (data: ParsedCsvData) => void;
}

export default function CsvUploader({ onDataParsed }: CsvUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customStructure, setCustomStructure] = useState({ ...defaultCsvStructure });
  const [showEditStructure, setShowEditStructure] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text
        .split("\n")
        .map((r) => r.split(";"))
        .filter((r) => r.length > 1);
      setCsvPreview(rows.slice(0, 5));
      setShowModal(true);
    };
    reader.readAsText(file);
  };

  const handleStructureChange = (field: string, value: number) => {
    setCustomStructure((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmImport = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsvContent(text, customStructure);
      onDataParsed(parsed);
      setShowModal(false);
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="csvUpload"
      />
      <label
        htmlFor="csvUpload"
        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Upload CSV
      </label>

      {selectedFile && <p className="mt-2 text-gray-400">File: {selectedFile.name}</p>}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto border border-gray-700">
            <h2 className="text-xl font-bold mb-4">CSV Preview</h2>

            <table className="w-full border border-gray-700 mb-4 text-sm">
              <thead>
                <tr className="bg-gray-800">
                  {csvPreview[0]?.map((_, colIdx) => (
                    <th key={colIdx} className="border border-gray-700 px-2 py-1">
                      Col {colIdx}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-700 px-2 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => setShowEditStructure((prev) => !prev)}
              className="text-sm text-blue-400 hover:underline mb-4"
            >
              {showEditStructure ? "Hide column mapping" : "Edit column mapping"}
            </button>

            {showEditStructure && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {["date", "title", "amount", "mainCategory", "subCategory"].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="font-semibold mb-1 capitalize">{field}</label>
                    <select
                      className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white"
                      value={customStructure[field as keyof typeof customStructure]}
                      onChange={(e) => handleStructureChange(field, Number(e.target.value))}
                    >
                      {csvPreview[0]?.map((_, i) => (
                        <option key={i} value={i}>
                          Column {i}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
