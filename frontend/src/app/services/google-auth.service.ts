import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GOOGLE_CONFIG } from '../constants/google-config';

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private isInitialized$ = new BehaviorSubject<boolean>(false);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private userName$ = new BehaviorSubject<string | null>(null);
  private userPicture$ = new BehaviorSubject<string | null>(null);
  private tokenClient: any = null;
  private initAttempted = false;

  isAuthenticated = this.isAuthenticated$.asObservable();
  isInitialized = this.isInitialized$.asObservable();
  userName = this.userName$.asObservable();
  userPicture = this.userPicture$.asObservable();

  constructor() {
    // Use setTimeout to defer initialization, allowing scripts to load first
    setTimeout(() => this.initWhenReady(), 0);
  }

  /**
   * Check if user is currently authenticated (synchronous)
   */
  isCurrentlyAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  /**
   * Wait for Google to be ready, then initialize
   */
  private initWhenReady(): void {
    // Prevent multiple initialization attempts
    if (this.initAttempted) {
      return;
    }

    // If Google is already available, initialize immediately
    if (this.isGoogleReady()) {
      console.log('[GoogleAuth] Google is ready, initializing now');
      this.initializeTokenClient();
      return;
    }

    // Poll for Google to become available (max 30 seconds)
    let attempts = 0;
    const maxAttempts = 150; // 150 * 200ms = 30 seconds

    console.log('[GoogleAuth] Polling for Google to load...');

    const interval = setInterval(() => {
      attempts++;

      if (this.isGoogleReady()) {
        clearInterval(interval);
        console.log('[GoogleAuth] Google ready after', attempts, 'attempts');
        this.initializeTokenClient();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('[GoogleAuth] Timeout: Google did not load within 30 seconds');
        this.isInitialized$.next(false);
      }
    }, 200);
  }

  /**
   * Check if Google and its oauth2 API are available
   */
  private isGoogleReady(): boolean {
    try {
      return (
        window.google &&
        window.google.accounts &&
        window.google.accounts.oauth2 &&
        typeof window.google.accounts.oauth2.initTokenClient === 'function'
      );
    } catch {
      return false;
    }
  }

  /**
   * Initialize the OAuth token client
   */
  private initializeTokenClient(): void {
    // Guard: prevent double initialization
    if (this.initAttempted) {
      console.log('[GoogleAuth] Initialization already attempted, skipping');
      return;
    }

    this.initAttempted = true;

    // Final safety check
    if (!this.isGoogleReady()) {
      console.error('[GoogleAuth] Google is not ready at initialization time');
      this.isInitialized$.next(false);
      return;
    }

    try {
      console.log('[GoogleAuth] Initializing OAuth token client');

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        scope: GOOGLE_CONFIG.SCOPES.join(' '),
        callback: (response: any) => this.handleTokenResponse(response),
      });

      this.isInitialized$.next(true);
      console.log('[GoogleAuth] ✓ Initialization successful');

      // Check for previously stored auth token
      this.checkStoredToken();
    } catch (error) {
      console.error('[GoogleAuth] Failed to initialize token client:', error);
      this.isInitialized$.next(false);
    }
  }

  /**
   * Initiate OAuth login flow (shows Google consent screen)
   */
  login(): void {
    if (!this.tokenClient) {
      console.error('[GoogleAuth] Token client not initialized');
      return;
    }

    // This triggers the OAuth consent screen
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * Logout user and clear token
   */
  logout(): void {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      window.google.accounts.oauth2.revoke(token, () => {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expires_at');
        this.isAuthenticated$.next(false);
        this.userName$.next(null);
        this.userPicture$.next(null);
        console.log('[GoogleAuth] User logged out successfully');
      });
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('google_access_token');
  }

  /**
   * Check if user has a valid stored token
   */
  private checkStoredToken(): void {
    const token = localStorage.getItem('google_access_token');
    const expiresAt = localStorage.getItem('google_token_expires_at');

    if (token && expiresAt && new Date().getTime() < parseInt(expiresAt, 10)) {
      this.isAuthenticated$.next(true);
      // Try to get user name and picture from stored data
      const name = localStorage.getItem('google_user_name');
      if (name) {
        this.userName$.next(name);
      }
      const picture = localStorage.getItem('google_user_picture');
      if (picture) {
        this.userPicture$.next(picture);
      }
    }
  }

  /**
   * Handle OAuth token response callback
   */
  private handleTokenResponse(response: any): void {
    if (response.error !== undefined) {
      console.error('[GoogleAuth] OAuth error:', response.error);
      throw new Error(response.error);
    }

    const accessToken = response.access_token;
    const expiresIn = response.expires_in || 3600; // Default 1 hour
    const expiresAt = new Date().getTime() + expiresIn * 1000;

    // Store token and expiration
    localStorage.setItem('google_access_token', accessToken);
    localStorage.setItem('google_token_expires_at', expiresAt.toString());

    this.isAuthenticated$.next(true);

    // Fetch user info to get email
    this.fetchUserInfo(accessToken);
  }

  /**
   * Fetch user info (name and picture) from Google API
   */
  private fetchUserInfo(accessToken: string): void {
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const givenName = data.given_name || 'User';
        const familyName = data.family_name || '';
        const fullName = `${givenName} ${familyName}`.trim();
        const picture = data.picture || null;
        
        this.userName$.next(fullName);
        this.userPicture$.next(picture);
        localStorage.setItem('google_user_name', fullName);
        if (picture) {
          localStorage.setItem('google_user_picture', picture);
        }
        console.log('[GoogleAuth] User logged in:', fullName);
      })
      .catch((error) => {
        console.error('[GoogleAuth] Failed to fetch user info:', error);
        console.error('[GoogleAuth] This may be due to missing scopes. Check SCOPES in google-config.ts');
      });
  }

  /**
   * Make authorized API call to Google Sheets
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('User not authenticated. Please login first');
    }

    const headers: any = options.headers || {};
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }
}

