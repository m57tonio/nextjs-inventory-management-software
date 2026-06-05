'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';

type Props = {
  children:    React.ReactNode;
  userName:    string;
  userInitial: string;
};

export default function DashboardShell({ children, userName, userInitial }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`gg-app${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="gg-main">
        <Topbar
          onToggleSidebar={() => setCollapsed((v) => !v)}
          userName={userName}
          userInitial={userInitial}
        />
        <main className="gg-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
