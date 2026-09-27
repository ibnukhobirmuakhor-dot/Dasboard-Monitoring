/**
 * Google Drive & Google Sheets Integration Service
 * Using Google Identity Services (GSI) OAuth 2.0 Token Client & REST APIs
 */

declare global {
  interface Window {
    gapi?: any;
    google?: {
      picker?: any;
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          hasGrantedAllScopes: (tokenResponse: any, firstScope: string, ...restScopes: string[]) => boolean;
        };
      };
    };
  }
}

export interface GoogleUserSession {
  accessToken: string;
  expiresAt: number;
  userEmail?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleSpreadsheetMeta {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';
const SESSION_STORAGE_KEY = 'hbr2_google_oauth_session';
const SELECTED_DRIVE_FOLDER_KEY = 'hbr2_google_drive_folder';
const SELECTED_SHEET_KEY = 'hbr2_google_sheet_id';

// Default designated database folder provided by user
export const DEFAULT_DATABASE_FOLDER = {
  id: '1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO',
  name: 'Folder Database HBR II (Google Drive)',
  url: 'https://drive.google.com/drive/folders/1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO?usp=drive_link'
};

// Real Client ID provisioned by Google Cloud for this applet
export const GOOGLE_CLIENT_ID = firebaseConfig.oAuthClientId || '96648993672-d1jjmr379b61ekf59cj61532jaqttuq3.apps.googleusercontent.com';

// Firebase Auth setup
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

class GoogleWorkspaceService {
  private session: GoogleUserSession | null = null;
  private tokenClient: any = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: GoogleUserSession = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          this.session = parsed;
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {
      this.session = null;
    }
  }

  public getSession(): GoogleUserSession | null {
    if (this.session && this.session.expiresAt > Date.now()) {
      return this.session;
    }
    return null;
  }

  public isAuthenticated(): boolean {
    return !!this.getSession();
  }

  public async logout(): Promise<void> {
    this.session = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }

  public initOAuthClient(onSuccess?: (session: GoogleUserSession) => void, onError?: (error: string) => void) {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      onError?.('Google Identity Services script belum selesai dimuat. Tunggu beberapa detik dan coba lagi.');
      return;
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            onError?.(response.error_description || response.error);
            return;
          }

          if (response.access_token) {
            const expiresIn = (response.expires_in || 3599) * 1000;
            const newSession: GoogleUserSession = {
              accessToken: response.access_token,
              expiresAt: Date.now() + expiresIn
            };

            this.session = newSession;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
            
            // Try fetch user profile email
            this.fetchUserProfile(response.access_token).then((email) => {
              if (email) {
                newSession.userEmail = email;
                this.session = newSession;
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
              }
              onSuccess?.(newSession);
            }).catch(() => {
              onSuccess?.(newSession);
            });
          }
        },
        error_callback: (err) => {
          onError?.(err?.message || 'Gagal memulai otentikasi Google OAuth');
        }
      });
    } catch (err: any) {
      onError?.(err.message || 'Error initializing Google OAuth Client');
    }
  }

  /**
   * Primary login via Firebase Auth popup or Google Identity Services (GSI)
   */
  public async requestLogin(): Promise<GoogleUserSession> {
    // 1. First try Firebase Auth popup (standard for AI Studio applets with OAuth)
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        const newSession: GoogleUserSession = {
          accessToken: credential.accessToken,
          expiresAt: Date.now() + (3600 * 1000),
          userEmail: userCredential.user.email || undefined
        };
        this.session = newSession;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        return newSession;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase Auth popup attempted, falling back to GSI token client:', firebaseErr);
      // If error is user closed popup, don't fall back
      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        throw new Error('Jendela login ditutup oleh pengguna.');
      }
    }

    // 2. Fallback to Google Identity Services Token Client
    return new Promise((resolve, reject) => {
      this.initOAuthClient(
        (session) => resolve(session),
        (error) => reject(new Error(error))
      );

      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        reject(new Error('Google OAuth Client tidak tersedia.'));
      }
    });
  }

  public async fetchUserProfile(token: string): Promise<string | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.email || null;
      }
    } catch {
      // ignore
    }
    return null;
  }

  // --- GOOGLE DRIVE METHODS ---

  /**
   * Helper to extract Google Drive Folder ID from a raw URL or string
   */
  public extractFolderId(input: string): string {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  }

  /**
   * Get metadata of a specific Google Drive Folder (or file) by ID
   */
  public async getFolderMetadata(folderId: string): Promise<GoogleDriveFolder> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const cleanId = this.extractFolderId(folderId);
    const url = `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType,webViewLink`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gagal mengambil info folder Google Drive (ID: ${cleanId})`);
    }

    return await res.json();
  }

  /**
   * List files (including photos & spreadsheets) inside a specific folder
   */
  public async listFilesInFolder(folderId: string): Promise<GoogleDriveFile[]> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const cleanId = this.extractFolderId(folderId);
    const query = `'${cleanId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,size)&pageSize=100&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gagal memuat isi file folder (ID: ${cleanId})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * List folders inside Google Drive
   */
  public async listDriveFolders(parentId: string = 'root'): Promise<GoogleDriveFolder[]> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&pageSize=50&orderBy=name`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal mengambil folder dari Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Create a new folder in Google Drive (e.g. "HBR II Project - Site Photos")
   */
  public async createDriveFolder(name: string, parentId?: string): Promise<GoogleDriveFolder> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId && parentId !== 'root') {
      metadata.parents = [parentId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive');
    }

    return await res.json();
  }

  /**
   * Upload image/document to Google Drive folder
   */
  public async uploadFileToDrive(
    file: File | Blob,
    filename: string,
    folderId?: string
  ): Promise<GoogleDriveFile> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const metadata: any = {
      name: filename,
      mimeType: file.type || 'application/octet-stream'
    };

    if (folderId && folderId !== 'root') {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', file);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: form
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal mengunggah berkas ke Google Drive');
    }

    return await res.json();
  }

  /**
   * List Google Spreadsheets available in Google Drive with optional search query
   */
  public async listSpreadsheets(searchTerm: string = '', parentFolderId?: string): Promise<GoogleDriveFile[]> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    let queryParts = [
      "mimeType = 'application/vnd.google-apps.spreadsheet'",
      "trashed = false"
    ];

    if (parentFolderId && parentFolderId !== 'all') {
      queryParts.push(`'${parentFolderId}' in parents`);
    }

    if (searchTerm.trim()) {
      const sanitized = searchTerm.trim().replace(/'/g, "\\'");
      queryParts.push(`name contains '${sanitized}'`);
    }

    const query = queryParts.join(' and ');
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,modifiedTime,size,owners(displayName))&pageSize=50&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal mencari Google Spreadsheet di Drive');
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Open the official Google Drive Picker dialog for picking Spreadsheets
   */
  public async openSpreadsheetPicker(): Promise<{ id: string; name: string; url?: string } | null> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    return new Promise((resolve, reject) => {
      // Check if gapi is loaded
      if (!window.gapi) {
        reject(new Error('Google API Client (gapi) belum siap'));
        return;
      }

      window.gapi.load('picker', {
        callback: () => {
          try {
            if (!window.google?.picker) {
              reject(new Error('Google Picker API tidak tersedia'));
              return;
            }

            const pickerOrigin =
              window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
                ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
                : window.location.origin;

            // DocsView filtered strictly to Spreadsheets
            const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);
            view.setMimeTypes('application/vnd.google-apps.spreadsheet');

            const picker = new window.google.picker.PickerBuilder()
              .addView(view)
              .setOAuthToken(session.accessToken)
              .setOrigin(pickerOrigin)
              .setTitle('Pilih Google Spreadsheet Proyek HBR II')
              .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                  const doc = data.docs?.[0];
                  if (doc) {
                    resolve({
                      id: doc.id,
                      name: doc.name,
                      url: doc.url
                    });
                  } else {
                    resolve(null);
                  }
                } else if (data.action === window.google.picker.Action.CANCEL) {
                  resolve(null);
                }
              })
              .build();

            picker.setVisible(true);
          } catch (err) {
            reject(err);
          }
        },
        onerror: () => {
          reject(new Error('Gagal memuat modul Google Picker'));
        }
      });
    });
  }

  // --- GOOGLE SHEETS METHODS ---

  /**
   * Create a new Google Spreadsheet for HBR II project
   */
  public async createProjectSpreadsheet(title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const body = {
      properties: { title },
      sheets: [
        { properties: { title: 'Master_Piers' } },
        { properties: { title: 'Daily_Progress' } },
        { properties: { title: 'Weekly_Cutoff' } },
        { properties: { title: 'Constraints' } },
        { properties: { title: 'Issues' } }
      ]
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru');
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl
    };
  }

  /**
   * Read metadata of a Google Spreadsheet
   */
  public async getSpreadsheetMeta(spreadsheetId: string): Promise<GoogleSpreadsheetMeta> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membaca metadata Google Spreadsheet');
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties?.title || 'Untitled Spreadsheet',
      sheets: (data.sheets || []).map((s: any) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title,
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount
      }))
    };
  }

  /**
   * Read rows from a Google Sheet range (e.g. "Master_Piers!A1:Z500")
   */
  public async readSheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gagal membaca range ${range} dari Google Sheets`);
    }

    const data = await res.json();
    return data.values || [];
  }

  /**
   * Write or overwrite rows to a Google Sheet range
   */
  public async writeSheetValues(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gagal menulis data ke Google Sheets pada range ${range}`);
    }

    return await res.json();
  }

  /**
   * Append rows to a Google Sheet
   */
  public async appendSheetValues(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menambahkan baris ke Google Sheets');
    }

    return await res.json();
  }

  /**
   * Batch update values across multiple tabs/ranges in 1 single HTTP request
   */
  public async batchUpdateValues(
    spreadsheetId: string,
    data: { range: string; values: any[][] }[]
  ): Promise<any> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const body = {
      valueInputOption: 'USER_ENTERED',
      data: data.map(d => ({
        range: d.range,
        majorDimension: 'ROWS',
        values: d.values
      }))
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal melakukan batch update ke Google Sheets');
    }

    return await res.json();
  }

  /**
   * Ensure specific tab names exist inside the 1 single Google Spreadsheet file
   */
  public async ensureTabsExist(spreadsheetId: string, requiredTabs: string[]): Promise<void> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const meta = await this.getSpreadsheetMeta(spreadsheetId);
    const existingTitles = new Set(meta.sheets.map(s => s.title));

    const missingTabs = requiredTabs.filter(t => !existingTitles.has(t));
    if (missingTabs.length === 0) return;

    const requests = missingTabs.map(t => ({
      addSheet: {
        properties: { title: t }
      }
    }));

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!res.ok) {
      const err = await res.json();
      console.warn('Could not add missing tabs, might already exist:', err);
    }
  }

  /**
   * Move a file into a specific Google Drive folder (e.g. database spreadsheet or uploaded photo)
   */
  public async moveFileToFolder(fileId: string, folderId: string): Promise<boolean> {
    const session = this.getSession();
    if (!session || !folderId || folderId === 'root') return false;

    try {
      // 1. Get current parents to remove them
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      let prevParents = '';
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.parents && Array.isArray(meta.parents)) {
          prevParents = meta.parents.join(',');
        }
      }

      // 2. Add target folder and remove old parents
      const params = new URLSearchParams({
        addParents: folderId,
        fields: 'id,parents'
      });
      if (prevParents) {
        params.append('removeParents', prevParents);
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params.toString()}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      return res.ok;
    } catch (e) {
      console.warn('Gagal memindahkan file ke folder target:', e);
      return false;
    }
  }

  /**
   * Find spreadsheets located inside the target Google Drive database folder
   */
  public async findDatabaseSpreadsheetsInFolder(folderId: string = DEFAULT_DATABASE_FOLDER.id): Promise<GoogleDriveFile[]> {
    return this.listSpreadsheets('', folderId);
  }

  /**
   * Create the Single Central Google Spreadsheet containing all 10 project tabs
   * and store it directly inside the designated Google Drive folder
   */
  public async createSingleDatabaseSpreadsheet(
    title: string = `DATABASE_MASTER_HBR2_PROYEK`,
    targetFolderId: string = DEFAULT_DATABASE_FOLDER.id
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const session = this.getSession();
    if (!session) throw new Error('Otentikasi Google diperlukan');

    const allTabs = [
      '01_Master_Piers',
      '02_WBS_Hierarchy',
      '03_Daily_Progress',
      '04_Weekly_Cutoff',
      '05_Monthly_MC',
      '06_BOQ_Contract',
      '07_Constraints_Log',
      '08_Issues_Action',
      '09_Resources',
      '10_Project_Profile'
    ];

    const body = {
      properties: { title },
      sheets: allTabs.map(t => ({ properties: { title: t } }))
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet database master');
    }

    const data = await res.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Place file into the designated Google Drive database folder
    if (targetFolderId) {
      await this.moveFileToFolder(spreadsheetId, targetFolderId);
    }

    const result = {
      spreadsheetId,
      spreadsheetUrl
    };

    // Save as stored database
    this.setStoredSpreadsheet({ id: result.spreadsheetId, title });
    return result;
  }

  // --- SETTINGS STORAGE ---
  public getStoredFolder(): { id: string; name: string; url?: string } {
    try {
      const v = localStorage.getItem(SELECTED_DRIVE_FOLDER_KEY);
      if (v) {
        const parsed = JSON.parse(v);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_DATABASE_FOLDER;
  }

  public setStoredFolder(folder: { id: string; name: string; url?: string } | null): void {
    if (folder) {
      localStorage.setItem(SELECTED_DRIVE_FOLDER_KEY, JSON.stringify(folder));
    } else {
      localStorage.removeItem(SELECTED_DRIVE_FOLDER_KEY);
    }
  }

  public getStoredSpreadsheet(): { id: string; title: string; url?: string; lastSync?: string } | null {
    try {
      const v = localStorage.getItem(SELECTED_SHEET_KEY);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }

  public setStoredSpreadsheet(sheet: { id: string; title: string; url?: string; lastSync?: string } | null): void {
    if (sheet) {
      if (!sheet.url) {
        sheet.url = `https://docs.google.com/spreadsheets/d/${sheet.id}`;
      }
      localStorage.setItem(SELECTED_SHEET_KEY, JSON.stringify(sheet));
    } else {
      localStorage.removeItem(SELECTED_SHEET_KEY);
    }
  }
}

export const SINGLE_SPREADSHEET_TABS = [
  '01_Master_Piers',
  '02_WBS_Hierarchy',
  '03_Daily_Progress',
  '04_Weekly_Cutoff',
  '05_Monthly_MC',
  '06_BOQ_Contract',
  '07_Constraints_Log',
  '08_Issues_Action',
  '09_Resources',
  '10_Project_Profile'
] as const;

export const googleWorkspace = new GoogleWorkspaceService();
