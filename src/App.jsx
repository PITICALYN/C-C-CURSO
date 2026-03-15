import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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

const PrivateRoute = ({ children }) => {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="professor" element={<Professor />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="equipe" element={<Equipe />} />
            <Route path="lms" element={<LMSAdmin />} />
            <Route path="meus-cursos" element={<AreaAluno />} />
            <Route path="curso/:courseId/aula/:lessonId" element={<LessonPlayer />} />
            <Route path="exame/:quizId" element={<ExamView />} />
            <Route path="config" element={<ConfigDocs />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
