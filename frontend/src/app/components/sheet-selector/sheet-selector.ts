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
    <div class="sheet-selector" *ngIf="(isAuthenticated$ | async)">
      <div *ngIf="!sheetId" class="sheet-setup">
        <p class="sheet-setup-message">📊 Set up Google Sheets for data persistence</p>
        
        <!-- Option 1: Create New Sheet -->
        <div class="sheet-option">
          <button (click)="createNewSheet()" [disabled]="isCreating" class="create-sheet-button">
            {{ isCreating ? 'Creating...' : '+ Create New Sheet' }}
          </button>
          <p class="option-hint">A new spreadsheet will be created in your Google Drive</p>
        </div>

        <!-- Option 2: Link Existing Sheet -->
        <div class="sheet-option">
          <p class="option-label">Or link an existing sheet:</p>
          <div class="link-sheet-form">
            <input 
              [(ngModel)]="sheetIdInput" 
              type="text" 
              placeholder="Paste Google Sheet ID here"
              class="sheet-id-input"
              (keyup.enter)="linkExistingSheet()">
            <button 
              (click)="linkExistingSheet()" 
              [disabled]="!sheetIdInput || isLinking"
              class="link-button">
              {{ isLinking ? 'Linking...' : 'Link Sheet' }}
            </button>
            <button 
              (click)="browseGoogleDrive()"
              class="browse-button"
              title="Browse and select a spreadsheet from Google Drive">
              📂 Select Sheet
            </button>
          </div>
          <p class="option-hint">Find the ID in your Google Sheet URL: <code>docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit</code></p>
        </div>
      </div>

      <div *ngIf="sheetId" class="sheet-connected">
        <span class="sheet-status">✓ Connected to Google Sheet</span>
        <a 
          [href]="getSheetUrl()" 
          target="_blank" 
          class="sheet-link">
          View in Google Sheets
        </a>
        <button (click)="unlinkSheet()" class="unlink-button">Change Sheet</button>
      </div>

      <div *ngIf="error" class="sheet-error">
        <p>{{ error }}</p>
        <button (click)="clearError()" class="retry-button">Dismiss</button>
      </div>
    </div>
  `,
  styles: [`
    .sheet-selector {
      margin: 1rem 0;
      padding: 1rem;
      background-color: #111827;
      border: 1px solid #374151;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .sheet-setup {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .sheet-setup-message {
        color: #d1d5db;
        margin: 0;
        font-weight: 600;
      }

      .sheet-option {
        padding: 0.75rem;
        background-color: #1f2937;
        border: 1px solid #374151;
        border-radius: 0.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .option-label {
          margin: 0;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .create-sheet-button {
          background-color: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: background-color 0.2s;
          width: 100%;

          &:hover:not(:disabled) {
            background-color: #2563eb;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        .link-sheet-form {
          display: flex;
          gap: 0.5rem;

          .sheet-id-input {
            flex: 1;
            padding: 0.5rem;
            background-color: #111827;
            border: 1px solid #4b5563;
            border-radius: 0.25rem;
            color: #d1d5db;
            font-size: 0.875rem;

            &:focus {
              outline: none;
              border-color: #3b82f6;
            }

            &::placeholder {
              color: #6b7280;
            }
          }

          .link-button {
            background-color: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.875rem;
            transition: background-color 0.2s;
            white-space: nowrap;

            &:hover:not(:disabled) {
              background-color: #059669;
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }

          .browse-button {
            background-color: #8b5cf6;
            color: white;
            padding: 0.5rem 0.75rem;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.875rem;
            transition: background-color 0.2s;
            white-space: nowrap;

            &:hover {
              background-color: #7c3aed;
            }
          }
        }

        .option-hint {
          margin: 0;
          color: #9ca3af;
          font-size: 0.75rem;

          code {
            background-color: #111827;
            padding: 0.125rem 0.25rem;
            border-radius: 0.125rem;
            font-family: monospace;
          }
        }
      }
    }

    .sheet-connected {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      .sheet-status {
        color: #10b981;
        font-weight: 600;
      }

      .sheet-link {
        color: #60a5fa;
        text-decoration: none;
        font-size: 0.875rem;

        &:hover {
          text-decoration: underline;
        }
      }

      .unlink-button {
        background-color: #6b7280;
        color: white;
        padding: 0.25rem 0.75rem;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.75rem;

        &:hover {
          background-color: #4b5563;
        }
      }
    }

    .sheet-error {
      color: #ef4444;

      p {
        margin: 0 0 0.5rem 0;
      }

      .retry-button {
        background-color: #ef4444;
        color: white;
        padding: 0.25rem 0.75rem;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.75rem;

        &:hover {
          background-color: #dc2626;
        }
      }
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
      // Verify the sheet exists by checking its metadata
      await this.sheetsService.getSheetMetadata(this.sheetIdInput);
      
      // Ensure headers exist (will add them if missing)
      await this.sheetsService.ensureHeaders(this.sheetIdInput);
      
      // Save the sheet ID
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
    // Check if gapi is loaded
    if (!window.gapi) {
      this.error = 'Google API not loaded yet. Please try again.';
      return;
    }

    // Load the picker library
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
      .addView(window.google.picker.ViewId.SPREADSHEETS) // Show only spreadsheets
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
      
      // Auto-link the selected sheet
      this.sheetIdInput = sheetId;
      this.linkExistingSheet();
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log('[SheetSelector] Picker cancelled');
    }
  }

  private getDeveloperKey(): string {
    // Return empty string - with oauth token it's not strictly required
    // But you can add a key here if desired
    return '';
  }

  clearError(): void {
    this.error = null;
  }

  getSheetUrl(): string {
    if (!this.sheetId) return '#';
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}`;
  }
}
