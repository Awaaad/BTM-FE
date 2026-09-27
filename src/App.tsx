import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MembersPage from './pages/MembersPage'
import BeneficiariesPage from './pages/BeneficiariesPage'
import MinutesPage from './pages/MinutesPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import NotesPage from './pages/NotesPage'
import ProfilePage from './pages/ProfilePage'
import AllocationsPage from './pages/AllocationsPage'
import CycleDetailPage from './pages/CycleDetailPage'
import MyTasksPage from './pages/MyTasksPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/beneficiaries" element={<BeneficiariesPage />} />
            <Route path="/minutes" element={<MinutesPage />} />
            <Route path="/minutes/:id" element={<MeetingDetailPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/allocations" element={<AllocationsPage />} />
            <Route path="/allocations/:id" element={<CycleDetailPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
