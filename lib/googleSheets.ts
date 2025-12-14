import { google } from 'googleapis';

const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const getCleanPrivateKey = () => {
  if (!PRIVATE_KEY) return "";
  let key = PRIVATE_KEY.replace(/^"|"$/g, '');
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');
  return key;
};

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: CLIENT_EMAIL, private_key: getCleanPrivateKey() },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// --- AJUSTE: Mapeamento correto das colunas finais ---
const getEndCol = (sheetName: string) => {
  if (sheetName.includes('Financeiro')) return 'L'; // <--- MUDOU DE K PARA L
  if (sheetName.includes('Pedidos')) return 'F';
  return 'E';
};

export async function readSheetData(range: string) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: range, 
    });
    return result.data.values || [];
  } catch (error) {
    console.error('Erro ao ler planilha:', error);
    return [];
  }
}

export async function appendToSheet(range: string, values: any[]) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  } catch (error) { console.error('Erro Append:', error); }
}

export async function updateRowInSheet(sheetName: string, id: string, rowData: any[]) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${sheetName}!A:A`,
    });
    const rows = result.data.values;
    if (!rows) return;

    const rowIndex = rows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) return;

    const sheetRowNumber = rowIndex + 1;
    const endCol = getEndCol(sheetName);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      // Garante que o range de atualização cubra da A até a última coluna (K no Financeiro)
      range: `${sheetName}!A${sheetRowNumber}:${endCol}${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] }
    });
  } catch (error) { console.error('Erro Update Row:', error); }
}

export async function deleteRowInSheet(sheetName: string, id: string) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${sheetName}!A:A`,
    });
    const rows = result.data.values;
    if (!rows) return;

    const rowIndex = rows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) return;
    const sheetRowNumber = rowIndex + 1;
    const endCol = getEndCol(sheetName);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A${sheetRowNumber}:${endCol}${sheetRowNumber}`,
    });
  } catch (error) { console.error('Erro Delete Row:', error); }
}