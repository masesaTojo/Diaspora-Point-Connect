import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
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
  Gift,
  Menu,
  X,
  Store,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/Button';
import { mockUsers } from '@/src/lib/mockData';

const navGroups = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Commerce & Logistics',
    items: [
      { name: 'Sales & Orders', path: '/admin/sales', icon: ShoppingBag },
      { name: 'Catalog', path: '/admin/catalog', icon: Package },
      { name: 'Properties', path: '/admin/properties', icon: Building2 },
      { name: 'Inventory', path: '/admin/inventory', icon: Box },
      { name: 'Logistics', path: '/admin/logistics', icon: Truck },
    ]
  },
  {
    category: 'Partners & Customers',
    items: [
      { name: 'Suppliers', path: '/admin/suppliers', icon: Briefcase },
      { name: 'Customers', path: '/admin/customers', icon: Users },
      { name: 'Marketing', path: '/admin/marketing', icon: Megaphone },
    ]
  },
  {
    category: 'Merchandising & CMS',
    items: [
      { name: 'Content / CMS', path: '/admin/content', icon: FileText },
      { name: 'Gift Builder', path: '/admin/gift-builder', icon: Gift },
    ]
  },
  {
    category: 'Intelligence & System',
    items: [
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ]
  }
];

const allNavItems = navGroups.flatMap(g => g.items);

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  const activeGroup = navGroups.find(g => 
    g.items.some(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`)))
  );

  const mockAdminAlerts = [
    { id: 'al-1', title: 'Pending Driver Assignment', text: 'Order #DPC-849201 in Nairobi is packed and ready for dispatch.', type: 'urgent', time: '10m ago' },
    { id: 'al-2', title: 'Low Stock Warning', text: 'Belgian Chocolate Cake inventory reached threshold (5 units left).', type: 'warning', time: '1h ago' },
    { id: 'al-3', title: 'Diaspora Advertiser Verified', text: 'Equity Bank Diaspora Mortgages profile is active.', type: 'info', time: '3h ago' },
  ];

  const unreadCount = mockAdminAlerts.filter(a => !readNotifications.includes(a.id)).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full border border-neutral-200">
          <div className="w-14 h-14 bg-dpc-blue/10 text-dpc-blue rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            DPC
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Control Center Login</h2>
          <p className="text-sm text-text-muted mb-6">Select an administrative profile to access the management portal.</p>
          
          <div className="space-y-2 mb-6 text-left">
            {mockUsers.map(user => (
              <button
                key={user.id}
                onClick={() => login(user.email)}
                className="w-full p-3 rounded-xl border border-neutral-200 hover:border-dpc-blue hover:bg-blue-50/50 flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="font-semibold text-navy text-sm group-hover:text-dpc-blue">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-text-muted">{user.roles.join(', ')} • {user.email}</div>
                </div>
                <span className="text-xs font-semibold text-dpc-blue bg-blue-100 px-2.5 py-1 rounded-full group-hover:bg-dpc-blue group-hover:text-white transition-colors">
                  Login
                </span>
              </button>
            ))}
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-navy transition-colors">
            <Store className="w-4 h-4" /> Return to Customer Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-navy/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-navy text-white flex-shrink-0 fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-navy-dark">
          <Link to="/admin" className="font-display text-xl font-bold text-white flex items-center space-x-2">
            <span className="text-dpc-yellow">DPC</span>
            <span>Control Center</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-4 px-3">
            {navGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {group.category}
                </div>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`));
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive 
                          ? "bg-dpc-blue text-white shadow-xs font-semibold" 
                          : "text-gray-300 hover:bg-navy-dark hover:text-white"
                      )}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-navy-dark space-y-2">
          <Link 
            to="/" 
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-navy-dark hover:text-white transition-colors"
          >
            <Store className="mr-3 h-5 w-5 text-emerald-400" />
            Live Storefront
          </Link>
          <button 
            onClick={() => { logout(); navigate('/'); }} 
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-300 rounded-md hover:bg-navy-dark hover:text-red-200 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-navy lg:hidden rounded-lg hover:bg-neutral-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg sm:text-xl font-display font-semibold text-navy truncate">
                {allNavItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`)))?.name || 'Dashboard'}
              </h1>
              {activeGroup && (
                <span className="hidden sm:inline text-xs text-text-muted font-medium">
                  • {activeGroup.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link 
              to="/" 
              target="_blank" 
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-dpc-blue bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>View Customer Store</span>
            </Link>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-text-muted hover:text-navy transition-colors relative rounded-lg hover:bg-neutral-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-dpc-yellow text-navy text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-2">
                    <h4 className="font-bold text-navy text-sm">Control Center Alerts</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => setReadNotifications(mockAdminAlerts.map(a => a.id))}
                        className="text-xs text-dpc-blue font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {mockAdminAlerts.map(alert => {
                      const isRead = readNotifications.includes(alert.id);
                      return (
                        <div 
                          key={alert.id} 
                          onClick={() => setReadNotifications(prev => [...prev, alert.id])}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                            isRead ? "bg-white border-neutral-100 opacity-70" : "bg-neutral-50 border-neutral-200 font-medium"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-navy flex items-center gap-1.5">
                              {alert.type === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                              {alert.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                              {alert.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500" />}
                              {alert.title}
                            </span>
                            <span className="text-[10px] text-text-muted">{alert.time}</span>
                          </div>
                          <p className="text-text-muted leading-relaxed">{alert.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Initials Badge */}
            <div className="flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded-full bg-dpc-blue text-white flex items-center justify-center font-semibold text-xs shadow-xs" 
                title={`${currentUser.firstName} ${currentUser.lastName} (${currentUser.roles.join(', ')})`}
              >
                {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-navy leading-tight">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-[10px] text-text-muted leading-tight">{currentUser.roles[0]}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Sub-Navigation Bar */}
        {activeGroup && activeGroup.items.length > 1 && (
          <div className="bg-white border-b border-neutral-200/80 px-4 sm:px-8 py-2 overflow-x-auto flex items-center gap-2">
            <span className="text-xs font-bold text-navy mr-2 shrink-0 hidden md:inline">
              {activeGroup.category}:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeGroup.items.map(subItem => {
                const isSubActive = location.pathname === subItem.path || (subItem.path !== '/admin' && location.pathname.startsWith(`${subItem.path}/`));
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.path}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5",
                      isSubActive 
                        ? "bg-navy text-white shadow-xs" 
                        : "text-text-muted hover:text-navy hover:bg-neutral-100"
                    )}
                  >
                    <subItem.icon className="w-3.5 h-3.5" />
                    <span>{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

