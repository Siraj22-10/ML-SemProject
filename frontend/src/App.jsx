/* ─────────────────────────────────────────────────────────────────────────────
 * App.jsx — Root layout & tab-driven content routing with Model Switcher & ML Backend.
 * ────────────────────────────────────────────────────────────────────────── */
import { useState, useEffect, useMemo } from 'react';
import { useTabs } from './context/TabContext';
import { getFeed, setActiveModel as setClientActiveModel } from './services/api';

import Navbar from './components/Navbar';
import ZenSidebar from './components/ZenSidebar';
import TopicChips from './components/TopicChips';
import VideoCard from './components/VideoCard';
import ShortsShelf from './components/ShortsShelf';
import VideoPlayer from './components/VideoPlayer';
import BenchmarkDrawer from './components/BenchmarkDrawer';

export default function App() {
  const { tabs, activeTabId, activeTab } = useTabs();
  const [activeTopic, setActiveTopic] = useState('All');
  const [activeModel, setActiveModel] = useState('m3'); // Default: Model 3 (Dense LSA Best Model)
  const [isBenchmarksOpen, setIsBenchmarksOpen] = useState(false);
  const [feedVideos, setFeedVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Sync activeModel to API client and load dynamic feed from FastAPI ML Backend */
  useEffect(() => {
    setClientActiveModel(activeModel);
    setLoading(true);

    getFeed(activeTopic, activeModel)
      .then((data) => {
        setFeedVideos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Feed load error:', err);
        setLoading(false);
      });
  }, [activeTopic, activeModel]);

  /* Filter feed for search tabs */
  const filteredVideos = useMemo(() => {
    let pool = feedVideos;

    if (activeTab.type === 'search' && activeTab.query) {
      const q = activeTab.query.toLowerCase();
      pool = pool.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelName.toLowerCase().includes(q) ||
          (v.topics && v.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return pool;
  }, [activeTab, feedVideos]);

  const showFeed = activeTab.type === 'home' || activeTab.type === 'search';

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      {/* Zen Sidebar */}
      <ZenSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col ml-[60px] min-w-0 overflow-hidden">
        <Navbar
          activeModel={activeModel}
          onModelChange={setActiveModel}
          onOpenBenchmarks={() => setIsBenchmarksOpen(true)}
        />

        {/* Content Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Feed Layer */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
              showFeed ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="px-4 lg:px-8 pb-8">
              {activeTab.type === 'search' && (
                <div className="pt-4 pb-1">
                  <h2 className="text-lg font-medium text-yt-text">
                    Search results for{' '}
                    <span className="text-yt-muted">"{activeTab.query}"</span>
                  </h2>
                </div>
              )}

              <TopicChips
                activeTopic={activeTopic}
                onTopicChange={setActiveTopic}
              />

              {loading ? (
                <div className="flex items-center justify-center py-20 text-zinc-400 gap-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading feed from {activeModel === 'live' ? 'YouTube Live API' : `ML ${activeModel.toUpperCase()} Engine`}...</span>
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 pt-2">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-yt-muted">
                  <p className="text-lg">No videos found</p>
                  <p className="text-sm mt-1">Try a different search or topic.</p>
                </div>
              )}

              {activeTab.type === 'home' && <ShortsShelf />}
            </div>
          </div>

          {/* Video Player Tabs Layer */}
          {tabs
            .filter((t) => t.type === 'video')
            .map((tab) => {
              const isVisible = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
                    isVisible
                      ? 'z-10 opacity-100'
                      : 'z-0 opacity-0 pointer-events-none'
                  }`}
                  style={{ visibility: isVisible ? 'visible' : 'hidden' }}
                >
                  <VideoPlayer />
                </div>
              );
            })}
        </div>
      </div>

      {/* Benchmarking Analytics Drawer */}
      <BenchmarkDrawer
        isOpen={isBenchmarksOpen}
        onClose={() => setIsBenchmarksOpen(false)}
      />
    </div>
  );
}
