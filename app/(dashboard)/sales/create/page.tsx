import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import SaleForm from '../SaleForm';

export default async function CreateSalePage() {
  const session = await auth();
  if (!session) redirect('/');

  const [warehouses, customers, units, defaultCustomer] = await Promise.all([
    db.warehouse.findMany({
      where:   { deletedAt: null },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.customer.findMany({
      where:   { deletedAt: null },
      select:  { id: true, name: true, isDefault: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
    db.unit.findMany({
      where:   { deletedAt: null },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.customer.findFirst({
      where:  { isDefault: true, deletedAt: null },
      select: { id: true },
    }),
  ]);

  return (
    <>
      <div className="page-head">
        <h1 className="gg-page-title">Create Sale</h1>
        <Link href="/sales" className="gg-btn gg-btn--secondary gg-btn--sm">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <SaleForm
        warehouses={warehouses}
        customers={customers}
        units={units}
        defaultCustomerId={defaultCustomer?.id ?? 0}
      />
    </>
  );
}
