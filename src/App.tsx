import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ShopProvider } from './contexts/ShopContext';
import { AuthProvider } from './contexts/AuthContext';
import { RequireRole } from './components/auth/RequireRole';
import { STAFF_ROLES, ADMIN_ROUTE_ROLES } from './lib/rbac';

// Customer Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Account from './pages/customer/Account';
import GiftBuilder from './pages/customer/GiftBuilder';
import TrackOrder from './pages/customer/TrackOrder';
import Support from './pages/customer/Support';
import FAQ from './pages/customer/FAQ';
import Shipping from './pages/customer/Shipping';
import Returns from './pages/customer/Returns';
import AboutUs from './pages/customer/AboutUs';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Catalog from './pages/admin/Catalog';
import Customers from './pages/admin/Customers';
import Inventory from './pages/admin/Inventory';
import Logistics from './pages/admin/Logistics';
import Suppliers from './pages/admin/Suppliers';
import Marketing from './pages/admin/Marketing';
import Content from './pages/admin/Content';
import GiftBuilderManager from './pages/admin/GiftBuilderManager';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import SystemMigration from './pages/admin/SystemMigration';

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Facing Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/category/:categorySlug" element={<Shop />} />
            <Route path="shop/collection/:collectionSlug" element={<Shop />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="account" element={<Account />} />
            <Route path="gift-builder" element={<GiftBuilder />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="support" element={<Support />} />
            <Route path="contact" element={<AboutUs />} />
            <Route path="track" element={<TrackOrder />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="returns" element={<Returns />} />
          </Route>

        {/* Control Center Routes */}
        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles={STAFF_ROLES} title="Control Center">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.dashboard}><Dashboard /></RequireRole>} />
          <Route path="sales" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.sales}><Orders /></RequireRole>} />
          <Route path="catalog" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.catalog}><Catalog /></RequireRole>} />
          <Route path="inventory" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.inventory}><Inventory /></RequireRole>} />
          <Route path="logistics" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.logistics}><Logistics /></RequireRole>} />
          <Route path="suppliers" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.suppliers}><Suppliers /></RequireRole>} />
          <Route path="customers" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.customers}><Customers /></RequireRole>} />
          <Route path="marketing" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.marketing}><Marketing /></RequireRole>} />
          <Route path="content" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.content}><Content /></RequireRole>} />
          <Route path="gift-builder" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.giftBuilder}><GiftBuilderManager /></RequireRole>} />
          <Route path="migration" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.migration}><SystemMigration /></RequireRole>} />
          <Route path="analytics" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.analytics}><Analytics /></RequireRole>} />
          <Route path="settings" element={<RequireRole allowedRoles={ADMIN_ROUTE_ROLES.settings}><Settings /></RequireRole>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl text-navy">404 - Page Not Found</div>} />
      </Routes>
        </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
}
