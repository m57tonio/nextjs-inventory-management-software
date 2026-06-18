import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { can } from '@/lib/can';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/');

  const denied = await can('Manage Pos Screen');
  if (denied) {
    return (
      <div className="pos-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-600)', fontSize: 15 }}>{denied}</p>
      </div>
    );
  }

  return <div className="pos-shell">{children}</div>;
}
