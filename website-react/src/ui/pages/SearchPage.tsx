// SearchPage.tsx
import type { Job, PersistState } from "@/types/job";
import { JobCard } from "@/ui/components/JobCard";
import { regionOf, roleOf, text } from "@/utils/text";
import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FiltersPanel } from "./FiltersPanel";

type Props = {
  jobs: Job[];
  state: PersistState;
  onUpdateItem: (id: string, patch: any) => void;
  onToggleSaved: (id: string, saved: boolean) => void;
  onToggleTracked: (id: string, tracked: boolean) => void;
  filters: {
    q: string;
    setQ: (s: string) => void;
    region: string;
    setRegion: (s: string) => void;
    role: string;
    setRole: (s: string) => void;
    onlyNew: boolean;
    setOnlyNew: (b: boolean) => void;
    hideApplied: boolean;
    setHideApplied: (b: boolean) => void;
    sort: string;
    setSort: (s: string) => void;
  };
};

export function SearchPage({
  jobs,
  state,
  onUpdateItem,
  onToggleSaved,
  onToggleTracked,
  filters,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const regions = useMemo(
    () =>
      Array.from(
        new Set((jobs || []).map(regionOf).filter(Boolean))
      ) as string[],
    [jobs]
  );
  const roles = useMemo(
    () =>
      Array.from(new Set((jobs || []).map(roleOf).filter(Boolean))) as string[],
    [jobs]
  );
  const merged = useMemo(
    () => jobs.map((j) => ({ ...j, ...(state.items[j.id] || {}) })),
    [jobs, state]
  );

  const filtered = useMemo(() => {
    return merged
      .filter((j) =>
        filters.q
          ? [
              text(j.title),
              text(j.company),
              text(j.location),
              roleOf(j),
              regionOf(j),
            ]
              .join(" ")
              .toLowerCase()
              .includes(filters.q.toLowerCase())
          : true
      )
      .filter((j) => !filters.region || regionOf(j) === filters.region)
      .filter((j) => !filters.role || roleOf(j) === filters.role)
      .filter(
        (j) =>
          !filters.onlyNew ||
          Boolean(
            j.first_seen_at &&
              Date.now() - +new Date(j.first_seen_at) <= 36 * 3600 * 1000
          )
      )
      .filter(
        (j) =>
          !filters.hideApplied ||
          !["applied", "interview", "offer"].includes(
            String(state.items[j.id]?.status)
          )
      )
      .sort((a, b) => {
        const ca = +new Date(String(a.created) || 0),
          cb = +new Date(String(b.created) || 0);
        if (filters.sort === "newest") return cb - ca;
        if (filters.sort === "oldest") return ca - cb;
        if (filters.sort === "salary")
          return (Number(b.salaryMax) || 0) - (Number(a.salaryMax) || 0);
        return text(a.title).localeCompare(text(b.title));
      });
  }, [merged, filters, state]);

  // Track filter changes for loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Slightly longer to see the beautiful loading state

    return () => clearTimeout(timer);
  }, [
    filters.q,
    filters.region,
    filters.role,
    filters.onlyNew,
    filters.hideApplied,
    filters.sort,
  ]);

  // Wrapper functions that trigger loading state
  const handleFilterChange = (filterName: string, value: any) => {
    startTransition(() => {
      switch (filterName) {
        case "q":
          filters.setQ(value);
          break;
        case "region":
          filters.setRegion(value);
          break;
        case "role":
          filters.setRole(value);
          break;
        case "onlyNew":
          filters.setOnlyNew(value);
          break;
        case "hideApplied":
          filters.setHideApplied(value);
          break;
        case "sort":
          filters.setSort(value);
          break;
      }
    });
  };

  const showLoading = isLoading || isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* Hero Section - Reduced height for better card visibility */}
      <div className="border-b border-white/30 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl space-y-6 py-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                Job Search
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Discover your next opportunity from thousands of Canadian job opportunities.
            </p>

            {/* Quick stats - more compact */}
            <div className="flex items-center justify-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <span className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {jobs.length.toLocaleString()}
                  </span>{" "}
                  total jobs
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <span className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {filtered.length.toLocaleString()}
                  </span>{" "}
                  matching
                  {showLoading && (
                    <Loader2 className="inline ml-1 h-3 w-3 animate-spin text-blue-500" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-6">
              <FiltersPanel
                q={filters.q}
                setQ={(v) => handleFilterChange("q", v)}
                region={filters.region}
                setRegion={(v) => handleFilterChange("region", v)}
                role={filters.role}
                setRole={(v) => handleFilterChange("role", v)}
                onlyNew={filters.onlyNew}
                setOnlyNew={(v) => handleFilterChange("onlyNew", v)}
                hideApplied={filters.hideApplied}
                setHideApplied={(v) => handleFilterChange("hideApplied", v)}
                sort={filters.sort}
                setSort={(v) => handleFilterChange("sort", v)}
                regions={regions}
                roles={roles}
              />
            </div>
          </aside>

          {/* Results Section */}
          <section className="col-span-12 space-y-6 lg:col-span-9">
            {/* Results Grid */}
            <div className="relative">
              {/* Loading indicator positioned for the grid area */}
              {showLoading && (
                <div className="absolute -top-4 right-0 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20 backdrop-blur-sm border border-blue-300/30 dark:border-blue-500/30 shadow-lg">
                    <div className="relative">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                      <div className="absolute inset-0 h-3 w-3 rounded-full bg-blue-500/30 animate-ping"></div>
                    </div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Filtering...
                    </span>
                  </div>
                </div>
              )}
              {/* Results Grid */}
              <div
                className={`transition-all duration-300 ${
                  showLoading ? "opacity-60" : "opacity-100"
                }`}
              >
                {showLoading ? (
                  /* Skeleton Cards */
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[320px] flex flex-col"
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-slate-600/30 to-transparent translate-x-[-100%] animate-shimmer"></div>

                        <div className="relative p-5 flex flex-col h-full">
                          {/* Header with badges - matches JobCard exactly */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3 min-h-[24px]">
                              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                              <div className="ml-auto flex items-center gap-2">
                                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            {/* Title skeleton - matches min-h-[3.5rem] */}
                            <div className="space-y-2 min-h-[3.5rem]">
                              <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-4/5 animate-pulse"></div>
                              <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-3/5 animate-pulse"></div>
                            </div>
                          </div>

                          {/* Meta info skeleton - matches min-h-[2rem] */}
                          <div className="flex flex-wrap items-center gap-4 text-sm mb-4 min-h-[2rem]">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-rose-200 dark:bg-rose-800 rounded animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-amber-200 dark:bg-amber-800 rounded animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 animate-pulse"></div>
                            </div>
                          </div>

                          {/* Chips skeleton - matches min-h-[2rem] */}
                          <div className="mb-4 min-h-[2rem] flex items-start gap-2">
                            <div className="h-6 bg-purple-200 dark:bg-purple-800 rounded-full w-20 animate-pulse"></div>
                            <div className="h-6 bg-cyan-200 dark:bg-cyan-800 rounded-full w-24 animate-pulse"></div>
                          </div>

                          {/* Description skeleton - flex-1 to match JobCard */}
                          <div className="flex-1 mb-4">
                            <div className="space-y-2">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6 animate-pulse"></div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/6 animate-pulse"></div>
                            </div>
                            {/* More button skeleton */}
                            <div className="mt-2">
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>

                          {/* Actions skeleton - mt-auto to match JobCard */}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="h-10 bg-blue-200 dark:bg-blue-800 rounded-xl w-32 animate-pulse"></div>
                            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((j) => (
                      <JobCard
                        key={j.id}
                        job={j as any}
                        persist={state.items[j.id]}
                        onOpen={() =>
                          onUpdateItem(j.id, {
                            clickedAt: new Date().toISOString(),
                          })
                        }
                        onApply={() =>
                          onUpdateItem(j.id, {
                            status: "applied",
                            appliedAt: new Date().toISOString(),
                            tracked: true,
                          })
                        }
                        onSave={() =>
                          onToggleSaved(
                            j.id,
                            state.items[j.id]?.status !== "saved"
                          )
                        }
                        onTrack={(v) => onToggleTracked(j.id, v)}
                        onNotes={(t) => onUpdateItem(j.id, { notes: t })}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg p-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30 dark:from-slate-800/20 dark:via-transparent dark:to-slate-900/20 pointer-events-none" />
                    <div className="relative text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-700/30">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        No jobs match your criteria
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Try adjusting your filters or search terms to see more
                        results. There are {jobs.length.toLocaleString()} total
                        jobs available.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
