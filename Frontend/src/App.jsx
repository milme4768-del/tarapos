import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Common Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Core Mobile Billing Pages (Eagerly loaded for instant mobile response)
import Login from './pages/Login';
import Billing from './pages/Billing';
import Bills from './pages/Bills';
import Customers from './pages/Customers';
import Profile from './pages/Profile';

// Admin Pages (Lazy-loaded on demand to keep staff bundle featherlight)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ProductsManager = lazy(() => import('./pages/admin/ProductsManager'));
const CategoriesManager = lazy(() => import('./pages/admin/CategoriesManager'));
const OutletsManager = lazy(() => import('./pages/admin/OutletsManager'));
const StaffManager = lazy(() => import('./pages/admin/StaffManager'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/billing" replace />;
  }

  return children;
};

export default function App() {
  const { user, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        {user && <Navbar />}

        <main className="flex-1">
          <Routes>
            {/* Public Login */}
            <Route path="/login" element={<Login />} />

            {/* Staff & Common Routes */}
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bills"
              element={
                <ProtectedRoute>
                  <Bills />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin & Manager Routes (Code-split with Suspense) */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingSpinner message="Loading products..." />}>
                    <ProductsManager />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingSpinner message="Loading categories..." />}>
                    <CategoriesManager />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/outlets"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingSpinner message="Loading outlets..." />}>
                    <OutletsManager />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingSpinner message="Loading staff..." />}>
                    <StaffManager />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Suspense fallback={<LoadingSpinner message="Loading reports..." />}>
                    <Reports />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? '/billing' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
