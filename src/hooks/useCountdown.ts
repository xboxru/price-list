import { useEffect, useState } from "react";

const MSK_OFFSET_MS = 3 * 3600_000;

/** Next Monday 00:00 Moscow time, as UTC epoch ms */
export function nextResetTimestamp(now: Date = new Date()): number {
  const mskNow = new Date(now.getTime() + MSK_OFFSET_MS);
  const day = mskNow.getUTCDay(); // 0=Sun, 1=Mon ...
  const daysUntilMonday = (8 - day) % 7 || 7;
  const resetWall = Date.UTC(
    mskNow.getUTCFullYear(),
    mskNow.getUTCMonth(),
    mskNow.getUTCDate() + daysUntilMonday,
    0, 0, 0, 0
  );
  return resetWall - MSK_OFFSET_MS;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function useCountdown(): CountdownParts & { label: string } {
  const [target, setTarget] = useState(() => nextResetTimestamp());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (now >= target) setTarget(nextResetTimestamp(new Date(now + 1000)));
  }, [now, target]);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    label: `${days} дн · ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}
