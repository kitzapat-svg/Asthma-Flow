// lib/sheets.ts
import { google } from 'googleapis';
import { normalizeHN } from '@/lib/helpers';


const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Helper: แปลงข้อมูลแถวเป็น Object
const arrayToObject = (headers: string[], rows: any[][]) => {
  return rows.map((row) => {
    let obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
};

const formatPatient = (row: string[]) => {
  return {
    hn: row[0] || "",
    prefix: row[1] || "",
    first_name: row[2] || "",
    last_name: row[3] || "",
    dob: row[4] || "",
    best_pefr: row[5] || "",
    height: row[6] || "",
    status: row[7] || "Active",
    public_token: row[8] || "",
    phone: row[9] || "",
  };
};

export async function getSheetData(tabName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    if (tabName === 'patients') {
      return rows.slice(1).map(formatPatient);
    }

    return arrayToObject(rows[0], rows.slice(1));
  } catch (error) {
    console.error(`Error fetching ${tabName}:`, error);
    return [];
  }
}

export async function appendData(tabName: string, values: any[]) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    return { success: true };
  } catch (error) {
    console.error("Append Error:", error);
    return { success: false, error };
  }
}

export async function updatePatientStatus(tabName: string, hn: string, newStatus: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return { success: false, error: "No data found" };

    const rowIndex = rows.findIndex((row) => normalizeHN(row[0]) === normalizeHN(hn)) + 1;

    if (rowIndex === 0) return { success: false, error: "HN not found" };

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!H${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newStatus]] }
    });

    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error };
  }
}

// --- ฟังก์ชันใหม่: แก้ไขข้อมูลผู้ป่วย (Edit) ---
export async function updatePatientData(tabName: string, hn: string, data: any[]) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
    });
    const rows = response.data.values;
    if (!rows) return { success: false, error: "No data found" };

    const rowIndex = rows.findIndex((row) => normalizeHN(row[0]) === normalizeHN(hn)) + 1;

    if (rowIndex === 0) return { success: false, error: "HN not found" };

    // อัปเดตทั้งแถว (A ถึง J) 
    // data ที่ส่งมาต้องเรียง: [HN, Prefix, First, Last, DOB, PEFR, Height, Status, Token, Phone]
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A${rowIndex}:J${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [data] }
    });

    return { success: true };
  } catch (error) {
    console.error("Update Patient Error:", error);
    return { success: false, error };
  }
}

// --- ฟังก์ชันใหม่: ลบข้อมูล (Delete) ---
export async function deleteRow(tabName: string, hn: string) {
  try {
    // 1. หา SheetId ของ Tab นั้นๆ (จำเป็นสำหรับการลบ)
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tabName);
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) return { success: false, error: "Sheet not found" };

    // 2. หาบรรทัดที่ต้องการลบ
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
    });
    const rows = response.data.values;
    if (!rows) return { success: false, error: "No data found" };

    const rowIndex = rows.findIndex((row) => normalizeHN(row[0]) === normalizeHN(hn)); // index ใน array (เริ่ม 0)

    if (rowIndex === -1) return { success: false, error: "HN not found" };
    if (rowIndex === 0) return { success: false, error: "Cannot delete header" }; // ป้องกันลบหัวตาราง

    // 3. สั่งลบแถว
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error };
  }
}
