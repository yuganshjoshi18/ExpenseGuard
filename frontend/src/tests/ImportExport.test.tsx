import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExport } from '../pages/ImportExport';
import { csvApi } from '../services/api';

jest.mock('../services/api', () => ({
  csvApi: {
    import: jest.fn(),
    export: jest.fn(),
    downloadTemplate: jest.fn(),
  },
}));

const mockedCsvApi = csvApi as jest.Mocked<typeof csvApi>;

describe('ImportExport Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom does not implement navigation; prevent the download anchors from navigating.
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders import and export sections', () => {
    render(<ImportExport />);

    expect(screen.getByRole('heading', { name: 'Import Transactions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Export Transactions' })).toBeInTheDocument();
  });

  it('shows file input for CSV import', () => {
    render(<ImportExport />);

    const fileInput = screen.getByLabelText(/select csv file/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.csv');
  });

  it('validates file type on import', async () => {
    render(<ImportExport />);

    const fileInput = screen.getByLabelText(/select csv file/i);
    const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [txtFile] } });

    expect(await screen.findByText('Please select a CSV file')).toBeInTheDocument();
  });

  it('imports a valid CSV and displays results', async () => {
    mockedCsvApi.import.mockResolvedValue({
      total: 5,
      valid: 4,
      invalid: 1,
      duplicates: 2,
      imported: 2,
      errors: [{ row: 3, field: 'amount', message: 'Invalid amount' }],
      transactions: [],
    });

    render(<ImportExport />);

    const fileInput = screen.getByLabelText(/select csv file/i);
    const csvFile = new File(
      ['title,amount,type,category,date\nTest,100,EXPENSE,Food,2024-01-15'],
      'test.csv',
      { type: 'text/csv' }
    );

    fireEvent.change(fileInput, { target: { files: [csvFile] } });
    fireEvent.click(screen.getByRole('button', { name: /import transactions/i }));

    await waitFor(() => {
      expect(mockedCsvApi.import).toHaveBeenCalledWith(csvFile, true);
    });

    expect(await screen.findByText('Import Results')).toBeInTheDocument();
    expect(screen.getByText('Invalid amount')).toBeInTheDocument();
  });

  it('calls export API when export is clicked', async () => {
    mockedCsvApi.export.mockResolvedValue(new Blob(['csv,data'], { type: 'text/csv' }));

    render(<ImportExport />);

    fireEvent.click(screen.getByRole('button', { name: /export all transactions/i }));

    await waitFor(() => {
      expect(mockedCsvApi.export).toHaveBeenCalled();
    });
  });

  it('downloads the CSV template', async () => {
    mockedCsvApi.downloadTemplate.mockResolvedValue(new Blob(['template'], { type: 'text/csv' }));

    render(<ImportExport />);

    fireEvent.click(screen.getByRole('button', { name: /download template/i }));

    await waitFor(() => {
      expect(mockedCsvApi.downloadTemplate).toHaveBeenCalled();
    });
  });
});
