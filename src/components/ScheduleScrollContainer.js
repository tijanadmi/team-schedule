"use client";

import { useLayoutEffect, useRef } from "react";

// A refresh can remount the table. Keep positions outside its React lifecycle.
// This in-memory cache is discarded on a full page load (including login/logout).
const positions = new Map();

export default function ScheduleScrollContainer({ scrollKey, children }) {
  const container = useRef(null);

  // Restore before paint on both initial mount and server-rendered updates.
  // Layout effects also run again when a Suspense boundary reveals the table.
  useLayoutEffect(() => {
    const position = positions.get(scrollKey);
    if (!position) return;
    container.current.scrollLeft = position.left;
    container.current.scrollTop = position.top;
  });

  function rememberPosition() {
    const element = container.current;
    // Hiding the table during loading can generate a zero-position scroll event.
    if (!element || element.getClientRects().length === 0) return;
    positions.set(scrollKey, {
      left: element.scrollLeft,
      top: element.scrollTop,
    });
  }

  return (
    <div
      ref={container}
      onScroll={rememberPosition}
      onChangeCapture={rememberPosition}
      className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md"
    >
      {children}
    </div>
  );
}
