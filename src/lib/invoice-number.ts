// src/lib/invoice-number.ts
// Matches PHP: "KP-" + str_pad(order_id, 5, "0", STR_PAD_LEFT)
export function invoiceNumber(orderId: number): string {
  return `KP-${String(orderId).padStart(5, "0")}`;
}
