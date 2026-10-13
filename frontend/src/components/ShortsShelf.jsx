/* ─────────────────────────────────────────────────────────────────────────────
 * ShortsShelf.jsx — Horizontal "Shorts" shelf (YouTube-style).
 *
 * Red Shorts diamond icon, "Shorts" heading, and a horizontally scrollable
 * row of 9:16 aspect-ratio cards with view counts.
 * ────────────────────────────────────────────────────────────────────────── */
import { shorts } from '../data/videos';
import { useTabs } from '../context/TabContext';

/* Custom YouTube Shorts icon (red diamond with play triangle) */
function ShortsIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 14.65v-5.3L15 12l-5 2.65z"
        fill="white"
      />
      <path
        d="M17.77 10.32c-.42-.34-.82-.7-1.18-1.1a4.17 4.17 0 0 1-.84-1.67 4.24 4.24 0 0 1 .64-3.72 1 1 0 0 0-.15-1.4A1 1 0 0 0 14.84 2.6a6.2 6.2 0 0 0-1.93 5.28c-.58-.58-1.24-1.06-1.96-1.42A6.2 6.2 0 0 0 5.5 5.74a1 1 0 0 0-1 1.74 4.25 4.25 0 0 1 1.92 3.2 4.25 4.25 0 0 1-.88 3.2c-.36.4-.76.76-1.18 1.1a6.2 6.2 0 0 0-2.22 4.17 1 1 0 0 0 .88 1.1 1 1 0 0 0 1.1-.88 4.25 4.25 0 0 1 1.53-2.86c.58.58 1.24 1.06 1.96 1.42a6.2 6.2 0 0 0 5.44.72 1 1 0 0 0 .6-1.28 1 1 0 0 0-1.28-.6 4.25 4.25 0 0 1-3.73-.5 4.25 4.25 0 0 1-1.92-3.2 4.25 4.25 0 0 1 .88-3.2c.36-.4.76-.76 1.18-1.1a6.2 6.2 0 0 0 2.22-4.17c.58.58 1.24 1.06 1.96 1.42a6.2 6.2 0 0 0 5.44.72 4.25 4.25 0 0 1-.5 2.26 4.25 4.25 0 0 1-2.86 1.92 1 1 0 0 0-.72 1.22 1 1 0 0 0 1.22.72 6.2 6.2 0 0 0 4.17-2.82 6.2 6.2 0 0 0 .72-5.44c-.2-.62-.82-.96-1.42-.84z"
        fill="#FF0000"
      />
    </svg>
  );
}

export default function ShortsShelf() {
  const { addTab } = useTabs();

  if (shorts.length === 0) return null;

  const handleShortClick = (short) => {
    addTab({
      type: 'video',
      videoId: short.videoId,
      title: short.title,
      thumbnail: short.thumbnail,
      channelName: 'Shorts',
      channelAvatar: '▶',
      channelAvatarColor: '#FF0000',
      topics: short.topics || [],
    });
  };

  return (
    <section className="py-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-6 h-6">
          <ShortsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-yt-text">Shorts</h2>
      </div>

      {/* ── Horizontal scroll row ──────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {shorts.map((short) => (
          <button
            key={short.id}
            onClick={() => handleShortClick(short)}
            className="group shrink-0 w-[160px] text-left select-none focus:outline-none"
          >
            {/* 9:16 thumbnail */}
            <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-yt-card">
              <img
                src={short.thumbnail}
                alt={short.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs font-medium text-white line-clamp-2 leading-4">
                  {short.title}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">
                  {short.views}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
