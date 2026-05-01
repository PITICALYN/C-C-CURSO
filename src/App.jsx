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
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/turmas" element={<Turmas />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/professor" element={<Professor />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/lms" element={<LMSAdmin />} />
              <Route path="/meus-cursos" element={<AreaAluno />} />
              <Route path="/curso/:courseId/aula/:lessonId" element={<LessonPlayer />} />
              <Route path="/exame/:quizId" element={<ExamView />} />
              <Route path="/config" element={<ConfigDocs />} />
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
