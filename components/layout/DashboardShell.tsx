'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`gg-app${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="gg-main">
        <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="gg-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
