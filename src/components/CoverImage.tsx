import { useGameCover } from "../hooks/useGameCover";

interface CoverViewProps {
  title: string;
  src: string | null;
  pending?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
}

/** Только отображение: картинка или заглушка с названием */
export function CoverView({ title, src, pending, className, loading = "lazy" }: CoverViewProps) {
  if (src) return <img className={className} src={src} alt={title} loading={loading} />;

  return (
    <div
      className={`store-thumb-placeholder ${pending ? "is-loading" : ""}`}
      aria-label={title}
    >
      <span>{title}</span>
    </div>
  );
}

interface CoverImageProps {
  title: string;
  cover?: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/** Картинка игры: своя `cover` или автоподбор по названию */
export default function CoverImage({ title, cover, className, loading }: CoverImageProps) {
  const { src, loading: pending } = useGameCover(title, cover);
  return <CoverView title={title} src={src} pending={pending} className={className} loading={loading} />;
}
