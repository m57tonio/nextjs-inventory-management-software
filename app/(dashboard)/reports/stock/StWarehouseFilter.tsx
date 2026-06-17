'use client';

import { useRouter } from 'next/navigation';

type Warehouse = { id: number; name: string };

export default function StWarehouseFilter({
  warehouses,
  selectedId,
}: {
  warehouses: Warehouse[];
  selectedId: number;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    url.searchParams.set('wh', e.target.value);
    url.searchParams.delete('page');
    router.replace(url.pathname + url.search);
  }

  return (
    <div className="wh-filter">
      <label>Warehouse :</label>
      <select className="gg-select" defaultValue={selectedId} onChange={handleChange}>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    </div>
  );
}
