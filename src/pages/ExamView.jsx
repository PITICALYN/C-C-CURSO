import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, AlertCircle, RefreshCcw } from 'lucide-react'

export default function ExamView() {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const { session } = useAuth()
    
    const [quiz, setQuiz] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({}) // { questionId: optionIndex }
    const [status, setStatus] = useState('intro') // intro | active | result | blocked
    const [score, setScore] = useState(0)
    const [attemptsCount, setAttemptsCount] = useState(0)
    const [loading, setLoading] = useState(true)

    // ANTI-FRAUDE: Bloqueios
    useEffect(() => {
        const preventDefault = (e) => e.preventDefault()
        document.addEventListener('contextmenu', preventDefault)
        document.addEventListener('copy', preventDefault)
        document.addEventListener('paste', preventDefault)
        return () => {
            document.removeEventListener('contextmenu', preventDefault)
            document.removeEventListener('copy', preventDefault)
            document.removeEventListener('paste', preventDefault)
        }
    }, [])

    useEffect(() => {
        fetchQuizData()
    }, [quizId])

    const fetchQuizData = async () => {
        setLoading(true)
        const { data: quizData } = await supabase.from('lms_quizzes').select('*').eq('id', quizId).single()
        const { data: questionsData } = await supabase.from('lms_questions').select('*').eq('quiz_id', quizId)
        
        if (quizData) {
            setQuiz(quizData)
            setQuestions(questionsData || [])
            
            // Checar tentativas existentes
            const { data: results } = await supabase
                .from('lms_quiz_results')
                .select('*')
                .eq('quiz_id', quizId)
                .eq('student_id', session.user.id)
                .single()
            
            if (results) {
                setAttemptsCount(results.attempts_count)
                if (results.is_approved) setStatus('result')
                else if (results.attempts_count >= quizData.max_attempts) setStatus('blocked')
            }
        }
        setLoading(false)
    }

    const handleStartExam = () => {
        if (attemptsCount >= (quiz?.max_attempts || 3)) {
            setStatus('blocked')
            return
        }
        setStatus('active')
        setAnswers({})
    }

    const handleSubmit = async () => {
        let correctCount = 0
        questions.forEach(q => {
            if (answers[q.id] === q.correct_option_index) correctCount++
        })
        
        const finalScore = Math.round((correctCount / questions.length) * 100)
        const approved = finalScore >= (quiz?.passing_grade || 70)
        const newAttempts = attemptsCount + 1

        const { error } = await supabase.from('lms_quiz_results').upsert({
            student_id: session.user.id,
            quiz_id: quizId,
            score: finalScore,
            attempts_count: newAttempts,
            is_approved: approved
        }, { onConflict: ['student_id', 'quiz_id'] })

        if (!error) {
            setScore(finalScore)
            setAttemptsCount(newAttempts)
            setStatus('result')
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando exame...</div>
    if (!quiz) return <div style={{ padding: '2rem', textAlign: 'center' }}>Exame não encontrado.</div>

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
            {status === 'intro' && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <AlertCircle size={48} className="text-warning" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{quiz.title}</h2>
                    <p className="text-secondary" style={{ marginTop: '1rem' }}>
                        Para aprovação, você precisa de no mínimo <strong>{quiz.passing_grade}%</strong> de acerto.
                        <br />Você tem <strong>{quiz.max_attempts - attemptsCount}</strong> tentativas restantes.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={handleStartExam}>
                        Iniciar Prova
                    </button>
                </div>
            )}

            {status === 'active' && (
                <div className="animate-fade-in">
                    <h2 style={{ marginBottom: '2rem' }}>{quiz.title}</h2>
                    {questions.map((q, idx) => (
                        <div key={q.id} className="card" style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{idx + 1}. {q.question_text}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {q.options.map((option, oidx) => (
                                    <label key={oidx} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.75rem', 
                                        padding: '0.75rem', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: answers[q.id] === oidx ? 'var(--primary-light)' : 'transparent',
                                        borderColor: answers[q.id] === oidx ? 'var(--primary)' : '#e2e8f0'
                                    }}>
                                        <input 
                                            type="radio" 
                                            name={`q-${q.id}`} 
                                            checked={answers[q.id] === oidx}
                                            onChange={() => setAnswers({...answers, [q.id]: oidx})}
                                        />
                                        <span style={{ fontSize: '0.875rem' }}>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button 
                            className="btn btn-primary" 
                            disabled={Object.keys(answers).length < questions.length}
                            onClick={handleSubmit}
                        >
                            Finalizar e Enviar
                        </button>
                    </div>
                </div>
            )}

            {status === 'result' && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    {score >= quiz.passing_grade ? (
                        <>
                            <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 1.5rem' }} />
                            <h2 style={{ color: '#065f46' }}>Parabéns! Você foi aprovado!</h2>
                        </>
                    ) : (
                        <>
                            <XCircle size={64} style={{ color: '#ef4444', margin: '0 auto 1.5rem' }} />
                            <h2 style={{ color: '#991b1b' }}>Não foi desta vez.</h2>
                        </>
                    )}
                    <div style={{ margin: '2rem 0', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                        <p style={{ fontSize: '1rem', color: '#64748b' }}>Sua nota final:</p>
                        <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{score}%</p>
                    </div>
                    {score < quiz.passing_grade && attemptsCount < quiz.max_attempts && (
                        <button className="btn btn-secondary" onClick={handleStartExam}>
                            <RefreshCcw size={16} /> Tentar Novamente
                        </button>
                    )}
                    <button className="btn btn-primary" style={{ marginLeft: '1rem' }} onClick={() => navigate('/meus-cursos')}>
                        Voltar para Meus Cursos
                    </button>
                </div>
            )}

            {status === 'blocked' && (
                <div className="card text-center" style={{ padding: '3rem', border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
                    <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: '#991b1b' }}>Acesso Bloqueado</h2>
                    <p style={{ marginTop: '1rem', color: '#b91c1c' }}>
                        Você atingiu o limite máximo de <strong>{quiz.max_attempts} tentativas</strong> sem atingir a média necessária.
                        <br />Por favor, entre em contato com o coordenador para solicitar uma nova chance.
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => navigate('/meus-cursos')}>
                        Voltar
                    </button>
                </div>
            )}
        </div>
    )
}
