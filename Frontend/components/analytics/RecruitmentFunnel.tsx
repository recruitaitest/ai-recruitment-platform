"use client";

import { useEffect, useState } from "react";
import { getPipelineStats } from "@/services/analyticsService";
import { CalendarDays, BarChart3 } from "lucide-react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

if (typeof Highcharts === "object") {
    Highcharts.setOptions({
        accessibility: {
            enabled: false
        }
    });
}

interface RecruitmentItem {
 name: string;
 value: number;
 percentage: string;
 color: string;
}

export function RecruitmentFunnel() {
 const [recruitmentData, setRecruitmentData] = useState<
 RecruitmentItem[]
 >([]);

 useEffect(() => {
 loadPipelineStats();
 }, []);

 const loadPipelineStats = async () => {
 try {
 const data = await getPipelineStats();

 const colors = [
 "#3B82F6",
 "#6366F1",
 "#8B5CF6",
 "#A855F7",
 "#D946EF",
 "#EC4899",
 ];

 const total = Object.values(data).reduce(
 (sum: number, value: any) =>
 sum + Number(value),
 0
 );

 const formattedData = Object.entries(data).map(
 ([stage, count], index) => ({
 name: stage,
 value: Number(count),
 percentage: total
 ? `${(
 (Number(count) / total) *
 100
 ).toFixed(1)}%`
 : "0%",
 color:
 colors[
 index % colors.length
 ],
 })
 );

 setRecruitmentData(formattedData);
 } catch (error) {
 console.error(
 "Error loading pipeline stats:",
 error
 );
 }
 };

 const chartOptions = {
 chart: {
 type: "pie",
 backgroundColor: "transparent",
 },

 accessibility: {
 enabled: false,
 },

 title: {
 text: "Recruitment Pipeline",
 style: {
 color: "#ffffff",
 fontSize: "18px",
 },
 },

 tooltip: {
 pointFormat:
 "<b>{point.percentage:.1f}%</b>",
 },

 legend: {
 itemStyle: {
 color: "#ffffff",
 },
 },

 plotOptions: {
 pie: {
 allowPointSelect: true,
 cursor: "pointer",
 showInLegend: true,

 dataLabels: {
 enabled: false,
 },
 },
 },

 series: [
 {
 type: "pie" as const,
 name: "Candidates",

 colorByPoint: true,

 data: recruitmentData.map(
 (item) => ({
 name: item.name,
 y: item.value,
 color: item.color,
 })
 ),
 },
 ],
 };

 const totalCandidates =
 recruitmentData.reduce(
 (sum, item) => sum + item.value,
 0
 );

 const hiredCount =
 recruitmentData.find(
 (x) =>
 x.name.toLowerCase() === "hired"
 )?.value || 0;

 const conversionRate =
 totalCandidates > 0
 ? (
 (hiredCount /
 totalCandidates) *
 100
 ).toFixed(1)
 : "0.0";

 return (
 <div
 className="
 h-full
 min-h-[520px]
 rounded-[30px]
 border
 border-border
 bg-surface/90
 
 p-6
 shadow-md dark:shadow-2xl
 "
 >
 {/* Top Section */}
 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
 <div>
 <h2 className="text-3xl font-bold text-text-primary">
 Recruitment Pipeline
 </h2>

 <p className="text-text-secondary mt-4 text-lg">
 Candidate distribution
 across recruitment
 stages
 </p>
 </div>
 </div>

 {/* Main Content */}
 <div className="grid grid-cols-1 2xl:grid-cols-[1.3fr_0.9fr] gap-6 mt-8">
 {/* Highcharts Pie Chart */}
 <div className="h-[360px] lg:h-[400px] w-full rounded-2xl border border-border bg-secondary-surface p-3">
 <HighchartsReact
 highcharts={
 Highcharts
 }
 options={
 chartOptions
 }
 />
 </div>

 {/* Right Side Stats */}
 <div className="space-y-2 flex flex-col justify-center">
 {recruitmentData.map((item) => (
 <div
 key={item.name}
 className="flex items-center justify-between rounded-xl border border-border bg-secondary-surface px-3.5 py-2 transition-all hover:border-indigo-500/30"
 >
 <div className="flex items-center gap-2.5">
 <div
 className="w-3 h-3 rounded-full shrink-0"
 style={{
 backgroundColor: item.color,
 }}
 />
 <span className="text-text-primary text-xs font-semibold">
 {item.name}
 </span>
 </div>

 <div className="flex items-center gap-3">
 <span className="text-text-secondary text-xs font-medium">
 {item.value.toLocaleString()}
 </span>
 <span
 className="text-xs font-bold"
 style={{
 color: item.color,
 }}
 >
 {item.percentage}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}