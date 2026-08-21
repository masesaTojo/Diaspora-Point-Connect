import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Settings, 
  BarChart, 
  FileText,
  Megaphone,
  LogOut,
  Bell,
  Box,
  Truck,
  Briefcase,
  Gift
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Sales & Orders', path: '/admin/sales', icon: ShoppingBag },
  { name: 'Catalog', path: '/admin/catalog', icon: Package },
  { name: 'Inventory', path: '/admin/inventory', icon: Box },
  { name: 'Logistics', path: '/admin/logistics', icon: Truck },
  { name: 'Suppliers', path: '/admin/suppliers', icon: Briefcase },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Marketing', path: '/admin/marketing', icon: Megaphone },
  { name: 'Content / CMS', path: '/admin/content', icon: FileText },
  { name: 'Gift Builder', path: '/admin/gift-builder', icon: Gift },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex-shrink-0 fixed inset-y-0 left-0 z-10 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-navy-dark">
          <Link to="/admin" className="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span className="text-dpc-yellow">DPC</span>
            <span>Control Center</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-dpc-blue text-white" 
                      : "text-gray-300 hover:bg-navy-dark hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-navy-dark">
          <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-navy-dark hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content area */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-border flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-display font-semibold text-navy">
             {navItems.find(item => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-muted hover:text-navy transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-dpc-yellow"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-dpc-blue text-white flex items-center justify-center font-semibold text-sm">
              SA
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
