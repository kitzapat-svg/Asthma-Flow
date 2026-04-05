// lib/sheets.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Sycnhronizes a Supabase table to a Google Sheet tab by overwriting it.
 * @param tabName The name of the sheet tab (e.g., 'patients')
 * @param headers The header row (array of strings)
 * @param rows The data rows (array of arrays)
 */
export async function syncTableToSheet(tabName: string, headers: string[], rows: any[][]) {
  try {
    // 1. Clear the entire sheet first
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:Z`,
    });

    // 2. Prepare the full data set (headers + rows)
    const fullData = [headers, ...rows];

    // 3. Update with new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: fullData },
    });

    return { success: true };
  } catch (error) {
    console.error(`Sync Error for ${tabName}:`, error);
    return { success: false, error };
  }
}

// Keep a few legacy constants for reference in the backup job
export const SHEET_TABS = {
  PATIENTS: 'patients',
  VISITS: 'visits',
  DRPS: 'drps',
  MEDICATIONS: 'medications',
  TECHNIQUE: 'technique_checks',
  ADVICE: 'staff_advice',
  USERS: 'users',
  MED_LIST: 'medication_list',
  LOGS: 'logs'
};
