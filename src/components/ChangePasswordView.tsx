// src/components/ChangePasswordView.tsx
"use client";
import { useActionState } from "react";
import { Button, Input, Label, Card } from "@/components/ui";
import { changePasswordAction } from "@/server/auth-actions";

export function ChangePasswordView() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <Card className="max-w-md p-5">
      <form action={formAction} className="space-y-4">
        <div><Label>Current Password</Label><Input name="current" type="password" required /></div>
        <div><Label>New Password</Label><Input name="new" type="password" required minLength={6} /></div>
        <div><Label>Confirm New Password</Label><Input name="confirm" type="password" required minLength={6} /></div>
        {state && !state.ok && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-kp-danger">{state.error}</div>}
        {state && state.ok && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-kp-success">Password changed successfully.</div>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Updating…" : "Update Password"}</Button>
      </form>
    </Card>
  );
}
