import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import ExpenseForm from '../ExpenseForm';
import { createExpense } from '../actions';

export default async function CreateExpensePage() {
  const session = await auth();
  if (!session) redirect('/');

  const [warehouses, categories] = await Promise.all([
    db.warehouse.findMany({
      where:   { deletedAt: null },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true },
    }),
    db.expenseCategory.findMany({
      where:   { deletedAt: null },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true },
    }),
  ]);

  return (
    <ExpenseForm
      action={createExpense}
      mode="create"
      warehouses={warehouses}
      categories={categories}
    />
  );
}
