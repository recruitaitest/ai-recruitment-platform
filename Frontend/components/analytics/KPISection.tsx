"use client";

import {
 Users,
 Briefcase,
 CalendarCheck2,
 UserCheck,
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { AnalyticsFilterParams, getDashboardAnalytics } from "@/services/analyticsService";
import { motion, animate, useIsPresent } from "framer-motion";

function CountUp({ value }: { value: string | number }) {
    const nodeRef = useRef<HTMLSpanElement>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const isPresent = useIsPresent()
    
    useEffect(() => {
        const node = nodeRef.current
        if (!node || !isPresent) return

        if (value === undefined || value === null) {
            node.textContent = '-'
            return
        }

        const numValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]+/g,""))
        if (isNaN(numValue)) {
            node.textContent = String(value)
            return
        }

        const isInteger = Number.isInteger(numValue) && !value.toString().includes('.')
        
        const controls = animate(0, numValue, {
            duration: 1.5,
            ease: "easeOut",
            onPlay: () => setIsAnimating(true),
            onUpdate: (latest) => {
                if (nodeRef.current) {
                    const formatted = isInteger ? Math.round(latest).toString() : latest.toFixed(1)
                    const suffixMatch = value.toString().match(/[a-zA-Z%]+$/)
                    const prefixMatch = value.toString().match(/^[^\d.-]+/)
                    const prefix = prefixMatch ? prefixMatch[0] : ''
                    const suffix = suffixMatch ? suffixMatch[0] : ''
                    
                    nodeRef.current.textContent = `${prefix}${formatted}${suffix}`
                }
            },
            onComplete: () => setIsAnimating(false)
        })

        return () => controls.stop()
    }, [value, isPresent])

    return <span ref={nodeRef}>{value}</span>
}

interface KPISectionProps {
    filters?: AnalyticsFilterParams;
}

export function KPISection({ filters }: KPISectionProps) {

	const [kpiData, setKpiData] = useState<any[]>([]);

	useEffect(() => {
		loadSummary();
	}, [filters?.dateRange, filters?.recruiterId, filters?.roleId]);

	const loadSummary = async () => {
		try {
			const data = await getDashboardAnalytics(filters);

			setKpiData([
				{
					title: "Total Candidates",
					value: data.total_candidates,
					growth: "",
					icon: "users",
				},
				{
					title: "Active Jobs",
					value: data.total_positions,
					growth: "",
					icon: "briefcase",
				},
				{
					title: "Interviews",
					value: data.total_interviews,
					growth: "",
					icon: "calendar",
				},
				{
					title: "Successful Hires",
					value: data.total_hired,
					growth: "",
					icon: "hires",
				},
			]);
		} catch (error) {
			console.error("Analytics Summary Error:", error);
		}
	};

 const renderIcon = (icon: string) => {

 switch (icon) {

 case "users":
 return (
 <Users className="w-6 h-6 text-primary" />
 );

 case "briefcase":
 return (
 <Briefcase className="w-6 h-6 text-primary" />
 );

 case "calendar":
 return (
 <CalendarCheck2 className="w-6 h-6 text-primary" />
 );

 case "hires":
 return (
 <UserCheck className="w-6 h-6 text-primary" />
 );

 default:
 return null;

 }

 };

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

 {kpiData.map((item) => (

 <div
 key={item.title}
 className="
 rounded-2xl
 border
 border-border
 bg-surface
 
 p-6
 shadow-soft
 transition-all
 duration-base
 ease-standard
 hover:-translate-y-1
 hover:shadow-[0_10px_25px_var(--primary-soft)]
 "
 >

 {/* Top Row */}
 <div className="flex items-center justify-between">

 <div>

 <p className="text-sm text-text-secondary">
 {item.title}
 </p>

 <h2 className="text-3xl font-bold mt-2 text-text-primary">
 <CountUp value={item.value} />
 </h2>

 </div>

 {/* Icon */}
 <div
 className="
 p-3
 rounded-2xl
 bg-primary/10
 border
 border-primary/20
 "
 >

 {renderIcon(item.icon)}

 </div>

 </div>

 {/* Bottom */}
 <div className="mt-5">

 <span className="text-emerald-400 text-sm font-medium">
 {item.growth}
 </span>

 <span className="text-text-secondary text-sm ml-2">
 from last month
 </span>

 </div>

 </div>

 ))}

 </div>
 );
}