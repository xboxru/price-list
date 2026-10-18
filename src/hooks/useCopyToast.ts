import { useCallback, useRef, useState } from "react";

export interface ToastState {
  id: number;
  message: string;
}

function legacyCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* noop */
  }
  document.body.removeChild(ta);
}

export function useCopyToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const copy = useCallback((text: string, message?: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    } else {
      legacyCopy(text);
    }
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message: message ?? "Скопировано в буфер обмена" });
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  return { toast, copy };
}
