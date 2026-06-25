// src/components/scan/ScanView.tsx
"use client";
import { useState } from "react";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { ScanLine, ArrowRightLeft, Undo2, AlertTriangle } from "lucide-react";
import { scanItem } from "@/server/scan-actions";

type Action = "checkout" | "checkin" | "damaged";

export function ScanView({ ongoing }: { ongoing: { id: number; clientName: string; contactPerson: string | null; eventDate: string | null }[] }) {
  const [barcode, setBarcode] = useState("");
  const [action, setAction] = useState<Action>("checkout");
  const [orderId, setOrderId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    try {
      const res = await scanItem(barcode, action, orderId ? Number(orderId) : undefined);
      setMsg({ ok: true, text: res.msg });
      setBarcode("");
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Scan Item</h1>
      <p className="mb-5 text-sm text-gray-500">Enter an item barcode to check out, return, or mark damaged.</p>

      <Card className="max-w-xl p-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Action</Label>
            <div className="grid grid-cols-3 gap-2">
              <ActionBtn active={action === "checkout"} onClick={() => setAction("checkout")} icon={ArrowRightLeft} label="Move to Event" />
              <ActionBtn active={action === "checkin"} onClick={() => setAction("checkin")} icon={Undo2} label="Return to Stock" />
              <ActionBtn active={action === "damaged"} onClick={() => setAction("damaged")} icon={AlertTriangle} label="Mark Damaged" />
            </div>
          </div>

          {action === "checkout" && (
            <div>
              <Label>Select Ongoing Event</Label>
              <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">— choose event —</option>
                {ongoing.map((o) => (
                  <option key={o.id} value={o.id}>#{o.id} {o.contactPerson ?? o.clientName}</option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label>Barcode</Label>
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input autoFocus value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="KP…" className="pl-9 font-mono" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Processing…" : "Submit Scan"}</Button>
        </form>

        {msg && (
          <div className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-kp-success" : "bg-red-50 text-kp-danger"}`}>
            {msg.text}
          </div>
        )}
      </Card>
    </div>
  );
}

function ActionBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof ScanLine; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition ${active ? "border-kp-primary bg-blue-50 text-kp-primary ring-2 ring-blue-400/30" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
    >
      <Icon className="h-5 w-5" /> {label}
    </button>
  );
}
