import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Landing from "./pages/Landing";
import Catalog from "./pages/user/Catalog";
import ProductDetail from "./pages/user/ProductDetail";
import StoreList from "./pages/user/StoreList";
import StoreDetail from "./pages/user/StoreDetail";
import OpenStore from "./pages/user/OpenStore";
import Checkout from "./pages/user/Checkout";
import Chat from "./pages/chat/Chat";
import Orders from "./pages/user/Orders";
import Profile from "./pages/user/Profile";
import Settings from "./pages/user/Settings";
import SellerDashboard from "./pages/store/Dashboard";
import SellerProducts from "./pages/store/Products";
import SellerOrders from "./pages/store/Orders";
import SellerSettings from "./pages/store/StoreSettings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStores from "./pages/admin/Stores";
import AdminUsers from "./pages/admin/Users";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";

function Guard({ children, adminOnly, sellerOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Memuat...</div>;
  if (user)
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/catalog"} replace />
    );
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnly>
                  <Register />
                </PublicOnly>
              }
            />

            <Route
              element={
                <Guard>
                  <Layout />
                </Guard>
              }
            >
              <Route path="catalog" element={<Catalog />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="stores" element={<StoreList />} />
              <Route path="stores/:id" element={<StoreDetail />} />
              <Route path="open-store" element={<OpenStore />} />
              <Route path="checkout/:id" element={<Checkout />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:partnerId" element={<Chat />} />
              <Route path="orders" element={<Orders />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/seller"
              element={
                <Guard>
                  <Layout />
                </Guard>
              }
            >
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="settings" element={<SellerSettings />} />
            </Route>

            <Route
              path="/admin"
              element={
                <Guard adminOnly>
                  <AdminLayout />
                </Guard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="stores" element={<AdminStores />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
