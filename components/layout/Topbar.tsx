'use client';

import { usePathname } from 'next/navigation';
import { Menu, Monitor, Grid2X2, ChevronDown, LayoutDashboard, Users, Boxes, Receipt, ShoppingCart, Repeat, Wallet, ShieldCheck, Warehouse, BarChart3, DollarSign, Languages, LayoutTemplate, Settings, SlidersHorizontal, FileText } from 'lucide-react';

const PAGE_META: Record<string, { title: string; icon: React.ReactNode }> = {
  '/dashboard':           { title: 'Dashboard',          icon: <LayoutDashboard size={18} /> },
  '/products':            { title: 'Products',            icon: <Boxes size={18} /> },
  '/product-categories':  { title: 'Product Categories',  icon: <Boxes size={18} /> },
  '/brands':              { title: 'Brands',              icon: <Boxes size={18} /> },
  '/adjustments':         { title: 'Adjustments',         icon: <SlidersHorizontal size={18} /> },
  '/quotations':          { title: 'Quotations',          icon: <FileText size={18} /> },
  '/purchases':           { title: 'Purchases',           icon: <Receipt size={18} /> },
  '/purchases-returns':   { title: 'Purchases Returns',   icon: <Receipt size={18} /> },
  '/sales':               { title: 'Sales',               icon: <ShoppingCart size={18} /> },
  '/sales-returns':       { title: 'Sales Returns',       icon: <ShoppingCart size={18} /> },
  '/transfers':           { title: 'Transfers',           icon: <Repeat size={18} /> },
  '/expenses':            { title: 'Expenses',            icon: <Wallet size={18} /> },
  '/expense-categories':  { title: 'Expense Categories',  icon: <Wallet size={18} /> },
  '/customers':           { title: 'Customers',           icon: <Users size={18} /> },
  '/suppliers':           { title: 'Suppliers',           icon: <Users size={18} /> },
  '/users':               { title: 'Users',               icon: <Users size={18} /> },
  '/roles':               { title: 'Roles / Permissions', icon: <ShieldCheck size={18} /> },
  '/warehouse':           { title: 'Warehouse',           icon: <Warehouse size={18} /> },
  '/reports':             { title: 'Reports',             icon: <BarChart3 size={18} /> },
  '/currencies':          { title: 'Currencies',          icon: <DollarSign size={18} /> },
  '/languages':           { title: 'Languages',           icon: <Languages size={18} /> },
  '/templates/sms':       { title: 'SMS Templates',       icon: <LayoutTemplate size={18} /> },
  '/templates/email':     { title: 'Email Templates',     icon: <LayoutTemplate size={18} /> },
  '/settings':            { title: 'Settings',            icon: <Settings size={18} /> },
};

type TopbarProps = {
  onToggleSidebar: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname];

  return (
    <header className="gg-topbar">
      <button className="gg-icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">
        <Menu size={19} />
      </button>
      {meta && (
        <div className="gg-topbar-title">
          <span className="gg-page-chip">{meta.icon}</span>
          <span className="gg-breadcrumb">{meta.title}</span>
        </div>
      )}
      <div className="gg-topbar-spacer" />
      <button className="gg-pos-btn">
        <Monitor size={16} />
        POS
      </button>
      <button className="gg-icon-btn">
        <Grid2X2 size={19} />
      </button>
      <div className="gg-user">
        <div className="gg-avatar">A</div>
        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>admin</span>
        <ChevronDown size={16} style={{ color: 'var(--gray-400)' }} />
      </div>
    </header>
  );
}
