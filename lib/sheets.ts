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

// --- ฟังก์ชันใหม่: บันทึก Activity Log ---
// --- ฟังก์ชันใหม่: ลบ Logs เก่าเกิน 60 วัน ---
export async function cleanOldLogs(retentionDays: number = 60) {
  try {
    // 1. หา SheetId ของ Tab 'logs'
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'logs');
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) return;

    // 2. ดึงข้อมูล Timestamp (Column A)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'logs!A:A',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return; // ไม่มีข้อมูล หรือมีแค่หัวตาราง

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

    // 3. หาว่าต้องลบถึงแถวไหน (สมมติว่า logs เรียงตามเวลา: เก่า -> ใหม่)
    // แต่ปกติ append จะต่อท้าย แปลว่า เก่าสุดอยู่บนสุด (แถว 2 ถ้านับหัวตาราง)
    let deleteCount = 0;

    // เริ่มเช็คจากแถวที่ 2 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const timestampStr = rows[i][0];
      // แปลง Timestamp กลับเป็น Date object
      // รูปแบบที่บันทึก: "YYYY-MM-DD HH:mm:ss" (เพื่อความชัวร์ในการ parse)
      const logDate = new Date(timestampStr);

      if (!isNaN(logDate.getTime()) && logDate < cutoffDate) {
        deleteCount++;
      } else {
        // ถ้าเจอแถวที่ไม่เกินกำหนดแล้ว หยุดเช็ค (เพราะแถวต่อๆ ไปก็น่าจะใหม่กว่า)
        break;
      }
    }

    if (deleteCount > 0) {
      console.log(`Cleaning up ${deleteCount} old log entries...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 1, // เริ่มที่แถว 2 (0-indexed คือ 1)
                endIndex: 1 + deleteCount
              }
            }
          }]
        }
      });
    }

  } catch (error) {
    console.error("Clean Logs Error:", error);
  }
}

// --- ฟังก์ชันใหม่: บันทึก Activity Log ---
export async function logActivity(email: string, action: string, details: string) {
  try {
    // ใช้ format มาตรฐานที่ parse ง่าย: YYYY-MM-DD HH:mm:ss
    // ใช้ Intl.DateTimeFormat เพื่อให้ได้ Christian Year แน่นอน
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').split('.')[0];

    // Logs columns: [Timestamp, Email, Action, Details]
    await appendData('logs', [timestamp, email, action, details]);

    // Cleanup: สุ่มทำ 10% ของครั้งที่มีการเขียน Log เพื่อไม่ให้หน่วงทุกครั้ง
    if (Math.random() < 0.1) {
      // ทำแบบ Fire-and-forget (ไม่ต้องรอ await) แต่ใน Serverless อาจต้องระวัง
      // ในที่นี้ใส่ await ไว้ก่อนเพื่อความชัวร์ หรือจะปล่อยลอยก็ได้ถ้า host รองรับ
      await cleanOldLogs(60);
    }

    return { success: true };
  } catch (error) {
    console.error("Log Activity Error:", error);
    // ไม่ throw error เพื่อไม่ให้กระทบ flow หลัก
    return { success: false, error };
  }
}

// --- User Management Functions ---

export async function getUsers() {
  return await getSheetData('users');
}

export async function getUserByUsername(username: string) {
  const users = await getUsers();
  if (!Array.isArray(users)) return null;
  return users.find((u: any) => u.username === username);
}

export async function createUser(user: any) {
  // user: [username, password_hash, role, name, email]
  return await appendData('users', user);
}

export async function updateUser(username: string, data: any[]) {
  // data: Full row [username, password_hash, role, name, email]
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'users!A:A',
    });
    const rows = response.data.values;
    if (!rows) return { success: false, error: "No data found" };

    const rowIndex = rows.findIndex((row) => row[0] === username) + 1; // 1-based index

    if (rowIndex <= 0) return { success: false, error: "User not found" };

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `users!A${rowIndex}:F${rowIndex}`, // Expanded to F (6 columns)
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [data] }
    });

    return { success: true };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, error };
  }
}

export async function deleteUser(username: string) {
  return await deleteRow('users', username); // Reusing generic deleteRow since it searches by Column A (username)
}

// --- Medication Functions ---

import { Medication } from '@/lib/types';

export async function getLatestMedication(hn: string): Promise<Medication | null> {
  // Medications Tab Structure: [HN, Date, C1_Name, C1_Puffs, C1_Freq, C2_Name, C2_Puffs, C2_Freq, R_Name, R_Label, Note]
  const rows = await getSheetData('medications');
  if (!Array.isArray(rows)) return null;

  // Filter by HN
  const patientMeds = rows.filter((row: any) => normalizeHN(row[0]) === normalizeHN(hn));

  if (patientMeds.length === 0) return null;

  // Sort by Date (Column B / Index 1) Descending
  patientMeds.sort((a: any, b: any) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

  const latest = patientMeds[0];
  return {
    hn: latest[0],
    date: latest[1],
    c1_name: latest[2],
    c1_puffs: latest[3],
    c1_freq: latest[4],
    c2_name: latest[5],
    c2_puffs: latest[6],
    c2_freq: latest[7],
    reliever_name: latest[8],
    reliever_label: latest[9],
    note: latest[10]
  };
}

export async function saveMedication(data: string[]) {
  return await appendData('medications', data);
}

// --- Medication List Management (Admin) ---

// Generic Delete Row by Value in Specific Column (0-indexed)
export async function deleteRowByValue(tabName: string, value: string, columnIndex: number = 0) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tabName);
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) return { success: false, error: "Sheet not found" };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:B`, // Read enough columns
    });
    const rows = response.data.values;
    if (!rows) return { success: false, error: "No data found" };

    const rowIndex = rows.findIndex((row) => row[columnIndex] === value);

    if (rowIndex === -1) return { success: false, error: "Value not found" };
    // Prevent deleting header if index is 0, but for list it might be okay if no header? assume header exists.
    if (rowIndex === 0) return { success: false, error: "Cannot delete header" };

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
    console.error("Delete Row Error:", error);
    return { success: false, error };
  }
}

export async function getMedicationList() {
  // Tab 'medication_list': Column A = Type, Column B = Name
  const rows = await getSheetData('medication_list');
  if (!Array.isArray(rows)) return { controllers: [], relievers: [] };

  const controllers = rows.filter((r: any) => r.Type === 'Controller').map((r: any) => r.Name);
  const relievers = rows.filter((r: any) => r.Type === 'Reliever').map((r: any) => r.Name);

  return { controllers, relievers };
}

export async function addMedicationItem(type: 'Controller' | 'Reliever', name: string) {
  return await appendData('medication_list', [type, name]);
}

export async function deleteMedicationItem(name: string) {
  // Delete by Name (Column B -> Index 1)
  return await deleteRowByValue('medication_list', name, 1);
}
