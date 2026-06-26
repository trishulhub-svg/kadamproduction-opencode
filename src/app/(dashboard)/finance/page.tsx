// src/app/(dashboard)/finance/page.tsx
import { Suspense } from "react";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { FinanceView } from "@/components/finance/FinanceView";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ startDate?: string; endDate?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  const sp = await searchParams;

  const conds = [isNull(schema.finance.deletedAt)];
  if (sp.startDate) conds.push(gte(schema.finance.date, sp.startDate));
  if (sp.endDate) conds.push(lte(schema.finance.date, sp.endDate));

  const [rows, orders, summaryRows, dueRow] = await Promise.all([
    db.select().from(schema.finance).where(and(...conds)).orderBy(desc(schema.finance.date)),
    db.select({ id: schema.orders.id, clientName: schema.orders.clientName }).from(schema.orders).where(isNull(schema.orders.deletedAt)),
    db
      .select({
        totalIncome: sql<number>`coalesce(sum(case when ${schema.finance.type} = 'income' then ${schema.finance.amount} end), 0)`,
        totalExpense: sql<number>`coalesce(sum(case when ${schema.finance.type} = 'expense' then ${schema.finance.amount} end), 0)`,
      })
      .from(schema.finance)
      .where(and(...conds)),
    db
      .select({
        v: sql<number>`coalesce(sum(
          case when ${schema.orders.totalBudget} > 0
          then max(0, ${schema.orders.totalBudget} - coalesce((
            select sum(${schema.finance.amount}) from ${schema.finance}
            where ${schema.finance.orderId} = ${schema.orders.id}
            and ${schema.finance.type} = 'income'
            and ${schema.finance.deletedAt} is null
          ), 0))
          else 0 end
        ), 0)`,
      })
      .from(schema.orders)
      .where(and(isNull(schema.orders.deletedAt), sql`${schema.orders.status} != 'cancelled'`)),
  ]);

  const totalIncome = Number(summaryRows[0]?.totalIncome ?? 0);
  const totalExpense = Number(summaryRows[0]?.totalExpense ?? 0);
  const totalDue = Number(dueRow[0]?.v ?? 0);
  const summary = { totalIncome, totalExpenses: totalExpense, netProfit: totalIncome - totalExpense, totalDue };

  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading finance…</div>}>
      <FinanceView
        transactions={rows.map((r) => ({ ...r, amount: Number(r.amount), orderLabel: orders.find((o) => o.id === r.orderId)?.clientName ?? null }))}
        summary={summary}
        orders={orders}
        startDate={sp.startDate}
        endDate={sp.endDate}
      />
    </Suspense>
  );
}
