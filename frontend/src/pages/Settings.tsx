import { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Moon, Sun, Bell, Shield, Database, Palette, Globe, Save, CheckCircle, Download } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'data' | 'advanced'>('appearance');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [recurringReminders, setRecurringReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Shield },
  ] as const;

  const currencies = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  ];

  const timezones = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)' },
    { value: 'UTC', label: 'UTC (UTC+0)' },
    { value: 'America/New_York', label: 'America/New_York (UTC-5/-4)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8/-7)' },
    { value: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1/+2)' },
  ];

  const handleSave = () => {
    // In a real app, this would save to backend/localStorage
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-dark-400">Manage your application preferences</p>
        </div>
        <div className="flex gap-3">
          {saved && (
            <Button variant="secondary" disabled>
              <CheckCircle className="w-4 h-4" />
              Saved
            </Button>
          )}
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-dark-700">
            <nav className="flex overflow-x-auto" role="tablist">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {([
                    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Dark navy interface' },
                    { value: 'light', label: 'Light', icon: Sun, desc: 'Light interface' },
                    { value: 'system', label: 'System', icon: Globe, desc: 'Follow system setting' },
                  ] as const).map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          theme === option.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            theme === option.value ? 'bg-primary-500/20' : 'bg-dark-800'
                          }`}>
                            <OptionIcon className={`w-5 h-5 ${theme === option.value ? 'text-primary-400' : 'text-dark-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{option.label}</p>
                            <p className="text-sm text-dark-400">{option.desc}</p>
                          </div>
                          {theme === option.value && (
                            <CheckCircle className="w-5 h-5 text-primary-400 ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4">Regional Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={currencies.map(c => ({ value: c.value, label: c.label }))}
                  />
                  <Select
                    label="Date Format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    options={dateFormats.map(d => ({ value: d.value, label: d.label }))}
                  />
                  <Select
                    label="Timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    options={timezones.map(t => ({ value: t.value, label: t.label }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive email updates about your account', checked: emailNotifications, onChange: setEmailNotifications },
                    { id: 'budget', label: 'Budget Alerts', desc: 'Get notified when budgets reach 80% or 100%', checked: budgetAlerts, onChange: setBudgetAlerts },
                    { id: 'recurring', label: 'Recurring Expense Reminders', desc: 'Reminders before recurring expenses execute', checked: recurringReminders, onChange: setRecurringReminders },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50 border border-dark-700 cursor-pointer hover:border-dark-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-dark-400">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4">Reports</h3>
                <div className="space-y-4">
                  {[
                    { id: 'weekly', label: 'Weekly Summary', desc: 'Receive weekly spending summary via email', checked: weeklyReport, onChange: setWeeklyReport },
                    { id: 'monthly', label: 'Monthly Report', desc: 'Receive detailed monthly financial report', checked: monthlyReport, onChange: setMonthlyReport },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50 border border-dark-700 cursor-pointer hover:border-dark-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-dark-400">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">Export All Data</p>
                        <p className="text-sm text-dark-400">Download a complete backup of your transactions, budgets, and settings</p>
                      </div>
                      <Button variant="outline" icon={<Download className="w-4 h-4" />}>Export Data</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">Delete All Data</p>
                        <p className="text-sm text-dark-400">Permanently delete all your transactions, budgets, and categories. This cannot be undone.</p>
                      </div>
                      <Button variant="destructive">Delete All Data</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="pt-6 border-t border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>
                <p className="text-dark-400 text-sm">
                  Your financial data is stored securely in our database. We do not share your data with third parties.
                  You can request a copy of your data or request deletion at any time through the data management options above.
                </p>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Developer Options</h3>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">Debug Mode</p>
                        <p className="text-sm text-dark-400">Enable detailed logging and error reporting</p>
                      </div>
                      <Input type="checkbox" className="w-12" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">API Base URL</p>
                        <p className="text-sm text-dark-400">Override the default API endpoint (for development)</p>
                      </div>
                      <Input
                        placeholder="/api"
                        className="w-full sm:w-64 font-mono text-sm"
                        value="/api"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="pt-6 border-t border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                <div className="space-y-2 text-dark-400">
                  <p><strong>ExpenseGuard</strong> v1.0.0</p>
                  <p>A full-stack expense tracker with automated testing</p>
                  <p>Built with React, Express, PostgreSQL, and TypeScript</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}