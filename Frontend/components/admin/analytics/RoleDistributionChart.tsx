"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface Props {
    data: {
        role: string;
        count: number;
    }[];
}

export default function RoleDistributionChart({
    data,
}: Props) {

    const chartData = data.map((item) => ({
        name: item.role.replaceAll("_", " "),
        y: item.count,
    }));

    const options: Highcharts.Options = {
        chart: {
            type: "pie",
            backgroundColor: "transparent",
        },

        title: {
            text: "Role Distribution",
            style: {
                color: "#ffffff",
                fontSize: "20px",
            },
        },

        tooltip: {
            pointFormat:
                "<b>{point.percentage:.1f}%</b>",
        },

        accessibility: {
            point: {
                valueSuffix: "%",
            },
        },

        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",

                innerSize: "50%",

                dataLabels: {
                    enabled: true,
                    format:
                        "<b>{point.name}</b><br/>{point.percentage:.1f}%",
                    style: {
                        color: "#ffffff",
                    },
                },
            },
        },

        series: [
            {
                type: "pie",
                name: "Users",
                data: chartData,
            },
        ],

        credits: {
            enabled: false,
        },
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