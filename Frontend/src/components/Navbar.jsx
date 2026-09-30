import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ReceiptText,
  Users,
  User,
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  Package,
  Settings,
  LogOut,
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

  // Staff primary navigation links
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

  // Primary tabs for native mobile bottom bar
  const mobileBottomTabs = [
    { name: 'Billing', path: '/billing', icon: PlusCircle },
    { name: 'Bills', path: '/bills', icon: ReceiptText },
    { name: 'Customers', path: '/customers', icon: Users },
    ...(isAdmin || isManager
      ? [{ name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }]
      : [{ name: 'Profile', path: '/profile', icon: User }]),
  ];

  return (
    <>
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-13 sm:h-16 gap-2">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center min-w-0">
              <Link to="/billing" className="flex items-center space-x-2 sm:space-x-3 min-w-0 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs p-0.5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  <img src="/logo.png" alt="Taraaang Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate block">
                    <span className="sm:hidden">Taraaang POS</span>
                    <span className="hidden sm:inline">
                      {settings?.restaurantName || 'Taraaang Organic Food PVT LTD'}
                    </span>
                  </span>
                  <div className="flex items-center space-x-1 mt-0.5">
                    {user.outlets && user.outlets.length > 1 ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 leading-none">
                        {user.outlets.length} Branches
                      </span>
                    ) : user.outletId ? (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 truncate max-w-[130px] leading-none">
                        {user.outletId.name}
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 leading-none">
                        HQ
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {currentLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: User Status & Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Online / Offline Dot Indicator */}
              <div
                title={isOnline ? 'System Online' : 'System Offline (Cart is saved locally)'}
                className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200/80"
              >
                {isOnline ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden md:inline text-[11px] font-semibold text-emerald-700">Online</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse"></span>
                    </span>
                    <span className="text-[10px] font-bold text-red-600">Offline</span>
                  </>
                )}
              </div>

              {/* Profile Avatar / Initial */}
              <Link
                to="/profile"
                title={`${user.name} (${user.role})`}
                className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-800 font-bold text-xs flex items-center justify-center transition-colors active:scale-95"
              >
                {user.name.charAt(0).toUpperCase()}
              </Link>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="hidden sm:flex p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer (For all extended pages like Products, Staff, Outlets, Reports, Settings) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {/* User Info Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500">
                  <span className="font-bold text-orange-600 uppercase">{user.role}</span>
                  {user.outletId && ` • ${user.outletId.name}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Navigation Grid */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Navigation
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {currentLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Native Mobile Bottom Navigation Bar (Docked at bottom of screen for true mobile app feel) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                active ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full"></span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none">
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            mobileMenuOpen ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'scale-110' : ''}`} />
            {mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 leading-none">
            Menu
          </span>
        </button>
      </nav>
    </>
  );
}
