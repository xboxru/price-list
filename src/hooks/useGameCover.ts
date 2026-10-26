import { useEffect, useState } from "react";
import { fetchGameMeta, getCachedMeta, type GameMeta } from "../lib/coverLookup";

/**
 * Возвращает обложку и жанры игры по названию.
 * Обложка: явно заданная `cover` → кэш → индекс game-covers/index.json.
 * Жанры берутся оттуда же.
 */
export function useGameCover(title: string, cover?: string) {
  const [meta, setMeta] = useState<GameMeta | null>(() => getCachedMeta(title));
  const [pending, setPending] = useState(() => !getCachedMeta(title));

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedMeta(title);
    setMeta(cached);
    setPending(!cached);
    if (cached) return;

    fetchGameMeta(title).then((result) => {
      if (cancelled) return;
      setMeta(result);
      setPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [title]);

  const src = cover ?? meta?.image ?? null;
  return {
    src,
    loading: !cover && pending,
    genres: meta?.genres ?? [],
  };
}
