import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, PlayCircle, CheckCircle, Clock, Calendar } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

export default function AreaAluno() {
    const navigate = useNavigate()
    const [myCourses, setMyCourses] = useState([])
    const [upcomingPractical, setUpcomingPractical] = useState([])
    const [loading, setLoading] = useState(true)
    const { session } = useAuth()

    const handleStartCourse = async (courseId) => {
        const { data: lesson } = await supabase
            .from('lms_lessons')
            .select('id')
            .order('order_index', { ascending: true })
            .limit(1)
            .single()
        
        if (lesson) {
            navigate(`/curso/${courseId}/aula/${lesson.id}`)
        } else {
            alert('Este curso ainda não possui aulas cadastradas.')
        }
    }

    const fetchData = async () => {
        setLoading(true)
        if (!session?.user?.id) return

        // 1. Buscar o nome completo do perfil do usuário logado
        const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', session.user.id)
            .single()

        if (!profile) {
            setLoading(false)
            return
        }

        // 2. Buscar matrículas (students) com esse nome que possuem acesso EAD habilitado
        const { data: enrollments } = await supabase
            .from('students')
            .select(`
                has_lms_access,
                classes(lms_course_id)
            `)
            .ilike('full_name', `%${profile.full_name}%`)
            .eq('has_lms_access', true)

        // 3. Extrair IDs de cursos vinculados às turmas que o aluno tem acesso
        const courseIds = enrollments?.map(e => e.classes?.lms_course_id).filter(Boolean) || []

        if (courseIds.length > 0) {
            const { data: courses } = await supabase
                .from('lms_courses')
                .select('*')
                .in('id', courseIds)
                .eq('is_published', true)
            
            if (courses) setMyCourses(courses)
        }

        // 4. Buscar turmas presenciais para o calendário (mesma lógica anterior)
        const { data: practicalStudents } = await supabase
            .from('students')
            .select('turma_id, classes(name, course_name, start_date)')
            .ilike('full_name', `%${profile.full_name}%`)
        
        if (practicalStudents) {
            const dates = practicalStudents.map(s => s.classes).filter(Boolean)
            setUpcomingPractical(dates)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [session])

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--primary)' }}>Boa noite, Aluno(a)! 👋</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* LISTA DE CURSOS ONLINE */}
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={20} className="text-primary" /> Meus Cursos Online
                    </h3>

                    {loading ? (
                        <p>Carregando seus cursos...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myCourses.map(course => (
                                <div key={course.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '120px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PlayCircle size={40} className="text-primary" style={{ opacity: 0.3 }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{course.title}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: '0%', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>0%</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => handleStartCourse(course.id)}>Continuar Aula</button>
                                </div>
                            ))}
                            {myCourses.length === 0 && (
                                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                    <p className="text-secondary">Você ainda não está matriculado em nenhum curso online.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CALENDÁRIO PRÁTICO (PRESENCIAL) */}
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} className="text-warning" /> Aulas Práticas (Presencial)
                    </h3>
                    <div className="card" style={{ backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '1rem', fontWeight: 500 }}>
                            Fique atento às datas dos seus treinamentos presenciais para certificação Abendi:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {upcomingPractical.map((p, i) => (
                                <div key={i} style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.course_name}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#B45309', fontWeight: 600, fontSize: '0.8rem' }}>
                                        <Clock size={14} /> {new Date(p.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            ))}
                            {upcomingPractical.length === 0 && (
                                <p style={{ fontSize: '0.875rem', color: '#B45309', textAlign: 'center' }}>Sem datas previstas no momento.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
