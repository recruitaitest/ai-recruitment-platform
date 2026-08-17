import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { motion } from 'framer-motion'

if (typeof Highcharts === 'object') {
  Highcharts.setOptions({
    accessibility: {
      enabled: false
    }
  })
}

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
  const STAGE_COLORS: Record<string, string> = {
    Sourced: '#0891b2',
    Applied: '#0891b2',
    Screening: '#4f46e5',
    Interview: '#d97706',
    'Technical Interview': '#d97706',
    'HR Round': '#a855f7',
    Offer: '#7c3aed',
    Hired: '#059669',
  }

 const defaultData: FunnelStage[] = [
 { name: 'Applied', value: 1248, color: '#0891b2' },
 { name: 'Screening', value: 856, color: '#4f46e5' },
 { name: 'Interview', value: 342, color: '#d97706' },
 { name: 'Offer', value: 95, color: '#7c3aed' },
 { name: 'Hired', value: 42, color: '#059669' },
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
      animation: {
        duration: 1000,
      },
    },
    accessibility: {
      enabled: false,
    },

    title: {
      text: 'Recruitment Funnel',
      style: {
        color: 'var(--text-primary)',
        fontWeight: '700',
      },
    },

    subtitle: {
      text: 'Candidate pipeline stages',
      style: {
        color: 'var(--text-secondary)',
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
      useHTML: true,
      backgroundColor: 'rgba(21, 31, 53, 0.85)',
      borderColor: 'rgba(51, 65, 85, 0.8)',
      borderRadius: 12,
      borderWidth: 1,
      shadow: true,
      style: {
        color: '#FFFFFF',
        fontSize: '13px',
      },
      headerFormat: '<span style="font-size: 11px; color: #94a3b8">{point.key}</span><br/>',
      pointFormat: '<span style="color:{point.color}">●</span> <b>{point.y} candidates</b>',
    },

    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        borderRadius: 8,
        animation: {
          duration: 1200,
        },
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
          color: STAGE_COLORS[item.name] || item.color || '#4f46e5',
        })),
      },
    ],
  }

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-card border-border shadow-soft p-6 rounded-xl border border-border hover:shadow-elevated transition-shadow duration-300"
    >
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />

      <div className="grid grid-cols-5 gap-2 mt-6">
        {chartData.map((stage, index) => (
          <motion.div 
            key={index} 
            whileHover={{ scale: 1.08 }}
            className="text-center p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <div
              className="h-1.5 rounded-full mb-2"
              style={{
                backgroundColor: STAGE_COLORS[stage.name] || stage.color || '#4f46e5',
              }}
            />

            <p className="text-xs text-secondary mb-1">
              {stage.name}
            </p>

            <p className="text-sm font-semibold text-text-primary">
              {stage.value}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

}
