import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from '../pages/Settings';

describe('Settings Page', () => {
  it('renders the header and default appearance tab', () => {
    render(<Settings />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /appearance/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('heading', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Regional Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows a saved confirmation after saving', () => {
    jest.useFakeTimers();
    try {
      render(<Settings />);

      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('displays the current regional settings', () => {
    render(<Settings />);

    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveValue('INR');
    expect(screen.getByRole('combobox', { name: 'Date Format' })).toHaveValue('DD/MM/YYYY');
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveValue('Asia/Kolkata');
  });

  it('updates regional settings', () => {
    render(<Settings />);

    const currency = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.change(currency, { target: { value: 'USD' } });
    expect(currency).toHaveValue('USD');

    const dateFormat = screen.getByRole('combobox', { name: 'Date Format' });
    fireEvent.change(dateFormat, { target: { value: 'YYYY-MM-DD' } });
    expect(dateFormat).toHaveValue('YYYY-MM-DD');

    const timezone = screen.getByRole('combobox', { name: 'Timezone' });
    fireEvent.change(timezone, { target: { value: 'UTC' } });
    expect(timezone).toHaveValue('UTC');
  });

  it('selects a different theme', () => {
    render(<Settings />);

    const darkTheme = screen.getByRole('button', { name: /^dark/i });
    const lightTheme = screen.getByRole('button', { name: /^light/i });

    expect(darkTheme).toHaveClass('border-primary-500');

    fireEvent.click(lightTheme);

    expect(lightTheme).toHaveClass('border-primary-500');
    expect(darkTheme).not.toHaveClass('border-primary-500');
  });

  it('switches to the notifications tab', () => {
    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: /notifications/i }));

    expect(screen.getByRole('tab', { name: /notifications/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('heading', { name: 'Email Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^email notifications/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^budget alerts/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^weekly summary/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^monthly report/i })).toBeChecked();
  });

  it('toggles a notification preference', () => {
    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: /notifications/i }));

    const budgetAlerts = screen.getByRole('checkbox', { name: /^budget alerts/i });
    expect(budgetAlerts).toBeChecked();

    fireEvent.click(budgetAlerts);

    expect(budgetAlerts).not.toBeChecked();
  });

  it('switches to the data tab', () => {
    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: /data & privacy/i }));

    expect(screen.getByRole('heading', { name: 'Data Management' })).toBeInTheDocument();
    expect(screen.getByText('Export All Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete all data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('switches to the advanced tab', () => {
    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: /advanced/i }));

    expect(screen.getByRole('heading', { name: 'Developer Options' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('/api')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText(/ExpenseGuard/)).toBeInTheDocument();
  });
});
