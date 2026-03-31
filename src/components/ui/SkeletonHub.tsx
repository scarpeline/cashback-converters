import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "card" | "list" | "metrics" | "circle";
}

export const SkeletonHub: React.FC<SkeletonProps> = ({ className = "", variant = "card" }) => {
  const baseClass = "relative overflow-hidden bg-white/5 rounded-2xl before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer";

  if (variant === "metrics") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${baseClass} h-32 rounded-[2.5rem]`} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${baseClass} h-20 rounded-3xl`} />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return <div className={`${baseClass} rounded-full ${className}`} />;
  }

  return <div className={`${baseClass} ${className}`} />;
};

export const HubSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <SkeletonHub className="w-64 h-10" />
        <SkeletonHub className="w-96 h-4" />
      </div>
      <SkeletonHub className="w-48 h-12 rounded-2xl" />
    </div>
    
    <SkeletonHub variant="metrics" />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <SkeletonHub className="h-64 rounded-[2.5rem]" />
       <SkeletonHub className="h-64 rounded-[2.5rem]" />
    </div>
  </div>
);
