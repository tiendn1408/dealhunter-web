import React from "react";

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-48">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-4/5 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-100 rounded" />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="h-6 w-28 bg-slate-200 rounded" />
        <div className="h-8 w-20 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function TrackingListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back button */}
      <div className="h-4 w-32 bg-slate-200 rounded" />

      {/* Hero card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-6 w-24 bg-slate-200 rounded-md" />
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/3 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-4 w-28 bg-slate-100 rounded ml-auto" />
            <div className="h-10 w-44 bg-slate-200 rounded-lg ml-auto" />
            <div className="h-4 w-36 bg-slate-100 rounded ml-auto" />
          </div>
        </div>
      </div>

      {/* 4-Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="h-3.5 w-16 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="h-8 w-36 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-72 w-full bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}
