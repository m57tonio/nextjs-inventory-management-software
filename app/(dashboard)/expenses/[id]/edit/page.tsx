import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import ExpenseForm from '../../ExpenseForm';
import { updateExpense, type ExpenseState } from '../../actions';

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/');

  const { id } = await params;
  const expenseId = parseInt(id, 10);
  if (isNaN(expenseId)) notFound();

  const [expense, warehouses, categories] = await Promise.all([
    db.expense.findFirst({
      where:  { id: expenseId, deletedAt: null },
      select: {
        date:              true,
        title:             true,
        warehouseId:       true,
        expenseCategoryId: true,
        amount:            true,
        details:           true,
      },
    }),
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

  if (!expense) notFound();

  const action = updateExpense.bind(null, expenseId) as (
    prev: ExpenseState,
    formData: FormData,
  ) => Promise<ExpenseState>;

  return (
    <ExpenseForm
      action={action}
      mode="edit"
      initial={{
        date:              expense.date.toISOString().slice(0, 10),
        title:             expense.title,
        warehouseId:       expense.warehouseId,
        expenseCategoryId: expense.expenseCategoryId,
        amount:            expense.amount.toString(),
        details:           expense.details ?? '',
      }}
      warehouses={warehouses}
      categories={categories}
    />
  );
}
