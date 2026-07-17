"use client";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { useEffect, useState } from "react";
import { getHiringTrends } from "@/services/analyticsService";
const chartOptions = {
    chart: {
        type: "spline",
        backgroundColor: "transparent",
    },

    title: {
        text: "",
    },

    credits: {
        enabled: false,
    },

    legend: {
        enabled: false,
    },

    xAxis: {
        categories: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
        ],

        labels: {
            style: {
                color: "#9CA3AF",
            },
        },

        lineColor: "rgba(255,255,255,0.1)",
        tickColor: "rgba(255,255,255,0.1)",
    },

    yAxis: {
        title: {
            text: null,
        },

        labels: {
            style: {
                color: "#9CA3AF",
            },
        },

        gridLineColor:
            "rgba(255,255,255,0.08)",
    },

    tooltip: {
        pointFormat:
            "<b>{point.y} Hires</b>",
    },

    plotOptions: {
        spline: {
            marker: {
                enabled: true,
                radius: 4,
            },
            lineWidth: 4,
        },
    },

    series: [
        {
            type: "spline",
            name: "Hires",
            color: "#3B82F6",

            data: [
                40,
                55,
                68,
                82,
                95,
                120,
            ],
        },
    ],
};

export function HiringTrends() {
    const [hiringData, setHiringData] = useState<any[]>([]);

    useEffect(() => {
        getHiringTrends().then(data => {
            setHiringData(data);
        }).catch(err => console.error(err));
    }, []);

    const dynamicChartOptions = {
        ...chartOptions,
        xAxis: {
            ...chartOptions.xAxis,
            categories: hiringData.map(d => d.month),
        },
        series: [
            {
                type: "spline",
                name: "Hires",
                color: "#3B82F6",
                data: hiringData.map(d => d.hires),
            },
        ],
    };

    return (
        <div
            className="
    h-full
    min-h-[480px]
    rounded-[30px]
"
        >

            {/* Header */}
            <div className="mb-8">

                <h2 className="text-3xl font-bold text-white">
                    Hiring Trends
                </h2>

                <p className="text-gray-400 mt-2">
                    Monthly hiring growth and recruitment performance
                </p>

            </div>

            {/* Chart */}
            <div className="h-[300px] md:h-[350px] xl:h-[400px]">

                <div className="h-[400px]">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={dynamicChartOptions}
                    />
                </div>
            </div>

        </div>
    );
}