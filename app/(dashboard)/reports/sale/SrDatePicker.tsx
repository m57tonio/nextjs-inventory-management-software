'use client';

import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

export default function SrDatePicker({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const url = new URL(window.location.href);
    if (val) url.searchParams.set('date', val);
    else     url.searchParams.delete('date');
    url.searchParams.delete('page');
    router.replace(url.pathname + url.search);
  }

  return (
    <div style={{ position: 'relative', width: 190, flexShrink: 0 }}>
      <input
        type="date"
        className="gg-input gg-num"
        style={{ height: 42, paddingRight: 40 }}
        defaultValue={defaultDate}
        onChange={handleChange}
      />
      <Calendar
        size={17}
        style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--gray-500)', pointerEvents: 'none',
        }}
      />
    </div>
  );
}
