"use client";

import { useState } from "react";
import AIButton from "./AIButton";
import AIWindow from "./AIWindow";

export default function AIChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AIButton onClick={() => setOpen(true)} />

      <AIWindow
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}