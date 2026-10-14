import React from "react";

const bar = "chalk-skeleton bg-pine-100";

export function CardSkeleton() {
  return (
    <div className="tag-shape flex h-56 flex-col justify-between bg-warn-soft/60 px-6 pb-6 pt-9">
      <div>
        <div className={`mb-3 h-5 w-20 ${bar}`} />
        <div className={`mb-2 h-5 w-4/5 ${bar}`} />
        <div className={`h-5 w-1/2 ${bar}`} />
      </div>
      <div className={`h-10 w-36 ${bar}`} />
    </div>
  );
}

export function TrackingListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className={`h-5 w-32 ${bar}`} />
      <div className="grid gap-6 bg-pine-900 p-6 sm:p-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="chalk-skeleton h-6 w-24 bg-pine-700" />
          <div className="chalk-skeleton h-9 w-3/4 bg-pine-700" />
          <div className="chalk-skeleton h-5 w-1/3 bg-pine-700" />
        </div>
        <div className="tag-shape h-40 bg-warn-soft/60" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2 bg-white p-4">
            <div className={`h-4 w-16 ${bar}`} />
            <div className={`h-7 w-24 ${bar}`} />
          </div>
        ))}
      </div>
      <div className="space-y-4 bg-white p-6 sm:p-8">
        <div className={`h-6 w-40 ${bar}`} />
        <div className={`h-72 w-full ${bar}`} />
      </div>
    </div>
  );
}
