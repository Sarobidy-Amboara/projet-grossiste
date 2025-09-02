import * as XLSX from 'xlsx';

export interface ExportData {
  filename: string;
  data: any[];
  sheetName?: string;
}

export const exportToExcel = (exportData: ExportData) => {
  try {
    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();
    
    // Créer une worksheet avec les données
    const worksheet = XLSX.utils.json_to_sheet(exportData.data);
    
    // Ajouter la worksheet au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, exportData.sheetName || 'Données');
    
    // Télécharger le fichier
    XLSX.writeFile(workbook, `${exportData.filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    return false;
  }
};

export const formatDateForExcel = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    return dateString;
  }
};

export const formatCurrencyForExcel = (amount: number): string => {
  return `${amount.toLocaleString()} MGA`;
};
