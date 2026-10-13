/* ─────────────────────────────────────────────────────────────────────────────
 * VideoPlayer.jsx — Full embedded YouTube player view (ad-free).
 *
 * Layout:
 *   ┌─────────────────────────────┬──────────────────┐
 *   │                             │  Related Videos  │
 *   │    YouTube iframe embed     │    (sidebar)     │
 *   │                             │                  │
 *   │─────────────────────────────│                  │
 *   │  Title / Channel / Meta     │                  │
 *   └─────────────────────────────┴──────────────────┘
 *
 * Uses the currently active tab's videoId from TabContext.
 * Related videos use topic-overlap scoring from videos.js.
 * ────────────────────────────────────────────────────────────────────────── */
import { useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { useTabs } from '../context/TabContext';
import { getRelatedVideos, videos } from '../data/videos';

export default function VideoPlayer() {
  const { activeTab, addTab } = useTabs();

  /* Resolve full video data (activeTab may only have a subset of fields) */
  const currentVideo = useMemo(
    () => videos.find((v) => v.videoId === activeTab.videoId) || activeTab,
    [activeTab],
  );

  /* Related videos scored by topic overlap */
  const related = useMemo(
    () => getRelatedVideos(activeTab.videoId, 12),
    [activeTab.videoId],
  );

  const embedUrl = `https://www.youtube.com/embed/${activeTab.videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-[1800px] mx-auto">
      {/* ══ Left: Player + Info ════════════════════════════════════════ */}
      <div className="flex-1 min-w-0">
        {/* Iframe */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            key={activeTab.videoId}
            src={embedUrl}
            title={activeTab.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Title */}
        <h1 className="mt-3 text-lg lg:text-xl font-semibold text-yt-text leading-snug">
          {activeTab.title}
        </h1>

        {/* Channel row + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
          {/* Channel */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-white shrink-0"
              style={{
                backgroundColor:
                  currentVideo.channelAvatarColor || '#606060',
              }}
            >
              {currentVideo.channelAvatar || '??'}
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-yt-text">
                {currentVideo.channelName || 'Unknown Channel'}
                <CheckCircle2 className="w-3.5 h-3.5 text-yt-muted" />
              </p>
              <p className="text-xs text-yt-muted">
                {currentVideo.views} • {currentVideo.uploadedAt}
              </p>
            </div>
            <button className="ml-3 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <ActionPill icon={ThumbsUp} label="12K" />
            <ActionPill icon={ThumbsDown} />
            <ActionPill icon={Share2} label="Share" />
            <ActionPill icon={Download} label="Download" />
            <ActionPill icon={Bookmark} label="Save" />
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <MoreHorizontal className="w-5 h-5 text-yt-text" />
            </button>
          </div>
        </div>

        {/* Description card */}
        <div className="mt-4 p-3 rounded-xl bg-[#272727] hover:bg-[#3a3a3a] transition-colors cursor-pointer">
          <p className="text-sm text-yt-text line-clamp-2">
            Welcome to this video. Learn more about{' '}
            {currentVideo.topics?.join(', ') || 'this topic'}. Enjoy watching
            ad-free on FeedForYou!
          </p>
          <span className="text-xs text-yt-muted font-medium mt-1 inline-block">
            Show more
          </span>
        </div>
      </div>

      {/* ══ Right: Related Videos ══════════════════════════════════════ */}
      <aside className="w-full lg:w-[400px] shrink-0 space-y-3">
        <h3 className="text-base font-semibold text-yt-text mb-2">
          Related Videos
        </h3>
        {related.map((vid) => (
          <RelatedCard key={vid.id} video={vid} onOpen={addTab} />
        ))}
      </aside>
    </div>
  );
}

/* ── Small sub-components ────────────────────────────────────────────────── */

function ActionPill({ icon: Icon, label }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#272727] hover:bg-[#3a3a3a] transition-colors text-sm text-yt-text">
      <Icon className="w-5 h-5" />
      {label && <span>{label}</span>}
    </button>
  );
}

function RelatedCard({ video, onOpen }) {
  return (
    <button
      onClick={() =>
        onOpen({
          type: 'video',
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          channelAvatar: video.channelAvatar,
          channelAvatarColor: video.channelAvatarColor,
          topics: video.topics,
        })
      }
      className="flex gap-2 w-full text-left group"
    >
      <div className="relative w-[168px] shrink-0 aspect-video rounded-lg overflow-hidden bg-yt-card">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <span className="absolute bottom-1 right-1 duration-badge text-white text-[10px]">
          {video.duration}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-yt-text line-clamp-2 leading-5">
          {video.title}
        </h4>
        <p className="mt-1 text-xs text-yt-muted">{video.channelName}</p>
        <p className="text-xs text-yt-muted">
          {video.views} • {video.uploadedAt}
        </p>
      </div>
    </button>
  );
}
