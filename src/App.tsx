import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useData } from './store/DataContext'
import { OverviewPage } from './pages/OverviewPage'
import { MapPage } from './pages/MapPage'
import { AssessmentsPage } from './pages/AssessmentsPage'
import { AssessmentDetailPage } from './pages/AssessmentDetailPage'
import { AssessmentFormPage } from './pages/AssessmentFormPage'
import { ReportsPage } from './pages/ReportsPage'

export default function App() {
  const { loading } = useData()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold text-slate-600">Loading AfterFire…</p>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/assessments/new" element={<AssessmentFormPage />} />
        <Route path="/assessments/:id/edit" element={<AssessmentFormPage />} />
        <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Layout>
  )
}
