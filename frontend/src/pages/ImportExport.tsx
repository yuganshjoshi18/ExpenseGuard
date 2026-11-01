import { useState } from 'react';
import axios from 'axios';
import { csvApi, type Transaction } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertTriangle, CheckCircle, XCircle, Download, Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  imported: number;
  errors: Array<{ row: number; field: string; message: string; value?: string }>;
  transactions: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>>;
}

export function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setError(null);
    try {
      const result = await csvApi.import(selectedFile, skipDuplicates);
      setImportResult(result);
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(message || 'Import failed');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await csvApi.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Export failed');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await csvApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download template', err);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Import / Export</h1>
          <p className="text-dark-400">Import transactions from CSV or export your data</p>
        </div>
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="label" htmlFor="csv-file">Select CSV File</label>
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file"
              />
              <label htmlFor="csv-file" className="cursor-pointer">
                <FileText className="w-12 h-12 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-300">Drag and drop a CSV file or click to browse</p>
                <p className="text-sm text-dark-500 mt-1">Max size: 10MB</p>
              </label>
            </div>
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-dark-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="skip-duplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="skip-duplicates" className="text-sm text-dark-300">
              Skip duplicate transactions (based on title, amount, date, and category)
            </label>
          </div>

          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            loading={importing}
            icon={<Upload className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Import Transactions
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <Button variant="outline" onClick={handleDownloadTemplate} icon={<Download className="w-4 h-4" />}>
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-dark-800/50 text-center">
                <p className="text-2xl font-bold text-white">{formatNumber(importResult.total)}</p>
                <p className="text-sm text-dark-400">Total Rows</p>
              </div>
              <div className="p-4 rounded-lg bg-green-900/30 text-center border border-green-900/50">
                <p className="text-2xl font-bold text-green-400">{formatNumber(importResult.imported)}</p>
                <p className="text-sm text-dark-400">Imported</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-900/30 text-center border border-blue-900/50">
                <p className="text-2xl font-bold text-blue-400">{formatNumber(importResult.valid)}</p>
                <p className="text-sm text-dark-400">Valid</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-900/30 text-center border border-yellow-900/50">
                <p className="text-2xl font-bold text-yellow-400">{formatNumber(importResult.duplicates)}</p>
                <p className="text-sm text-dark-400">Duplicates</p>
              </div>
              <div className="p-4 rounded-lg bg-red-900/30 text-center border border-red-900/50">
                <p className="text-2xl font-bold text-red-400">{formatNumber(importResult.invalid)}</p>
                <p className="text-sm text-dark-400">Invalid</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Errors ({importResult.errors.length})
                </h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-dark-400 border-b border-dark-700">
                        <th className="p-2">Row</th>
                        <th className="p-2">Field</th>
                        <th className="p-2">Message</th>
                        <th className="p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.slice(0, 50).map((err, idx) => (
                        <tr key={idx} className="border-b border-dark-700/50">
                          <td className="p-2 text-white">{err.row}</td>
                          <td className="p-2 text-dark-300">{err.field}</td>
                          <td className="p-2 text-red-400">{err.message}</td>
                          <td className="p-2 text-dark-500 font-mono text-xs">{err.value || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.errors.length > 50 && (
                    <p className="text-sm text-dark-400 text-center py-2">
                      Showing first 50 of {importResult.errors.length} errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-dark-400">
            Export all your transactions to a CSV file. The export includes all transaction fields
            including ID, title, amount, type, category, date, description, payment method, and timestamps.
          </p>
          <Button
            onClick={handleExport}
            disabled={exporting}
            loading={exporting}
            icon={<Download className="w-4 h-4" />}
          >
            Export All Transactions
          </Button>
        </CardContent>
      </Card>

      {/* CSV Format Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2">Required Columns</h4>
              <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`title,amount,type,category,date,description,paymentMethod`}</pre>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Example</h4>
              <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`title,amount,type,category,date,description,paymentMethod
Grocery Shopping,120.50,EXPENSE,Food,2024-01-15,Weekly groceries,CARD
Salary,5000.00,INCOME,Other,2024-01-01,January salary,BANK_TRANSFER
Gas Station,45.00,EXPENSE,Transportation,2024-01-10,Fuel,CARD`}</pre>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Supported Date Formats</h4>
              <ul className="list-disc list-inside space-y-1 text-dark-300">
                <li>YYYY-MM-DD (2024-01-15)</li>
                <li>DD/MM/YYYY (15/01/2024)</li>
                <li>MM/DD/YYYY (01/15/2024)</li>
                <li>DD-MM-YYYY (15-01-2024)</li>
                <li>YYYY/MM/DD (2024/01/15)</li>
                <li>DD.MM.YYYY (15.01.2024)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Valid Categories</h4>
              <p className="text-dark-400 text-sm">
                Categories must match existing category names (case-insensitive). Default categories: Food, Transportation, Shopping, Entertainment, Healthcare, Education, Bills, Rent, Travel, Other.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Valid Types</h4>
              <p className="text-dark-400 text-sm">INCOME or EXPENSE (case-insensitive)</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Valid Payment Methods</h4>
              <p className="text-dark-400 text-sm">CASH, CARD, BANK_TRANSFER, UPI, OTHER (case-insensitive, optional)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}