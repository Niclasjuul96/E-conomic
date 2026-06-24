import { Component, inject, OnInit } from '@angular/core';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

@Component({
  selector: 'sheet-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="sheet-selector">
      <div class="sheet-header">
        <span class="sheet-icon" aria-hidden="true">&#9638;</span>
        <div>
          <h2>Google Sheets</h2>
          <p>Manage your Google Sheets connection</p>
        </div>
      </div>

      <div *ngIf="!(isAuthenticated$ | async)" class="sheet-empty">
        <h3>Connect your Google account</h3>
        <p>Log in first, then choose where imported transactions should sync.</p>
      </div>

      <ng-container *ngIf="isAuthenticated$ | async">
        <div *ngIf="sheetId" class="sheet-connected">
          <div class="connected-topline">
            <span>Connected Sheet</span>
            <a [href]="getSheetUrl()" target="_blank" class="sheet-link" title="Open in Google Sheets">&#8599;</a>
          </div>

          <p class="sheet-name">E-conomic Budget</p>
          <p class="sheet-id">{{ getSheetPreview() }}</p>
          <span class="status-pill">Connected</span>

          <button (click)="unlinkSheet()" class="change-sheet-button">
            &#8635; Change Sheet
          </button>
        </div>

        <div *ngIf="!sheetId" class="sheet-setup">
          <p class="setup-message">Choose an existing spreadsheet or create a new budget sheet.</p>

          <button (click)="createNewSheet()" [disabled]="isCreating" class="create-sheet-button">
            {{ isCreating ? 'Creating...' : 'Create New Sheet' }}
          </button>

          <div class="divider">or</div>

          <label class="option-label" for="sheetIdInput">Link existing sheet</label>
          <div class="link-sheet-form">
            <input
              id="sheetIdInput"
              [(ngModel)]="sheetIdInput"
              type="text"
              placeholder="Paste Google Sheet ID"
              class="sheet-id-input"
              (keyup.enter)="linkExistingSheet()"
            />
            <button
              (click)="linkExistingSheet()"
              [disabled]="!sheetIdInput || isLinking"
              class="link-button"
            >
              {{ isLinking ? 'Linking...' : 'Link' }}
            </button>
          </div>

          <button
            (click)="browseGoogleDrive()"
            class="browse-button"
            title="Browse and select a spreadsheet from Google Drive"
          >
            Select from Drive
          </button>

          <p class="option-hint">
            The sheet ID is the long value between /d/ and /edit in a Google Sheets URL.
          </p>
        </div>
      </ng-container>

      <div *ngIf="error" class="sheet-error">
        <p>{{ error }}</p>
        <button (click)="clearError()" class="retry-button">Dismiss</button>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .sheet-selector {
      height: 100%;
      box-sizing: border-box;
      padding: 1rem;
      border: 1px solid #d8e1ef;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
    }

    .sheet-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: #111827;
        font-size: 1.125rem;
        line-height: 1.2;
      }

      p {
        margin-top: 0.25rem;
        color: #4b5563;
        font-size: 0.9rem;
      }
    }

    .sheet-icon {
      display: grid;
      width: 48px;
      height: 48px;
      flex: 0 0 48px;
      place-items: center;
      border-radius: 6px;
      background: #16a34a;
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 900;
    }

    .sheet-empty,
    .sheet-connected,
    .sheet-setup {
      border: 1px solid #d8e1ef;
      border-radius: 8px;
      background: #ffffff;
    }

    .sheet-empty {
      padding: 1rem;

      h3,
      p {
        margin: 0;
      }

      h3 {
        color: #111827;
        font-size: 1rem;
      }

      p {
        margin-top: 0.5rem;
        color: #4b5563;
        line-height: 1.5;
      }
    }

    .sheet-connected {
      overflow: hidden;
    }

    .connected-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-bottom: 1px solid #d8e1ef;
      color: #111827;
      font-weight: 800;
    }

    .sheet-link {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      color: #111827;
      text-decoration: none;
      border-radius: 6px;

      &:hover {
        background: #f1f5f9;
      }
    }

    .sheet-name {
      margin: 0;
      padding: 0.875rem 0.75rem 0.35rem;
      color: #111827;
      font-size: 1.05rem;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .sheet-id {
      margin: 0;
      padding: 0 0.75rem;
      color: #64748b;
      font-size: 0.8rem;
      overflow-wrap: anywhere;
    }

    .status-pill {
      display: inline-flex;
      margin: 0.875rem 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      background: #bbf7d0;
      color: #166534;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .change-sheet-button,
    .create-sheet-button,
    .browse-button,
    .link-button,
    .retry-button {
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    }

    .change-sheet-button {
      width: calc(100% - 1.5rem);
      margin: 0 0.75rem 0.75rem;
      padding: 0.8rem 1rem;
      border: 1px solid #2563eb;
      background: #ffffff;
      color: #2563eb;

      &:hover {
        background: #eff6ff;
      }
    }

    .sheet-setup {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .setup-message,
    .option-hint,
    .option-label,
    .divider {
      margin: 0;
      color: #4b5563;
      font-size: 0.88rem;
    }

    .option-label {
      color: #111827;
      font-weight: 800;
    }

    .create-sheet-button,
    .browse-button {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #2563eb;
      color: #ffffff;

      &:hover:not(:disabled) {
        background: #1d4ed8;
      }
    }

    .browse-button {
      background: #0f172a;

      &:hover {
        background: #1e293b;
      }
    }

    .divider {
      text-align: center;
    }

    .link-sheet-form {
      display: flex;
      gap: 0.5rem;
    }

    .sheet-id-input {
      min-width: 0;
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: #111827;
      font-size: 0.9rem;

      &:focus {
        outline: 3px solid rgba(37, 99, 235, 0.18);
        border-color: #2563eb;
      }
    }

    .link-button {
      padding: 0.75rem 0.9rem;
      background: #16a34a;
      color: #ffffff;

      &:hover:not(:disabled) {
        background: #15803d;
      }
    }

    .option-hint {
      line-height: 1.45;
    }

    .sheet-error {
      margin-top: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #fecaca;
      border-radius: 8px;
      background: #fef2f2;
      color: #991b1b;

      p {
        margin: 0 0 0.75rem;
      }
    }

    .retry-button {
      padding: 0.5rem 0.85rem;
      background: #dc2626;
      color: #ffffff;
    }
  `],
})
export class SheetSelector implements OnInit {
  sheetsService = inject(GoogleSheetsService);
  authService = inject(GoogleAuthService);

  isAuthenticated$ = this.authService.isAuthenticated;
  sheetId: string | null = null;
  sheetIdInput: string = '';
  isCreating = false;
  isLinking = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSheetId();
  }

  loadSheetId(): void {
    this.sheetId = this.sheetsService.getSheetId();
  }

  async createNewSheet(): Promise<void> {
    this.isCreating = true;
    this.error = null;

    try {
      const id = await this.sheetsService.initializeSheet();
      this.sheetId = id;
      this.sheetIdInput = '';
      console.log('[SheetSelector] Sheet created successfully:', id);
    } catch (err: any) {
      this.error = `Failed to create sheet: ${err.message}`;
      console.error('[SheetSelector] Error creating sheet:', err);
    } finally {
      this.isCreating = false;
    }
  }

  async linkExistingSheet(): Promise<void> {
    if (!this.sheetIdInput.trim()) {
      this.error = 'Please enter a valid Google Sheet ID';
      return;
    }

    this.isLinking = true;
    this.error = null;

    try {
      await this.sheetsService.getSheetMetadata(this.sheetIdInput);
      await this.sheetsService.ensureHeaders(this.sheetIdInput);

      this.sheetsService.setSheetId(this.sheetIdInput);
      this.sheetId = this.sheetIdInput;
      this.sheetIdInput = '';
      console.log('[SheetSelector] Sheet linked successfully:', this.sheetId);
    } catch (err: any) {
      this.error = `Failed to link sheet: ${err.message}. Make sure the ID is correct and the sheet is accessible.`;
      console.error('[SheetSelector] Error linking sheet:', err);
    } finally {
      this.isLinking = false;
    }
  }

  unlinkSheet(): void {
    this.sheetId = null;
    this.sheetIdInput = '';
    this.sheetsService.clearSheetId();
    this.error = null;
  }

  browseGoogleDrive(): void {
    if (!window.gapi) {
      this.error = 'Google API not loaded yet. Please try again.';
      return;
    }

    window.gapi.load('picker', () => {
      this.openGooglePicker();
    });
  }

  private openGooglePicker(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.error = 'Not authenticated. Please log in first.';
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.SPREADSHEETS)
      .setOAuthToken(token)
      .setDeveloperKey(this.getDeveloperKey())
      .setCallback((data: any) => this.handlePickerCallback(data))
      .build();

    picker.setVisible(true);
  }

  private handlePickerCallback(data: any): void {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      const sheetId = file.id;

      this.sheetIdInput = sheetId;
      this.linkExistingSheet();
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log('[SheetSelector] Picker cancelled');
    }
  }

  private getDeveloperKey(): string {
    return '';
  }

  clearError(): void {
    this.error = null;
  }

  getSheetUrl(): string {
    if (!this.sheetId) return '#';
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}`;
  }

  getSheetPreview(): string {
    if (!this.sheetId) return '';
    if (this.sheetId.length <= 18) return this.sheetId;
    return `${this.sheetId.slice(0, 8)}...${this.sheetId.slice(-6)}`;
  }
}
