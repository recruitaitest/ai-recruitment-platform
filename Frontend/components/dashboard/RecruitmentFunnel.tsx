import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { motion } from 'framer-motion'

interface FunnelStage {
    name: string
    value: number
    color: string
}

interface RecruitmentFunnelProps {
    data?: FunnelStage[]
    itemVariants?: any
}

export function RecruitmentFunnel({
    data,
    itemVariants,
}: RecruitmentFunnelProps) {
    const defaultData: FunnelStage[] = [
        { name: 'Applied', value: 1248, color: '#3b82f6' },
        { name: 'Screening', value: 856, color: '#60a5fa' },
        { name: 'Interview', value: 342, color: '#a78bfa' },
        { name: 'Offer', value: 95, color: '#ec4899' },
        { name: 'Hired', value: 42, color: '#10b981' },
    ]

    const chartData = data || defaultData

    const defaultItemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' },
        },
    }

    const item = itemVariants || defaultItemVariants

    const options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
        },
        accessibility: {
            enabled: false,
        },

        title: {
            text: 'Recruitment Funnel',
            style: {
                color: '#ffffff',
            },
        },

        subtitle: {
            text: 'Candidate pipeline stages',
            style: {
                color: '#94a3b8',
            },
        },

        xAxis: {
            categories: chartData.map((item) => item.name),

            crosshair: true,

            labels: {
                style: {
                    color: '#94a3b8',
                },
            },
        },

        yAxis: {
            min: 0,

            title: {
                text: 'Candidates',
                style: {
                    color: '#94a3b8',
                },
            },

            labels: {
                style: {
                    color: '#94a3b8',
                },
            },
        },

        tooltip: {
            valueSuffix: ' candidates',
        },

        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                borderRadius: 8,
            },
        },

        credits: {
            enabled: false,
        },

        legend: {
            enabled: false,
        },

        series: [
            {
                type: 'column',
                name: 'Candidates',
                colorByPoint: true,

                data: chartData.map((item) => ({
                    y: item.value,
                    color: item.color,
                })),
            },
        ],
    }

    return (
        <motion.div
            variants={item}
            className="glass-bg-dark p-6 rounded-xl border border-white/10"
        >
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
            />

            <div className="grid grid-cols-5 gap-2 mt-6">
                {chartData.map((stage, index) => (
                    <div key={index} className="text-center p-2">
                        <div
                            className="h-1 rounded-full mb-2"
                            style={{
                                backgroundColor: stage.color,
                            }}
                        />

                        <p className="text-xs text-white/60 mb-1">
                            {stage.name}
                        </p>

                        <p className="text-sm font-semibold text-white">
                            {stage.value}
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    )

}
