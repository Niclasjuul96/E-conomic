// /components/CsvUploader.tsx

"use client";

import { useState } from "react";
import { parseCsvContent } from "@/utils/csvParser";
import { ParsedCsvData } from "@/types/types";

interface CsvUploaderProps {
  onDataParsed: (data: ParsedCsvData) => void;
}

export default function CsvUploader({ onDataParsed }: CsvUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsvContent(text);
      onDataParsed(parsed);
    };
    reader.readAsText(file);
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
      {selectedFile && <p className="mt-2 text-gray-700">File: {selectedFile.name}</p>}
    </div>
  );
}
