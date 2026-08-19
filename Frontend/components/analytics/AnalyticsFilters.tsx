"use client";

import {
 CalendarDays,
 RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface AnalyticsFiltersProps {
  dateRange?: string;
  setDateRange?: (val: string) => void;
  recruiterId?: string;
  setRecruiterId?: (val: string) => void;
  roleId?: string;
  setRoleId?: (val: string) => void;
  onRefresh?: () => void;
}

export function AnalyticsFilters({
  dateRange = "Last 30 Days",
  setDateRange,
  recruiterId = "",
  setRecruiterId,
  roleId = "",
  setRoleId,
  onRefresh,
}: AnalyticsFiltersProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [usersRes, positionsRes] = await Promise.all([
          api.get("/users"),
          api.get("/positions"),
        ]);
        setUsers(usersRes.data || []);
        setPositions(positionsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch analytics filters", err);
      }
    };
    fetchFilters();
  }, []);

  return (
    <div
      className="
      rounded-[24px]
      border
      border-border
      bg-surface/90
      p-5
      shadow-md dark:shadow-2xl
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]
      "
    >
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
          {/* Date Filter */}
          <div
            className="
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-border
            bg-secondary-surface
            px-4
            py-3
            "
          >
            <CalendarDays className="w-4 h-4 text-text-secondary shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange?.(e.target.value)}
              className="
              w-full
              bg-transparent
              text-sm
              text-text-primary
              outline-none
              cursor-pointer
              "
            >
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="Last 7 Days">
                Last 7 Days
              </option>
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="Last 30 Days">
                Last 30 Days
              </option>
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="Last 3 Months">
                Last 3 Months
              </option>
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="Last Year">
                Last Year
              </option>
            </select>
          </div>

          {/* Recruiter Filter */}
          <div
            className="
            rounded-xl
            border
            border-border
            bg-secondary-surface
            px-4
            py-3
            "
          >
            <select
              value={recruiterId}
              onChange={(e) => setRecruiterId?.(e.target.value)}
              className="
              w-full
              bg-transparent
              text-sm
              text-text-primary
              outline-none
              cursor-pointer
              "
            >
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="">
                All Recruiters
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary">
                  {user.first_name} {user.last_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div
            className="
            rounded-xl
            border
            border-border
            bg-secondary-surface
            px-4
            py-3
            "
          >
            <select
              value={roleId}
              onChange={(e) => setRoleId?.(e.target.value)}
              className="
              w-full
              bg-transparent
              text-sm
              text-text-primary
              outline-none
              cursor-pointer
              "
            >
              <option className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary" value="">
                All Roles
              </option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id} className="bg-white text-slate-900 dark:bg-surface dark:text-text-primary">
                  {pos.title} ({pos.department || "General"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="
          flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-primary
          hover:bg-primary-hover
          px-5
          py-3
          text-sm
          font-medium
          text-white
          whitespace-nowrap
          transition-all
          duration-300
          disabled:opacity-60
          cursor-pointer
          "
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>
    </div>
  );
}