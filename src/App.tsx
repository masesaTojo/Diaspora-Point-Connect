import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ShopProvider } from './contexts/ShopContext';

// Customer Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Account from './pages/customer/Account';
import GiftBuilder from './pages/customer/GiftBuilder';

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

export default function App() {
  return (
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
            <Route path="discover" element={<div className="p-12 text-center text-text-muted">Discover Placeholder</div>} />
            <Route path="services" element={<div className="p-12 text-center text-text-muted">Services Placeholder</div>} />
          </Route>

        {/* Control Center Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<Orders />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="content" element={<Content />} />
          <Route path="gift-builder" element={<GiftBuilderManager />} />
          <Route path="analytics" element={<div className="text-center py-12 text-text-muted">Analytics Dashboard Placeholder</div>} />
          <Route path="settings" element={<div className="text-center py-12 text-text-muted">Settings Placeholder</div>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-xl text-navy">404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  </ShopProvider>
  );
}
