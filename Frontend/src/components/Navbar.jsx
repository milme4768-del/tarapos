import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ReceiptText,
  Users,
  User,
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  Package,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const { user, settings, logout } = useAuthStore();
  const { isOnline } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Staff primary navigation links (Section 5: "Staff should primarily see New Bill, Bills, Customers, Profile")
  const staffLinks = [
    { name: 'New Bill', path: '/billing', icon: PlusCircle },
    { name: 'Bills', path: '/bills', icon: ReceiptText },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Admin/Manager extended links
  const adminLinks = [
    { name: 'Billing', path: '/billing', icon: PlusCircle },
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Bills', path: '/bills', icon: ReceiptText },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    ...(isAdmin ? [{ name: 'Outlets', path: '/admin/outlets', icon: Store }] : []),
    ...(isAdmin ? [{ name: 'Staff', path: '/admin/staff', icon: Users }] : []),
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    ...(isAdmin ? [{ name: 'Settings', path: '/admin/settings', icon: Settings }] : []),
  ];

  const currentLinks = isAdmin || isManager ? adminLinks : staffLinks;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Outlet Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link to="/billing" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-none block">
                  {settings?.restaurantName || 'Taraaang Organic Food PVT LTD'}
                </span>
                {user.outletId && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      {user.outletId.name || 'Central'} ({user.outletId.code})
                    </span>
                  </div>
                )}
                {isAdmin && !user.outletId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                    Admin HQ
                  </span>
                )}
              </div>
            </Link>

            {/* Network indicator */}
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-600" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {currentLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-2">
            <Link
              to="/profile"
              className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 leading-none">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-500 uppercase leading-none mt-0.5">{user.role}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-150">
          <div className="py-2 border-b border-slate-100 mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role.toUpperCase()} • {user.outletId?.name || 'All Outlets'}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {currentLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
