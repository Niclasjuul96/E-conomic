import { Component, EventEmitter, Output } from '@angular/core';
import { CsvParserService } from '../../services/csv-parser.service';
import { ParsedCsvData } from '../../models/types';
import { defaultCsvStructure, CsvStructure } from '../../constants/csv-structure';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'csv-upload',
  templateUrl: './csv-upload.html',
  styleUrls: ['./csv-upload.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CsvUpload {
  @Output() dataParsed = new EventEmitter<ParsedCsvData>();

  selectedFile: File | null = null;
  csvPreview: string[][] = [];
  showModal = false;
  showEditStructure = false;

  customStructure: CsvStructure = { ...defaultCsvStructure };
  columnFields = ['date', 'title', 'amount', 'mainCategory', 'subCategory'];

  constructor(private csvParser: CsvParserService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.selectedFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = text
        .split('\n')
        .map((r) => r.split(';'))
        .filter((r) => r.length > 1);
      this.csvPreview = rows.slice(0, 5);
      this.showModal = true;
    };
    reader.readAsText(this.selectedFile);
  }

  toggleEditStructure(): void {
    this.showEditStructure = !this.showEditStructure;
  }

  handleStructureChange(field: keyof CsvStructure, value: number): void {
    this.customStructure = {
      ...this.customStructure,
      [field]: Number(value)
    };
  }

  confirmImport(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = this.csvParser.parseCsvContent(text, this.customStructure);
      this.dataParsed.emit(parsed);
      this.showModal = false;
    };
    reader.readAsText(this.selectedFile);
  }

  cancelImport(): void {
    this.showModal = false;
  }

  getStructureValue(field: string): number | undefined {
    return this.customStructure[field as keyof CsvStructure];
  }

  onStructureChange(field: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value);
    this.handleStructureChange(field as keyof CsvStructure, value);
  }

}
