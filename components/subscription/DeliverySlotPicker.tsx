"use client";

import { DELIVERY_SLOTS, type DeliverySlotId } from "@/lib/deliverySlotRules";

export default function DeliverySlotPicker({
  value,
  onChange,
  unavailable = [],
}: {
  value?: DeliverySlotId;
  onChange: (slot: DeliverySlotId) => void;
  unavailable?: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {DELIVERY_SLOTS.map((slot) => {
        const disabled = unavailable.includes(slot.id);
        const selected = value === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected ? "border-primary bg-primary/10" : "border-border"
            } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary"}`}
          >
            <div className="font-semibold">{slot.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {disabled ? "Full / unavailable" : "Available"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
