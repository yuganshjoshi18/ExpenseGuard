import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Tags,
  Wallet,
  Repeat,
  BarChart3,
  FileText,
  Settings,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Recurring Expenses', href: '/recurring-expenses', icon: Repeat },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Import / Export', href: '/import-export', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-950 dark">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-dark-900 border-r border-dark-700 transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`flex h-16 items-center justify-between px-4 border-b border-dark-700 ${!sidebarOpen && 'justify-center'}`}>
            <NavLink to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && <span className="font-bold text-lg text-white">ExpenseGuard</span>}
            </NavLink>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-dark-400 hover:bg-dark-800 hover:text-white lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                    }
                    ${!sidebarOpen && 'justify-center'}
                  `}
                  title={sidebarOpen ? undefined : item.name}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t border-dark-700 ${!sidebarOpen && 'hidden'}`}>
            <div className="text-xs text-dark-500 text-center">
              ExpenseGuard v1.0.0
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu toggle button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 left-4 z-50 lg:hidden p-3 rounded-full bg-primary-600 text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main content */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}