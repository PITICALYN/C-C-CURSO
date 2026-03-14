import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function LessonPlayer() {
    const { courseId, lessonId } = useParams()
    const navigate = useNavigate()
    const { session } = useAuth()
    
    const [lesson, setLesson] = useState(null)
    const [course, setCourse] = useState(null)
    const [allLessons, setAllLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [secondsWatched, setSecondsWatched] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    
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
            
            // Buscar todas as aulas do curso para navegação lateral
            const { data: lessons } = await supabase
                .from('lms_lessons')
                .select('id, title, module_id, order_index')
                .order('order_index', { ascending: true })
            
            setAllLessons(lessons || [])
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

                    {!isCompleted && lesson.min_watch_time_sec > 0 && (
                        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', color: '#fbbf24' }}>
                            <AlertTriangle size={24} />
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Conteúdo Bloqueado</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Você precisa assistir pelo menos {lesson.min_watch_time_sec} segundos para liberar o próximo módulo.</p>
                            </div>
                        </div>
                    )}

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
                    {allLessons.map((l, idx) => (
                        <div 
                            key={l.id} 
                            onClick={() => navigate(`/curso/${courseId}/aula/${l.id}`)}
                            style={{ 
                                padding: '1rem 1.5rem', 
                                borderBottom: '1px solid #334155', 
                                cursor: 'pointer',
                                backgroundColor: l.id === lessonId ? '#0f172a' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{idx + 1}.</span>
                            <span style={{ fontSize: '0.875rem', color: l.id === lessonId ? 'white' : '#94a3b8' }}>{l.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
