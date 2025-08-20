import React, { useEffect, useMemo, useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { usePersist } from "@/hooks/usePersist";
import type { ColumnKey } from "@/types/job";
import { Header } from "@/ui/components/Header";
import { SearchPage } from "@/ui/pages/SearchPage";
import { SavedPage } from "@/ui/pages/SavedPage";
import { AlertsPage } from "@/ui/pages/AlertsPage";
import { TrackerPage } from "@/ui/pages/TrackerPage";
import { PreferencesPage } from "@/ui/pages/PreferencesPage";
import { text } from "@/utils/text";
import { initializeProviders } from "@/services/providers";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/ui/components/AuthModal";
import "@/utils/clearLocalStorage"; // For debugging

export default function App() {
  const { jobs, error, rawSample } = useJobs();
  const { state, updateItem, moveToColumn, toggleSaved, toggleTracked, reorderColumn, ensureOrders, loading: persistLoading, setOnAuthRequired, pendingAction } =
    usePersist();
  const { user, loading: authLoading } = useAuth();

  // Get initial view from URL path
  const getViewFromPath = (pathname: string): "search" | "tracker" | "saved" | "alerts" | "preferences" => {
    const path = pathname.replace(/^\/canada-job-tracker/, '') // Handle GitHub Pages base path
    switch (path) {
      case '/tracker': return 'tracker'
      case '/saved': return 'saved'
      case '/alerts': return 'alerts'
      case '/preferences': return 'preferences'
      default: return 'search'
    }
  }

  const [view, setView] = useState<"search" | "tracker" | "saved" | "alerts" | "preferences">(
    () => getViewFromPath(window.location.pathname)
  );

  // Function to update both view state and browser URL
  const navigateToView = (newView: "search" | "tracker" | "saved" | "alerts" | "preferences") => {
    setView(newView);
    
    // Update browser URL without page reload
    const newPath = newView === 'search' ? '/' : `/${newView}`;
    const basePath = import.meta.env.BASE_URL || '/';
    const fullPath = basePath === '/' ? newPath : basePath.slice(0, -1) + newPath;
    
    window.history.pushState(null, '', fullPath);
    
    // Update document title
    const titles = {
      search: 'Canada Job Tracker - Find Your Dream Job',
      tracker: 'Job Tracker - Track Your Applications',
      saved: 'Saved Jobs - Your Bookmarked Opportunities',
      alerts: 'Job Alerts - Stay Updated',
      preferences: 'Job Preferences - Customize Your Experience'
    };
    document.title = titles[newView];
  };
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [role, setRole] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initialize job providers on app start
  useEffect(() => {
    initializeProviders();
  }, []);

  // Connect auth callback to show modal when auth is required
  useEffect(() => {
    setOnAuthRequired(() => () => setShowAuthModal(true));
  }, [setOnAuthRequired]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const newView = getViewFromPath(window.location.pathname);
      setView(newView);
      
      // Update title for back/forward navigation
      const titles = {
        search: 'Canada Job Tracker - Find Your Dream Job',
        tracker: 'Job Tracker - Track Your Applications', 
        saved: 'Saved Jobs - Your Bookmarked Opportunities',
        alerts: 'Job Alerts - Stay Updated',
        preferences: 'Job Preferences - Customize Your Experience'
      };
      document.title = titles[newView];
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set initial document title
  useEffect(() => {
    const titles = {
      search: 'Canada Job Tracker - Find Your Dream Job',
      tracker: 'Job Tracker - Track Your Applications',
      saved: 'Saved Jobs - Your Bookmarked Opportunities', 
      alerts: 'Job Alerts - Stay Updated',
      preferences: 'Job Preferences - Customize Your Experience'
    };
    document.title = titles[view];
  }, [view]);

  // Don't block UI while jobs are loading - provide empty array fallback
  const safeJobs = jobs || []

  // Build tracked set (tracked=true OR has progressed status)
  const trackedIds = useMemo(() => {
    const s = new Set<string>();
    safeJobs.forEach((j) => {
      const p = state.items[j.id];
      if (p?.tracked || (p?.status && p.status !== "saved")) s.add(j.id);
    });
    return s;
  }, [safeJobs, state]);

  useEffect(() => {
    if (safeJobs.length > 0)
      ensureOrders(
        safeJobs.map((j) => j.id),
        trackedIds
      );
  }, [safeJobs, trackedIds]);

  const rowsForExport = useMemo(() => {
    const arr: string[][] = [
      ["id", "title", "company", "location", "status", "appliedAt", "url"],
    ];
    safeJobs.forEach((j) => {
      const p = state.items[j.id];
      if (!p?.status || p.status === "saved") return;
      arr.push([
        j.id,
        text(j.title),
        text(j.company),
        text(j.location),
        String(p.status),
        String(p.appliedAt || ""),
        text(j.url),
      ]);
    });
    return arr;
  }, [safeJobs, state]);

  // Only block for auth loading (persistence can load in background)
  if (authLoading) {
    return <div className="p-6 text-center text-slate-500">Loading…</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <p className="mb-2 text-red-600">Error: {error}</p>
        {rawSample && (
          <pre className="mt-3 rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {rawSample}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] hero-glow opacity-70 dark:opacity-50"
      />
      <Header 
        view={view} 
        setView={navigateToView} 
        rowsForExport={rowsForExport}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        loading={persistLoading}
      />
      {view === "search" && (
        <SearchPage
          jobs={safeJobs}
          state={state}
          onUpdateItem={updateItem}
          onToggleSaved={toggleSaved}
          onToggleTracked={toggleTracked}
          filters={{
            q,
            setQ,
            region,
            setRegion,
            role,
            setRole,
            onlyNew,
            setOnlyNew,
            hideApplied,
            setHideApplied,
            sort,
            setSort,
          }}
        />
      )}
      {view === "saved" && <SavedPage jobs={safeJobs} state={state} setState={updateItem} />}
      {view === "tracker" && (
        <TrackerPage
          jobs={safeJobs}
          state={state}
          onMove={(id, col) => moveToColumn(id, col as ColumnKey)}
          onReorder={(col, items) => reorderColumn(col, items)}
        />
      )}
      {view === "alerts" && <AlertsPage />}
      {view === "preferences" && <PreferencesPage />}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // The pending action will be executed automatically via useEffect
        }}
        contextMessage={pendingAction ? 
          `Sign in to ${pendingAction.action === 'updateItem' ? 'save this job' : 
                        pendingAction.action === 'moveToColumn' ? 'track this job application' :
                        pendingAction.action === 'toggleTracked' ? 'track this job application' :
                        pendingAction.action === 'toggleSaved' ? 'save this job' : 'continue'}` 
          : undefined}
      />
    </div>
  );
}
