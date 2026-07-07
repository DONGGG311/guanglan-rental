"use client";

import { useState, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (keyword: string) => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  className?: string;
  size?: "default" | "lg";
}

export function SearchBar({
  placeholder = "搜索厂房名称、地址...",
  defaultValue = "",
  onSearch,
  showFilterButton = false,
  onFilterClick,
  className,
  size = "default",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(value.trim());
    },
    [value, onSearch]
  );

  const isLg = size === "lg";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-all focus-within:ring-2 focus-within:ring-teal-500/30",
        isLg ? "h-12" : "h-10",
        className
      )}
    >
      {/* 搜索图标 */}
      <div className="flex-shrink-0 pl-4">
        <Search
          className={cn(
            "text-slate-400",
            isLg ? "h-5 w-5" : "h-4 w-4"
          )}
        />
      </div>

      {/* 输入框 */}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-full flex-1 border-none bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />

      {/* 筛选按钮（列表页专用） */}
      {showFilterButton && (
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-full flex-shrink-0 items-center gap-1 border-l border-slate-200 px-3 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">筛选</span>
        </button>
      )}

      {/* 搜索按钮 */}
      <button
        type="submit"
        className={cn(
          "flex-shrink-0 bg-teal-700 font-medium text-white transition-colors hover:bg-teal-800",
          isLg
            ? "mr-2 rounded-lg px-6 py-2 text-sm"
            : "mr-1.5 rounded-md px-4 py-1.5 text-xs"
        )}
      >
        搜索
      </button>
    </form>
  );
}
