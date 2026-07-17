"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface Props {
    data: {
        name: string;
        y: number;
    }[];
}

export default function UserStatusChart({
    data,
}: Props) {

    const options: Highcharts.Options = {
        chart: {
            type: "pie",
            backgroundColor: "transparent",
        },

        title: {
            text: "User Approval Status",
            style: {
                color: "#ffffff",
                fontSize: "20px",
            },
        },

        tooltip: {
            pointFormat:
                "<b>{point.y} Users</b><br/>{point.percentage:.1f}%",
        },

        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",

                dataLabels: [
                    {
                        enabled: true,
                        distance: 20,
                        style: {
                            color: "#ffffff",
                        },
                    },
                    {
                        enabled: true,
                        distance: -40,
                        format:
                            "{point.percentage:.1f}%",

                        style: {
                            fontSize: "1.2em",
                            textOutline: "none",
                            opacity: 0.8,
                            color: "#ffffff",
                        },

                        filter: {
                            operator: ">",
                            property: "percentage",
                            value: 5,
                        },
                    },
                ],
            },
        },

        series: [
            {
                type: "pie",
                name: "Users",
                data: data.map((item) => ({
                    name: item.name,
                    y: item.y,
                    sliced:
                        item.name === "Pending",
                    selected:
                        item.name === "Pending",
                })),
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