import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { useShop } from '@/src/contexts/ShopContext';
import { auth } from '@/src/lib/firebase';
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
  AlertTriangle,
  Info,
  Database,
  LogIn,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/Button';
import { ADMIN_ROUTE_ROLES } from '@/src/lib/rbac';
import { Order, Role } from '@/src/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  superOnly?: boolean;
}

const navGroups: { category: string; items: NavItem[] }[] = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ADMIN_ROUTE_ROLES.dashboard },
    ]
  },
  {
    category: 'Commerce & Logistics',
    items: [
      { name: 'Sales & Orders', path: '/admin/sales', icon: ShoppingBag, roles: ADMIN_ROUTE_ROLES.sales },
      { name: 'Catalog', path: '/admin/catalog', icon: Package, roles: ADMIN_ROUTE_ROLES.catalog },
      { name: 'Inventory', path: '/admin/inventory', icon: Box, roles: ADMIN_ROUTE_ROLES.inventory },
      { name: 'Logistics', path: '/admin/logistics', icon: Truck, roles: ADMIN_ROUTE_ROLES.logistics },
    ]
  },
  {
    category: 'Customers & Marketing',
    items: [
      { name: 'Suppliers', path: '/admin/suppliers', icon: Briefcase, roles: ADMIN_ROUTE_ROLES.suppliers },
      { name: 'Customers', path: '/admin/customers', icon: Users, roles: ADMIN_ROUTE_ROLES.customers },
      { name: 'Marketing', path: '/admin/marketing', icon: Megaphone, roles: ADMIN_ROUTE_ROLES.marketing },
    ]
  },
  {
    category: 'Merchandising & CMS',
    items: [
      { name: 'Content / CMS', path: '/admin/content', icon: FileText, roles: ADMIN_ROUTE_ROLES.content },
      { name: 'Gift Builder', path: '/admin/gift-builder', icon: Gift, roles: ADMIN_ROUTE_ROLES.giftBuilder },
    ]
  },
  {
    category: 'Intelligence & System',
    items: [
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart, roles: ADMIN_ROUTE_ROLES.analytics },
      { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ADMIN_ROUTE_ROLES.settings, superOnly: true },
      { name: 'Database Setup', path: '/admin/migration', icon: Database, roles: ADMIN_ROUTE_ROLES.migration, superOnly: true },
    ]
  }
];

const allNavItems = navGroups.flatMap(g => g.items);

interface OperationalAlert {
  id: string;
  title: string;
  text: string;
  type: 'urgent' | 'warning' | 'info';
  time: string;
  href: string;
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, effectiveRoles, isStaff, loading, authError, login, logout, hasRole } = useAuth();
  const { products } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);

  const canViewOrders = hasRole(ADMIN_ROUTE_ROLES.sales);

  useEffect(() => {
    let active = true;
    async function loadOperationalOrders() {
      if (loading || !isStaff || !canViewOrders || !auth.currentUser) {
        if (active) setLiveOrders([]);
        return;
      }
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (active && Array.isArray(data.orders)) {
          setLiveOrders(data.orders);
        }
      } catch {
        // Non-blocking header alert refresh
      }
    }
    loadOperationalOrders();
    return () => {
      active = false;
    };
  }, [loading, isStaff, canViewOrders, currentUser?.id, location.pathname]);

  const visibleNavGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasRole(item.roles)),
    }))
    .filter(group => group.items.length > 0);

  const activeGroup = visibleNavGroups.find(g => 
    g.items.some(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`)))
  );

  const operationalAlerts = useMemo<OperationalAlert[]>(() => {
    const alerts: OperationalAlert[] = [];

    liveOrders.forEach((order) => {
      if (order.status === 'READY_FOR_DELIVERY') {
        alerts.push({
          id: `ord-dispatch-${order.id}`,
          title: 'Pending Driver Assignment',
          text: `Order #${order.id} in ${order.deliveryCity || 'Kenya'} is packed and ready for dispatch.`,
          type: 'urgent',
          time: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'Active',
          href: `/admin/sales?order=${encodeURIComponent(order.id)}`,
        });
      } else if (order.status === 'STOCK_ISSUE') {
        alerts.push({
          id: `ord-stock-${order.id}`,
          title: 'Order Stock Issue',
          text: `Order #${order.id} requires stock reconciliation before fulfillment.`,
          type: 'urgent',
          time: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'Active',
          href: `/admin/sales?order=${encodeURIComponent(order.id)}`,
        });
      } else if (order.status === 'CONFIRMED' || order.status === 'PAYMENT_CONFIRMED') {
        alerts.push({
          id: `ord-confirmed-${order.id}`,
          title: 'Confirmed Order Queued',
          text: `Order #${order.id} for ${order.deliveryCity || 'Kenya'} (${order.recipientName || 'Recipient'}) is awaiting processing.`,
          type: 'info',
          time: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent',
          href: `/admin/sales?order=${encodeURIComponent(order.id)}`,
        });
      }
    });

    products
      .filter((p) => p.status !== 'ARCHIVED')
      .forEach((product) => {
        if (product.availability === 'OUT_OF_STOCK' || (product.inventory ?? 0) <= 0) {
          alerts.push({
            id: `prod-oos-${product.id}`,
            title: 'Out of Stock Alert',
            text: `${product.name} has 0 units available.`,
            type: 'urgent',
            time: 'Catalog',
            href: '/admin/inventory',
          });
        } else if ((product.inventory ?? 0) <= 5) {
          alerts.push({
            id: `prod-low-${product.id}`,
            title: 'Low Stock Warning',
            text: `${product.name} inventory is low (${product.inventory} units left).`,
            type: 'warning',
            time: 'Inventory',
            href: '/admin/inventory',
          });
        }
      });

    return alerts.slice(0, 8);
  }, [liveOrders, products]);

  const unreadCount = operationalAlerts.filter(a => !readNotifications.includes(a.id)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-dpc-blue animate-spin mb-3" />
        <p className="text-sm font-semibold text-navy">Loading Control Center...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full border border-neutral-200">
          <div className="w-14 h-14 bg-dpc-blue/10 text-dpc-blue rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            DPC
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Control Center Login</h2>
          <p className="text-sm text-text-muted mb-6">Sign in with your authorized staff Google account to access the management portal.</p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left">
              {authError}
            </div>
          )}

          <Button onClick={login} className="w-full h-11 font-bold gap-2 mb-5">
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </Button>

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-navy transition-colors">
            <Store className="w-4 h-4" /> Return to Customer Store
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full border border-red-200">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Unauthorized Access</h2>
          <p className="text-sm text-text-muted mb-6">
            Signed in as <span className="font-semibold text-navy">{currentUser.email}</span> ({effectiveRoles.join(', ') || 'CUSTOMER'}). Staff privileges are required to access the Control Center.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto">Return to Store</Button>
            </Link>
            <Button variant="outline" onClick={logout} className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50">
              Sign Out
            </Button>
          </div>
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
            {visibleNavGroups.map((group) => (
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
                        onClick={() => setReadNotifications(operationalAlerts.map(a => a.id))}
                        className="text-xs text-dpc-blue font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {operationalAlerts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-text-muted">
                        All clear — no pending operational alerts.
                      </div>
                    ) : (
                      operationalAlerts.map(alert => {
                        const isRead = readNotifications.includes(alert.id);
                        return (
                          <div 
                            key={alert.id} 
                            onClick={() => {
                              setReadNotifications(prev => prev.includes(alert.id) ? prev : [...prev, alert.id]);
                              setNotificationsOpen(false);
                              navigate(alert.href);
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:border-dpc-blue/40",
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
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Initials Badge */}
            <div className="flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded-full bg-dpc-blue text-white flex items-center justify-center font-semibold text-xs shadow-xs" 
                title={`${currentUser.firstName || currentUser.email} (${effectiveRoles.join(', ')})`}
              >
                {(currentUser.firstName?.charAt(0) || currentUser.email?.charAt(0) || 'A').toUpperCase()}
                {(currentUser.lastName?.charAt(0) || '').toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-navy leading-tight">
                  {currentUser.firstName || currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : currentUser.email}
                </div>
                <div className="text-[10px] text-text-muted leading-tight">{effectiveRoles[0] || 'STAFF'}</div>
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

