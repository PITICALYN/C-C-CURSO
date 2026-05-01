import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { EditProvider } from './context/EditContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alunos from './pages/Alunos'
import Turmas from './pages/Turmas'
import Financeiro from './pages/Financeiro'
import Professor from './pages/Professor'
import Auditoria from './pages/Auditoria'
import ConfigDocs from './pages/ConfigDocs'
import Equipe from './pages/Equipe'
import LMSAdmin from './pages/LMSAdmin'
import AreaAluno from './pages/AreaAluno'
import LessonPlayer from './pages/LessonPlayer'
import ExamView from './pages/ExamView'
import ResetPassword from './pages/ResetPassword'

// Public Site Pages
import Home from './pages/site/Home'
import AboutUs from './pages/site/AboutUs'
import Enrollment from './pages/site/Enrollment'
import Contact from './pages/site/Contact'
import Complaint from './pages/site/Complaint'
import Terms from './pages/site/Terms'
import Privacy from './pages/site/Privacy'

import { Outlet } from 'react-router-dom'
import './site-index.css'

const SiteLayout = () => {
  return (
    <div className="site-theme">
      <Outlet />
    </div>
  )
}

const PrivateRoute = ({ children }) => {
  const { session, userProfile, loading } = useAuth()
  
  if (loading) return <div className="p-8 text-center">Carregando perfil...</div>
  if (!session) return <Navigate to="/login" replace />
  
  if (userProfile?.requires_password_change && window.location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  return children
}

const RoleGuard = ({ children, allowedRoles }) => {
  const { userProfile, loading } = useAuth()
  
  if (loading) return null
  
  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    // If it's a student trying to access admin pages, redirect to student portal
    if (userProfile.role === 'aluno') {
      return <Navigate to="/meus-cursos" replace />
    }
    // If it's an admin trying to access student pages, redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <EditProvider>
        <Router>
          <Routes>
            {/* Public Site Routes */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/sobre-nos" element={<AboutUs />} />
              <Route path="/matricula" element={<Enrollment />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/ouvidoria" element={<Complaint />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
            </Route>

            <Route path="/login" element={<Login />} />
            
            <Route path="/trocar-senha" element={
              <PrivateRoute>
                <ResetPassword />
              </PrivateRoute>
            } />
            
            {/* Private App Routes */}
            <Route element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              {/* ADMIN ONLY ROUTES */}
              <Route path="/dashboard" element={<RoleGuard allowedRoles={['admin', 'coordenador', 'atendente']}><Dashboard /></RoleGuard>} />
              <Route path="/alunos" element={<RoleGuard allowedRoles={['admin', 'coordenador', 'atendente']}><Alunos /></RoleGuard>} />
              <Route path="/turmas" element={<RoleGuard allowedRoles={['admin', 'coordenador', 'atendente']}><Turmas /></RoleGuard>} />
              <Route path="/financeiro" element={<RoleGuard allowedRoles={['admin', 'coordenador']}><Financeiro /></RoleGuard>} />
              <Route path="/professor" element={<RoleGuard allowedRoles={['admin', 'coordenador', 'instrutor']}><Professor /></RoleGuard>} />
              <Route path="/auditoria" element={<RoleGuard allowedRoles={['admin', 'coordenador']}><Auditoria /></RoleGuard>} />
              <Route path="/equipe" element={<RoleGuard allowedRoles={['admin']}><Equipe /></RoleGuard>} />
              <Route path="/lms" element={<RoleGuard allowedRoles={['admin', 'coordenador']}><LMSAdmin /></RoleGuard>} />
              <Route path="/config" element={<RoleGuard allowedRoles={['admin']}><ConfigDocs /></RoleGuard>} />

              {/* STUDENT ROUTES */}
              <Route path="/meus-cursos" element={<RoleGuard allowedRoles={['aluno', 'admin']}><AreaAluno /></RoleGuard>} />
              <Route path="/curso/:courseId/aula/:lessonId" element={<RoleGuard allowedRoles={['aluno', 'admin']}><LessonPlayer /></RoleGuard>} />
              <Route path="/exame/:quizId" element={<RoleGuard allowedRoles={['aluno', 'admin']}><ExamView /></RoleGuard>} />
            </Route>

            {/* Catch-all route to redirect unknown to dashboard if logged in, or home if not */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </EditProvider>
    </AuthProvider>
  )
}

export default App
