/**
 * Google OAuth & Sheets Configuration
 * TODO: Replace with your actual Google Client ID from Google Cloud Console
 */
export const GOOGLE_CONFIG = {
  // OAuth 2.0 Client ID from Google Cloud Console
  // Get it from: https://console.cloud.google.com/ → Credentials → OAuth 2.0 Client ID
  CLIENT_ID: '520118713358-m78lld03h4vsau42pt218dec2mccv9to.apps.googleusercontent.com',

  // Scopes needed for Google Sheets API and user info
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],

  // Discovery document URL for Google Sheets API
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',

  // API Key (not required for OAuth flow, but useful for public sheets)
  API_KEY: 'YOUR_API_KEY_HERE',
};

/**
 * Sheet Configuration
 * Users will create/select their own sheet, ID stored in localStorage
 */
export const SHEET_CONFIG = {
  STORAGE_KEY: 'e_conomic_sheet_id', // localStorage key to remember user's sheet
  TRANSACTIONS_SHEET_NAME: 'Transactions',
  HEADER_ROW_NUMBER: 1,
  HEADERS: [
    'Date',
    'Title',
    'Amount',
    'MainCategory',
    'SubCategory',
    'Month',
    'Year',
    'Timestamp', // Used for duplicate detection
  ],
};
