// src/app/(dashboard)/page.tsx — Dashboard
import { Plus, Boxes, CircleCheck, AlertTriangle, CalendarClock, CalendarCheck, Users, FolderOpen, ClipboardList } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats, countAssignedOrders } from "@/lib/queries";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    const assigned = await countAssignedOrders(user.id);
    return (
      <div>
        <Header name={user.name} role="EMPLOYEE" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Assigned Orders" value={assigned} tone="primary" href="/my-tasks" icon={ClipboardList} />
        </div>
        <Card className="mt-6 p-5">
          <p className="text-sm text-gray-600">
            Welcome! Use the <span className="font-semibold">Scan Item</span> feature to check items in/out for your assigned events.
            Check <span className="font-semibold">My Tasks</span> to see your upcoming events.
          </p>
        </Card>
      </div>
    );
  }

  const s = await getDashboardStats();
  return (
    <div>
      <Header name={user.name} role="ADMIN" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Create New Order" value="New" tone="purple" href="/orders?new=1" icon={Plus} />
        <StatCard label="Total Items" value={s.totalItems} tone="primary" href="/inventory" icon={Boxes} />
        <StatCard label="Available" value={s.available} tone="success" href="/inventory" icon={CircleCheck} />
        <StatCard label="On Events" value={s.busy} tone="warning" href="/inventory" icon={CalendarClock} />
        <StatCard label="Damaged" value={s.damaged} tone="danger" href="/inventory" icon={AlertTriangle} />
        <StatCard label="Ongoing Orders" value={s.ongoingOrders} tone="info" href="/orders?status=ongoing" icon={CalendarClock} />
        <StatCard label="Upcoming" value={s.upcomingOrders} tone="secondary" href="/orders?status=upcoming" icon={CalendarCheck} />
        <StatCard label="Employees" value={s.employees} tone="dark" href="/employees" icon={Users} />
        <StatCard label="Categories" value={s.categories} tone="success" href="/categories" icon={FolderOpen} />
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Quick Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Info title="Inventory Status">
            <Stat k="Available" v={s.available} /> <Stat k="On Event" v={s.busy} /> <Stat k="Damaged" v={s.damaged} />
          </Info>
          <Info title="Active Events">
            <p className="text-sm text-gray-600">
              <StatusBadge status="ongoing" /> {s.ongoingOrders} ongoing · <StatusBadge status="upcoming" /> {s.upcomingOrders} upcoming
            </p>
          </Info>
          <Info title="Team">
            <p className="text-sm text-gray-600">{s.employees} employees on staff</p>
          </Info>
        </div>
      </Card>
    </div>
  );
}

function Header({ name, role }: { name: string; role: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {name}!</h1>
        <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening today</p>
      </div>
      <span className="rounded-lg bg-kp-primary px-3 py-1.5 text-sm font-semibold text-white">{role}</span>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  );
}
function Stat({ k, v }: { k: string; v: number }) {
  return (
    <span className="mr-3 inline-flex items-center gap-1 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{v}</span> {k}
    </span>
  );
}
