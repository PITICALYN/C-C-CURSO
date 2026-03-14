import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, Lock, CheckCircle, AlertTriangle, Clock, ChevronRight, FileText } from 'lucide-react'

export default function LessonPlayer() {
    const { courseId, lessonId } = useParams()
    const navigate = useNavigate()
    const { session } = useAuth()
    
    const [lesson, setLesson] = useState(null)
    const [course, setCourse] = useState(null)
    const [allLessons, setAllLessons] = useState([])
    const [secondsWatched, setSecondsWatched] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [lessonStatus, setLessonStatus] = useState({}) // { lessonId: { is_completed, watched_seconds } }
    const [quizStatus, setQuizStatus] = useState({}) // { quizId: { is_approved, score } }
    const [courseQuizzes, setCourseQuizzes] = useState([])
    
    const timerRef = useRef(null)

    // ANTI-FRAUDE: Bloqueios
    useEffect(() => {
        const preventDefault = (e) => e.preventDefault()
        
        // Bloquear botão direito
        document.addEventListener('contextmenu', preventDefault)
        // Bloquear copiar e colar
        document.addEventListener('copy', preventDefault)
        document.addEventListener('paste', preventDefault)
        
        return () => {
            document.removeEventListener('contextmenu', preventDefault)
            document.removeEventListener('copy', preventDefault)
            document.removeEventListener('paste', preventDefault)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // Buscar detalhes da aula atual
        const { data: lessonData } = await supabase
            .from('lms_lessons')
            .select('*, lms_modules(title, course_id, lms_courses(title))')
            .eq('id', lessonId)
            .single()
        
        if (lessonData) {
            setLesson(lessonData)
            setCourse(lessonData.lms_modules.lms_courses)
            
            // Buscar todas as aulas do curso
            const { data: lessons } = await supabase
                .from('lms_lessons')
                .select('*, module_id')
                .order('order_index', { ascending: true })
            
            setAllLessons(lessons || [])

            // Buscar todos os quizzes do curso
            const { data: qzs } = await supabase
                .from('lms_quizzes')
                .select('*')
                .eq('course_id', lessonData.lms_modules.course_id)
            setCourseQuizzes(qzs || [])

            // Buscar resultados dos quizzes do aluno
            const { data: qres } = await supabase
                .from('lms_quiz_results')
                .select('*')
                .eq('student_id', session.user.id)
            
            const qMap = {}
            qres?.forEach(r => qMap[r.quiz_id] = { is_approved: r.is_approved, score: r.score })
            setQuizStatus(qMap)

            // Buscar progresso do aluno para todas as aulas do curso
            const { data: progress } = await supabase
                .from('lms_student_progress')
                .select('*')
                .eq('student_id', session.user.id)
            
            const statusMap = {}
            progress?.forEach(p => {
                statusMap[p.lesson_id] = { is_completed: p.is_completed, watched_seconds: p.watched_seconds }
            })
            setLessonStatus(statusMap)

            // Inicializar cronômetro da aula atual com o tempo já assistido
            if (statusMap[lessonId]) {
                setSecondsWatched(statusMap[lessonId].watched_seconds || 0)
                setIsCompleted(statusMap[lessonId].is_completed || false)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        setSecondsWatched(0)
        setIsCompleted(false)
    }, [lessonId])

    const saveProgress = async (seconds, completed) => {
        if (!session?.user?.id || !lessonId) return
        
        await supabase
            .from('lms_student_progress')
            .upsert({
                student_id: session.user.id,
                lesson_id: lessonId,
                watched_seconds: seconds,
                is_completed: completed,
                last_accessed: new Date().toISOString()
            }, { onConflict: ['student_id', 'lesson_id'] })
    }

    // Lógica de cronômetro para tempo mínimo
    useEffect(() => {
        if (!lesson) return

        timerRef.current = setInterval(() => {
            setSecondsWatched(prev => {
                const next = prev + 1
                const completed = lesson.min_watch_time_sec > 0 && next >= lesson.min_watch_time_sec
                if (completed && !isCompleted) {
                    setIsCompleted(true)
                    saveProgress(next, true)
                } else if (next % 10 === 0) { // Salvar a cada 10 segundos
                    saveProgress(next, isCompleted)
                }
                return next
            })
        }, 1000)

        return () => {
            clearInterval(timerRef.current)
            saveProgress(secondsWatched, isCompleted)
        }
    }, [lesson, isCompleted])

    const formatVideoUrl = (url) => {
        if (!url) return ''
        if (url.includes('youtube.com/watch?v=')) {
            return url.replace('watch?v=', 'embed/')
        }
        if (url.includes('youtu.be/')) {
            return url.replace('youtu.be/', 'youtube.com/embed/')
        }
        return url
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando aula...</div>
    if (!lesson) return <div style={{ padding: '2rem', textAlign: 'center' }}>Aula não encontrada.</div>

    const progressPercent = lesson.min_watch_time_sec > 0 
        ? Math.min(100, (secondsWatched / lesson.min_watch_time_sec) * 100)
        : 100

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 'calc(100vh - 120px)', backgroundColor: '#0f172a' }}>
            {/* PLAYER E CONTEÚDO */}
            <div style={{ overflowY: 'auto', padding: '2rem', color: 'white' }}>
                <button 
                    onClick={() => navigate('/meus-cursos')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem' }}
                >
                    <ChevronLeft size={16} /> Voltar para Meus Cursos
                </button>

                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: 'black', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
                    {lesson.video_url ? (
                        <iframe 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            src={formatVideoUrl(lesson.video_url)}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Video size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>Esta aula não possui vídeo vinculado.</p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{lesson.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Progresso da Aula:</span>
                            <div style={{ width: '150px', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s' }}></div>
                            </div>
                            {isCompleted ? <CheckCircle size={18} className="text-success" /> : <Lock size={18} style={{ color: '#94a3b8' }} />}
                        </div>
                    </div>
                    
                    <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '1rem' }}>
                        {lesson.content_text || 'Assista ao vídeo acima para concluir esta lição.'}
                    </p>

                    {/* BOTÃO DE PRÓXIMA AULA */}
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        {!isCompleted ? (
                            <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', color: '#fbbf24' }}>
                                <Clock size={20} className="animate-spin" />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                    Aguarde mais {lesson.min_watch_time_sec - secondsWatched} segundos para prosseguir.
                                </span>
                            </div>
                        ) : (
                            <button 
                                onClick={() => {
                                    const currentIndex = allLessons.findIndex(l => l.id === lessonId)
                                    if (currentIndex < allLessons.length - 1) {
                                        navigate(`/curso/${courseId}/aula/${allLessons[currentIndex+1].id}`)
                                    } else {
                                        alert('Parabéns! Você concluiu todas as lições deste curso.')
                                    }
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                Próxima Aula <ChevronRight size={18} />
                            </button>
                        )}
                    </div>

                    {/* FÓRUM DE DÚVIDAS */}
                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #334155' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Fórum de Dúvidas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <textarea 
                                className="form-control" 
                                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', minHeight: '80px' }}
                                placeholder="Tire sua dúvida sobre esta aula..."
                            ></textarea>
                            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Enviar Pergunta</button>
                        </div>
                        
                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>João Silva em 13/03/2026</p>
                                <p style={{ fontSize: '0.875rem' }}>Professor, qual o tempo de validade desta certificação?</p>
                                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#334155', borderRadius: '6px' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Resposta do Instrutor:</p>
                                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>A validade padrão é de 5 anos, conforme normas da Abendi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA LATERAL DA GRADE */}
            <div style={{ backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
                    <h3 style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Conteúdo do Curso</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>{course?.title}</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {allLessons.map((l, idx) => {
                        const isCurrent = l.id === lessonId
                        const isDone = lessonStatus[l.id]?.is_completed
                        
                        // Lógica de Bloqueio de Módulo por Prova
                        const lessonModule = l.module_id
                        const previousModules = [...new Set(allLessons.slice(0, idx).map(al => al.module_id))]
                            .filter(m => m !== lessonModule)
                        
                        let isBlockedByQuiz = false
                        for (const modId of previousModules) {
                            const modQuiz = courseQuizzes.find(q => q.module_id === modId)
                            if (modQuiz && !quizStatus[modQuiz.id]?.is_approved) {
                                isBlockedByQuiz = true
                                break
                            }
                        }

                        const isLocked = (idx > 0 && !lessonStatus[allLessons[idx-1].id]?.is_completed && !isDone) || isBlockedByQuiz
                        
                        // Verificar se existe quiz para este módulo logo após esta aula (se for a última do módulo)
                        const isLastInModule = idx === allLessons.length - 1 || allLessons[idx+1].module_id !== lessonModule
                        const moduleQuiz = courseQuizzes.find(q => q.module_id === lessonModule)

                        return (
                            <div key={l.id}>
                                <div 
                                    onClick={() => !isLocked && navigate(`/curso/${courseId}/aula/${l.id}`)}
                                    style={{ 
                                        padding: '1rem 1.5rem', 
                                        borderBottom: '1px solid #334155', 
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        backgroundColor: isCurrent ? '#0f172a' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        opacity: isLocked ? 0.5 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '0.75rem', color: isDone ? '#10b981' : '#64748b' }}>
                                        {isDone ? <CheckCircle size={14} /> : `${idx + 1}.`}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: isCurrent ? 'white' : '#94a3b8', flex: 1 }}>{l.title}</span>
                                    {isLocked && <Lock size={14} style={{ color: '#64748b' }} />}
                                </div>
                                
                                {isLastInModule && moduleQuiz && (
                                    <div 
                                        onClick={() => navigate(`/prova/${moduleQuiz.id}`)}
                                        style={{ 
                                            padding: '0.75rem 1.5rem', 
                                            backgroundColor: quizStatus[moduleQuiz.id]?.is_approved ? '#064e3b' : '#1e293b',
                                            borderBottom: '1px solid #334155',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            color: quizStatus[moduleQuiz.id]?.is_approved ? '#10b981' : '#fbbf24'
                                        }}
                                    >
                                        <FileText size={14} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{moduleQuiz.title}</span>
                                        {quizStatus[moduleQuiz.id]?.is_approved ? (
                                            <CheckCircle size={14} style={{ marginLeft: 'auto' }} />
                                        ) : (
                                            <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
