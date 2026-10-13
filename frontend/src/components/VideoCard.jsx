/* ─────────────────────────────────────────────────────────────────────────────
 * VideoCard.jsx — YouTube-styled video card.
 *
 * 16:9 thumbnail with duration badge, channel avatar (initials circle),
 * 2-line clamped title, channel name, views, relative timestamp, and
 * three-dot context menu trigger.
 *
 * Clicking a card adds a watch tab via TabContext.
 * ────────────────────────────────────────────────────────────────────────── */
import { useState } from 'react';
import { MoreVertical, Clock, CheckCircle2 } from 'lucide-react';
import { useTabs } from '../context/TabContext';

export default function VideoCard({ video }) {
  const { addTab } = useTabs();
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleClick = () => {
    addTab({
      type: 'video',
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      channelAvatar: video.channelAvatar,
      channelAvatarColor: video.channelAvatarColor,
      topics: video.topics,
    });
  };

  return (
    <article
      className="group cursor-pointer select-none"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* ── Thumbnail ─────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-yt-card">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-yt-card" />
        )}

        {/* Duration badge */}
        <span className="absolute bottom-1.5 right-1.5 duration-badge text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </span>
      </div>

      {/* ── Meta ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mt-3">
        {/* Channel Avatar */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: video.channelAvatarColor || '#606060' }}
        >
          {video.channelAvatar}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-5 text-yt-text line-clamp-2">
            {video.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-yt-muted">
            {video.channelName}
            <CheckCircle2 className="w-3 h-3 text-yt-muted" />
          </p>
          <p className="text-xs text-yt-muted">
            {video.views} • {video.uploadedAt}
          </p>
        </div>

        {/* Three-dot menu */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="self-start p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-yt-text" />
        </button>
      </div>
    </article>
  );
}
