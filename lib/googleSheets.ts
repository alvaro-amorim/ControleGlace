import { google } from 'googleapis';

// --- FUNÇÃO PARA LIMPAR A CHAVE (RESOLVE O ERRO 500) ---
const getPrivateKey = () => {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return '';
  
  // Remove aspas extras e converte o \n literal em quebra de linha real
  return key.replace(/\\n/g, '\n').replace(/"/g, '');
};

const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = getPrivateKey();
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; 

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// --- LER DADOS (Genérico) ---
export const getSheetData = async (range: string) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range, 
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Erro ao ler planilha:', error);
    throw error;
  }
};

// --- ESCREVER (Adicionar ao final) ---
export const appendToSheet = async (range: string, values: any[]) => {
  try {
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
  } catch (error) {
    console.error(`Erro ao escrever na aba ${range}:`, error);
    throw error; // Lança o erro para sabermos se falhou
  }
};

// --- ATUALIZAR LINHA ---
export const updateRowInSheet = async (sheetName: string, id: string, newValues: any[]) => {
  // Busca em qual linha está esse ID
  const rows = await getSheetData(`${sheetName}!A:A`); // Lê só a coluna A (IDs)
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) return; // Não achou

  // Atualiza a linha exata (rowIndex + 1)
  const range = `${sheetName}!A${rowIndex + 1}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newValues] },
  });
};

// --- DELETAR LINHA (Limpar conteúdo) ---
export const deleteRowInSheet = async (sheetName: string, id: string) => {
   const rows = await getSheetData(`${sheetName}!A:A`);
   const rowIndex = rows.findIndex((row) => row[0] === id);
   if (rowIndex === -1) return;

   const range = `${sheetName}!A${rowIndex + 1}:M${rowIndex + 1}`; // Limpa de A até M
   
   await sheets.spreadsheets.values.clear({
     spreadsheetId: SPREADSHEET_ID,
     range,
   });
};