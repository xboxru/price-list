import { useEffect, useState } from "react";
import { fetchGameMeta, getCachedMeta, type GameMeta } from "../lib/coverLookup";

/**
 * Возвращает обложку и жанры игры по названию.
 * Обложка: явно заданная `cover` → кэш → поиск в RAWG.
 * Жанры всегда берутся из RAWG (если ключ задан).
 */
export function useGameCover(title: string, cover?: string, query?: string) {
  const [meta, setMeta] = useState<GameMeta | null>(() => getCachedMeta(title));
  const [pending, setPending] = useState(() => !getCachedMeta(title));

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedMeta(title);
    setMeta(cached);
    setPending(!cached);
    if (cached) return;

    fetchGameMeta(title, query).then((result) => {
      if (cancelled) return;
      setMeta(result);
      setPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [title, query]);

  const src = cover ?? meta?.image ?? null;
  return {
    src,
    loading: !cover && pending,
    genres: meta?.genres ?? [],
  };
}
