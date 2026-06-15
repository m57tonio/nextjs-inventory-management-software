'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// ── Permission guard ──────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['admin', 'manager'] as const;

async function requirePermission(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return 'Not authenticated.';
  if (!ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return 'You do not have permission to manage expense categories.';
  }
  return null;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required.').max(100, 'Name is too long.'),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionState = { error?: string; success?: boolean };

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExpenseCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await requirePermission();
  if (denied) return { error: denied };

  const parsed = schema.safeParse({ name: (formData.get('name') as string)?.trim() });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed.' };
  }

  await db.expenseCategory.create({ data: { name: parsed.data.name } });

  revalidatePath('/expense-categories');
  return { success: true };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateExpenseCategory(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await requirePermission();
  if (denied) return { error: denied };

  // Re-read server-side — never trust the client for which record to mutate
  const existing = await db.expenseCategory.findFirst({
    where:  { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { error: 'Expense category not found.' };

  const parsed = schema.safeParse({ name: (formData.get('name') as string)?.trim() });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed.' };
  }

  await db.expenseCategory.update({
    where: { id },
    data:  { name: parsed.data.name },
  });

  revalidatePath('/expense-categories');
  return { success: true };
}

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export async function deleteExpenseCategory(id: number): Promise<ActionState> {
  const denied = await requirePermission();
  if (denied) return { error: denied };

  const existing = await db.expenseCategory.findFirst({
    where:  { id, deletedAt: null },
    select: { name: true },
  });
  if (!existing) return { error: 'Expense category not found.' };

  // Block if any expense records reference this category
  const expenseCount = await db.expense.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (expenseCount > 0) {
    return {
      error: `"${existing.name}" cannot be deleted — it is referenced by ` +
             `${expenseCount} expense${expenseCount === 1 ? '' : 's'}. ` +
             `Remove or reassign those expenses first.`,
    };
  }

  await db.expenseCategory.update({ where: { id }, data: { deletedAt: new Date() } });

  revalidatePath('/expense-categories');
  return { success: true };
}
