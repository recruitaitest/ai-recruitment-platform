'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Users, Globe } from 'lucide-react'
import { AuthService } from '@/lib/auth'
import {
  StatsCards,
  FeatureGrid,
  AIInsights,
  RecruitmentFunnel,
  RecentApplicants,
  UpcomingInterviews,
  RecruiterActivityFeed,
  AIRecommendations,
} from '@/components/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [pipelineStats, setPipelineStats] = useState<any>(null)
  const [topSkills, setTopSkills] = useState<any>(null)
  const [recentCandidates, setRecentCandidates] = useState<any[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = AuthService.isAuthenticated()
    const token = localStorage.getItem('token')

    if (!token) {

      router.push('/login')

    } else {

      setAuthorized(true)
      fetchDashboardData()
    }

    // Get user info
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email') || 'User'
      setUserEmail(email)
    }
  }, [router])

  const handleLogout = async () => {
    setIsLoading(true)
    AuthService.logout()
    router.push('/login')
  }

  const handleStartRecruiting = () => {
    console.log('Starting recruiting workflow...')
  }

  const handleSearch = (query: string) => {
    console.log('Searching:', query)
  }

  const fetchTopSkills = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/analytics/top-skills'
      )
      if (!response.ok) throw new Error('Failed to fetch top skills')
      const data = await response.json()
      setTopSkills(data)
    } catch (error) {
      console.error('Error fetching top skills:', error)
      setDashboardError('Failed to load top skills. Please try again.')
    }
  }

  const fetchRecentCandidates = async (candidatesList?: any[], pipelineList?: any[], positionsList?: any[]) => {
    try {
      const cands = candidatesList || candidates
      const pipelines = pipelineList || []
      const pos = positionsList || positions

      // Get last 5 candidates
      const recent = cands.slice(-5).reverse() || []
      setRecentCandidates(recent)

      // Generate activity feed from recent candidates with position lookup
      const activities = recent.slice(0, 3).map((candidate: any, index: number) => {
        const candidatePipeline = pipelines.find((pipeline: any) => Number(pipeline.candidate_id) === Number(candidate.id))
        const positionTitle = candidatePipeline
          ? candidatePipeline.position_title || pos.find((p: any) => Number(p.id) === Number(candidatePipeline.position_id))?.title || 'a position'
          : 'a position'

        return {
          id: String(candidate.id),
          type: 'application' as const,
          user: candidate.full_name,
          action: 'applied for',
          target: positionTitle,
          timestamp: `${index + 1} hour${index > 0 ? 's' : ''} ago`,
        }
      })
      setActivityFeed(activities)
    } catch (error) {
      console.error('Error processing candidates:', error)
    }
  }

  const fetchUpcomingInterviews = async (candidatesList?: any[], positionsList?: any[], pipelineList?: any[]) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/interviews/')
      if (!response.ok) throw new Error('Failed to fetch interviews')
      const interviews = await response.json()

      // Use provided lists or fetch them if not provided
      const cands = candidatesList || candidates
      const pos = positionsList || positions
      const pipelines = pipelineList || []

      // Get only scheduled/upcoming interviews and map names
      const upcoming = interviews
        .filter((interview: any) => {
          if (interview.status !== 'Scheduled') return false

          // Find matching pipeline stage
          const pipeline = pipelines.find(
            (p: any) =>
              Number(p.candidate_id) === Number(interview.candidate_id) &&
              Number(p.position_id) === Number(interview.position_id)
          )
          const stage = pipeline ? pipeline.stage : null
          return stage === 'Technical Interview' || stage === 'HR Round'
        })
        .slice(0, 5)
        .map((interview: any) => ({
          id: String(interview.id),
          candidateName: cands.find((c: any) => Number(c.id) === Number(interview.candidate_id))?.full_name || 'Unknown Candidate',
          position: pos.find((p: any) => Number(p.id) === Number(interview.position_id))?.title || 'Unknown Position',
          date: new Date(interview.interview_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          time: interview.interview_time || 'TBD',
          interviewer: 'Recruiter Team',
          location: interview.interview_mode === 'Online' ? 'Video Call' : (interview.interview_mode === 'Phone' ? 'Phone Call' : interview.location || 'Office'),
          type: (interview.interview_mode === 'Online' ? 'video' : (interview.interview_mode === 'Phone' ? 'phone' : 'in-person')) as 'video' | 'phone' | 'in-person',
        }))
      setUpcomingInterviews(upcoming || [])
    } catch (error) {
      console.error('Error fetching interviews:', error)
    }
  }

  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true)
    setDashboardError(null)

    try {
      const [dashResponse, pipelineResponse, candidatesResponse, positionsResponse, pipelineRecordsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/analytics/dashboard'),
        fetch('http://127.0.0.1:8000/analytics/pipeline-stats'),
        fetch('http://127.0.0.1:8000/candidates/'),
        fetch('http://127.0.0.1:8000/positions/'),
        fetch('http://127.0.0.1:8000/pipelines/'),
      ])

      if (!dashResponse.ok || !pipelineResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashData = await dashResponse.json()
      const pipelineData = await pipelineResponse.json()
      const candidatesData = candidatesResponse.ok ? await candidatesResponse.json() : []
      const positionsData = positionsResponse.ok ? await positionsResponse.json() : []
      const pipelineRecordsData = pipelineRecordsResponse.ok ? await pipelineRecordsResponse.json() : []

      setDashboardData(dashData)
      setPipelineStats(pipelineData)
      setCandidates(candidatesData)
      setPositions(positionsData)

      // Fetch additional data with candidate and position lists
      await Promise.all([
        fetchTopSkills(),
        fetchRecentCandidates(candidatesData, pipelineRecordsData, positionsData),
        fetchUpcomingInterviews(candidatesData, positionsData, pipelineRecordsData),
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardError('Failed to load dashboard. Please try again.')
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const statsData = [
    {
      label: 'Active Candidates',
      value: dashboardData?.total_candidates || 0,
      change: 'Total candidates in the system',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: 'Open Positions',
      value: dashboardData?.total_positions || 0,
      change: 'Current active positions',
      changeType: 'positive' as const,
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      label: 'Total Interviews',
      value: dashboardData?.total_interviews || 0,
      change: 'Scheduled interviews',
      changeType: 'positive' as const,
      icon: <Zap className="w-6 h-6" />,
    },
    {
      label: 'Pipeline Records',
      value: dashboardData?.total_pipeline_records || 0,
      change: 'Recruitment stages',
      changeType: 'neutral' as const,
      icon: <Globe className="w-6 h-6" />,
    },
  ]

  const features = [
    {
      title: 'Talent Search',
      description: 'AI-powered candidate discovery and matching',
    },
    {
      title: 'Analytics Dashboard',
      description: 'Real-time hiring metrics and insights',
    },
    {
      title: 'Team Collaboration',
      description: 'Seamless team workflows and communication',
    },
    {
      title: 'Integrations',
      description: 'Connect with your favorite HR tools',
    },
  ]

  const pipelineEntries = pipelineStats
    ? Object.entries(pipelineStats).map(([stage, count]) => ({
      name: stage,
      value: Number(count),
      color: '#3b82f6',
    }))
    : []

  const totalPipelineCount = pipelineEntries.reduce(
    (total, stage) => total + stage.value,
    0
  )

  const leadingPipelineStage = pipelineEntries.reduce(
    (top, stage) => (stage.value > top.value ? stage : top),
    { name: 'No stage yet', value: 0, color: '#3b82f6' }
  )

  if (!authorized) {
    return null
  }

  if (isLoadingDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Main Content Area */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
              <p className="text-white/60 mt-1">Here&apos;s what&apos;s happening with your recruitment</p>
            </div>

          </motion.div>

          {/* Error Banner */}
          {dashboardError && (
            <motion.div
              variants={itemVariants}
              className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400"
            >
              {dashboardError}
            </motion.div>
          )}
          {/* Stats Cards */}
          <StatsCards
            stats={statsData}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
          />

          {/* Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Funnel */}
            <RecruitmentFunnel
              itemVariants={itemVariants}
              data={pipelineEntries}
            />

            {/* Upcoming Interviews */}
            <UpcomingInterviews
              itemVariants={itemVariants}
              interviews={
                upcomingInterviews && upcomingInterviews.length > 0
                  ? upcomingInterviews
                  : undefined
              }
            />

            {/* Recent Applicants */}
            <RecentApplicants
              itemVariants={itemVariants}
              applicants={
                recentCandidates && recentCandidates.length > 0
                  ? recentCandidates.map((candidate: any) => {
                    const experienceYears =
                      candidate.experience && candidate.experience > 0
                        ? `${candidate.experience}+ years`
                        : 'Entry level'

                    const positionName = candidate.company || 'Candidate'

                    return {
                      id: String(candidate.id),
                      name: candidate.full_name,
                      position: positionName,
                      email: candidate.email,
                      experience: experienceYears,
                      rating: 4.5,
                      status: (candidate.status || 'screening') as
                        | 'screening'
                        | 'interview'
                        | 'offer'
                        | 'rejected',
                      appliedDate: 'Recently',
                    }
                  })
                  : undefined
              }
            />

            {/* Recent Activity */}
            <RecruiterActivityFeed
              itemVariants={itemVariants}
              activities={activityFeed && activityFeed.length > 0 ? activityFeed : undefined}
            />
          </div>

          {/* Row: Quick Actions + Recent Positions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 glass-bg-dark p-6 rounded-xl border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/candidates')}
                  className="w-full h-16 rounded-lg text-white font-medium text-base shadow-lg transition-all duration-500 bg-[linear-gradient(92.88deg,#455EB5_9.16%,#5643CC_43.89%,#673FD7_64.72%)] hover:shadow-[0_1px_30px_rgba(80,63,205,0.5)]"
                >
                  Add Candidate
                </button>

                <button
                  onClick={() => router.push('/positions')}
                  className="w-full h-16 rounded-lg text-white font-medium text-base shadow-lg transition-all duration-500 bg-[linear-gradient(92.88deg,#455EB5_9.16%,#5643CC_43.89%,#673FD7_64.72%)] hover:shadow-[0_1px_30px_rgba(80,63,205,0.5)]"
                >
                  Create Position
                </button>

                <button
                  onClick={() => router.push('/interviews')}
                  className="w-full h-16 rounded-lg text-white font-medium text-base shadow-lg transition-all duration-500 bg-[linear-gradient(92.88deg,#455EB5_9.16%,#5643CC_43.89%,#673FD7_64.72%)] hover:shadow-[0_1px_30px_rgba(80,63,205,0.5)]"
                >
                  Schedule Interview
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="glass-bg-dark p-6 rounded-xl border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Positions
              </h3>

              <div className="space-y-3">
                {positions.length > 0 ? (
                  positions.slice(-5).reverse().map((position: any) => (
                    <div
                      key={position.id}
                      className="bg-white/5 p-3 rounded-lg border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium">
                            {position.title || 'Untitled Position'}
                          </p>
                          <p className="text-white/60 text-sm">
                            {position.department || position.location || 'Department not set'}
                          </p>
                        </div>
                        <span className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">
                          {position.status || 'Open'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60 text-sm">
                    No recent positions available.
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AIRecommendations itemVariants={itemVariants} />

            <motion.div
              variants={itemVariants}
              className="glass-bg-dark p-6 rounded-xl border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Top Skills
              </h3>

              <div className="space-y-3">
                {topSkills ? (
                  Object.entries(topSkills)
                    .reduce((acc: any, [skill, count]: [string, any]) => {
                      const normalized = String(skill).toLowerCase().trim()
                      const existing = acc.find((item: any) => item[0] === normalized)

                      if (existing) {
                        existing[1] = Number(existing[1]) + Number(count)
                      } else {
                        acc.push([normalized, Number(count)])
                      }

                      return acc
                    }, [])
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([skill, count]: [string, number], index: number) => (
                      <div
                        key={index}
                        onClick={() =>
                          router.push(
                            `/candidates?skill=${encodeURIComponent(
                              String(skill)
                            )}`
                          )
                        }
                        className="flex items-center justify-between bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <span className="text-white capitalize">
                          {String(skill)}
                        </span>

                        <span className="text-cyan-400 font-semibold">
                          {Number(count)}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-white/60">
                    Loading skills...
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="glass-bg-dark p-6 rounded-xl border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Platform Features
              </h3>
              <FeatureGrid
                features={features}
                columns={1}
                containerVariants={containerVariants}
                itemVariants={itemVariants}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
