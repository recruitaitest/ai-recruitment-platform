"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface Props {
    data: {
        date: string;
        count: number;
    }[];
}

export default function UserGrowthChart({
    data,
}: Props) {

    const categories = data.map(
        (item) =>
            new Date(item.date).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                }
            )
    );

    const counts = data.map(
        (item) => item.count
    );

    const options: Highcharts.Options = {
        chart: {
            type: "area",
            backgroundColor: "transparent",
        },

        title: {
            text: "User Registration Growth",
            style: {
                color: "#ffffff",
                fontSize: "20px",
            },
        },

        xAxis: {
            categories,

            labels: {
                style: {
                    color: "#94a3b8",
                },
            },
        },

        yAxis: {
            title: {
                text: "Registrations",
                style: {
                    color: "#94a3b8",
                },
            },

            labels: {
                style: {
                    color: "#94a3b8",
                },
            },
        },

        tooltip: {
            pointFormat:
                "<b>{point.y}</b> registration(s)",
        },

        plotOptions: {
            area: {
                marker: {
                    enabled: false,
                    radius: 3,

                    states: {
                        hover: {
                            enabled: true,
                        },
                    },
                },
            },
        },

        legend: {
            itemStyle: {
                color: "#ffffff",
            },
        },

        credits: {
            enabled: false,
        },

        series: [
            {
                type: "area",
                name: "Users Registered",
                data: counts,
                color: "#3b82f6",
            },
        ],
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
            />
        </div>
    );
}