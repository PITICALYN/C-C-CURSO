import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Book, Video, FileText, ChevronRight, ChevronDown, Save, Trash2, Edit, CheckSquare, Clock } from 'lucide-react'

export default function LMSAdmin() {
    const navigate = useNavigate()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('list') // list | add_course | manage_course
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [modules, setModules] = useState([])
    const [lessons, setLessons] = useState({}) // { moduleId: [lessons] }
    const [prices, setPrices] = useState([])
    const [pricingView, setPricingView] = useState(false) // Toggle para aba de preços
    const [quizzes, setQuizzes] = useState({}) // { moduleId: quizObj }
    const [selectedQuiz, setSelectedQuiz] = useState(null)
    const [quizQuestions, setQuizQuestions] = useState([])
    const [isEditingQuiz, setIsEditingQuiz] = useState(false)
    const [eadDoubts, setEadDoubts] = useState([])
    const [answeringDoubtId, setAnsweringDoubtId] = useState(null)
    const [doubtAnswerText, setDoubtAnswerText] = useState('')

    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        thumbnail_url: '',
        min_theoretical_hours: 0,
        is_published: false
    })

    const fetchCourses = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('lms_courses')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (!error) setCourses(data || [])
        setLoading(false)
    }

    const fetchCourseDetails = async (courseId) => {
        const { data: mods, error: modError } = await supabase
            .from('lms_modules')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true })
        
        if (!modError && mods) {
            setModules(mods)
            
            // Buscar aulas para cada módulo
            const lessonsData = {}
            for (const mod of mods) {
                const { data: less, error: lessError } = await supabase
                    .from('lms_lessons')
                    .select('*')
                    .eq('module_id', mod.id)
                    .order('order_index', { ascending: true })
                
                if (!lessError) lessonsData[mod.id] = less || []
            }
            setLessons(lessonsData)

            // Buscar quizzes para cada módulo
            const quizzesData = {}
            for (const mod of mods) {
                const { data: qz, error: qzError } = await supabase
                    .from('lms_quizzes')
                    .select('*')
                    .eq('module_id', mod.id)
                    .single()
                
                if (!qzError && qz) quizzesData[mod.id] = qz
            }
            setQuizzes(quizzesData)
        }
    }

    const fetchPrices = async () => {
        const { data } = await supabase.from('course_prices').select('*').order('course_name')
        if (data) setPrices(data)
    }

    const fetchAllDoubts = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('lms_lesson_questions')
            .select('*, student:users!student_id(full_name), lesson:lms_lessons(title, lms_modules(lms_courses(title)))')
            .order('created_at', { ascending: false })
        if (data) setEadDoubts(data)
        setLoading(false)
    }

    const handleAnswerDoubt = async (id) => {
        if (!doubtAnswerText.trim()) return
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
            .from('lms_lesson_questions')
            .update({
                answer_text: doubtAnswerText,
                answered_by: user.id,
                answered_at: new Date().toISOString()
            })
            .eq('id', id)
        
        if (!error) {
            setDoubtAnswerText('')
            setAnsweringDoubtId(null)
            fetchAllDoubts()
            alert('Resposta enviada!')
        }
    }

    useEffect(() => {
        fetchCourses()
        fetchPrices()
    }, [])

    const handleSaveCourse = async () => {
        if (!courseForm.title) return alert('Título é obrigatório')
        
        let error
        if (selectedCourse) {
            // Update
            const { error: err } = await supabase
                .from('lms_courses')
                .update({
                    title: courseForm.title,
                    description: courseForm.description,
                    thumbnail_url: courseForm.thumbnail_url,
                    min_theoretical_hours: courseForm.min_theoretical_hours
                })
                .eq('id', selectedCourse.id)
            error = err
        } else {
            // Create
            const { error: err } = await supabase
                .from('lms_courses')
                .insert([courseForm])
            error = err
        }
        
        if (error) {
            alert('Erro ao salvar curso: ' + error.message)
        } else {
            alert('Curso salvo com sucesso!')
            setCourseForm({ title: '', description: '', thumbnail_url: '', min_theoretical_hours: 0, is_published: false })
            setSelectedCourse(null)
            setView('list')
            fetchCourses()
        }
    }

    const handleSelectCourse = async (course) => {
        setSelectedCourse(course)
        await fetchCourseDetails(course.id)
        setView('manage_course')
    }

    const renderCourseList = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Cursos EAD</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setView('doubts')}>
                        Central de Dúvidas
                    </button>
                    <button className="btn btn-secondary" onClick={() => setPricingView(!pricingView)}>
                        {pricingView ? 'Ver Cursos' : 'Gerenciar Preços'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setView('add_course')}>
                        <Plus size={16} /> Novo Curso
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Carregando dados...</p>
            ) : pricingView ? (
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Tabela de Preços Padrão</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Nome do Curso</th>
                                    <th style={{ padding: '0.75rem' }}>Preço Sugerido (R$)</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem' }}>{p.course_name}</td>
                                        <td style={{ padding: '0.75rem' }}>R$ {p.default_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={async () => {
                                                const newVal = window.prompt(`Novo valor para ${p.course_name}:`, p.default_value)
                                                if (newVal) {
                                                    await supabase.from('course_prices').update({ default_value: parseFloat(newVal) }).eq('id', p.id)
                                                    fetchPrices()
                                                }
                                            }}><Edit size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={async () => {
                        const name = window.prompt('Nome do Curso para Preço:')
                        const val = window.prompt('Valor Sugerido:')
                        if (name && val) {
                            await supabase.from('course_prices').insert([{ course_name: name, default_value: parseFloat(val) }])
                            fetchPrices()
                        }
                    }}>+ Adicionar Novo Preço</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="card" style={{ cursor: 'pointer' }} onClick={() => handleSelectCourse(course)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem' }}>{course.title}</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mín: {course.min_theoretical_hours || 0}h teóricas</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px',
                                        backgroundColor: course.is_published ? '#DEF7EC' : '#F3F4F6',
                                        color: course.is_published ? '#03543F' : '#374151',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {course.is_published ? 'Publicado' : 'Rascunho'}
                                    </span>
                                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem' }} onClick={(e) => {
                                        e.stopPropagation()
                                        setCourseForm({
                                            title: course.title,
                                            description: course.description || '',
                                            thumbnail_url: course.thumbnail_url || '',
                                            min_theoretical_hours: course.min_theoretical_hours || 0,
                                            is_published: course.is_published
                                        })
                                        setSelectedCourse(course)
                                        setView('add_course')
                                    }}>
                                        <Edit size={14} /> Editar
                                    </button>
                                </div>
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                {course.description || 'Sem descrição.'}
                            </p>
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Book size={14} /> Módulos</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Video size={14} /> Aulas</span>
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                            <p>Nenhum curso cadastrado ainda.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    const renderAddCourse = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={() => setView('list')}>&larr; Voltar</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '1rem' }}>Configurar Novo Curso</h2>
            </div>

            <div className="card">
                <div className="form-group">
                    <label className="form-label">Título do Curso</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={courseForm.title} 
                        onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                        placeholder="Ex: Inspetor de Controle Dimensional - Base"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Descrição / Ementa</label>
                    <textarea 
                        className="form-control" 
                        style={{ height: '120px' }}
                        value={courseForm.description}
                        onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                        placeholder="Descreva o que o aluno aprenderá..."
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Thumbnail (URL)</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={courseForm.thumbnail_url} 
                            onChange={e => setCourseForm({...courseForm, thumbnail_url: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Carga Horária Teórica (Horas)</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            value={courseForm.min_theoretical_hours} 
                            onChange={e => setCourseForm({...courseForm, min_theoretical_hours: parseInt(e.target.value) || 0})}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => {
                        setSelectedCourse(null)
                        setCourseForm({ title: '', description: '', thumbnail_url: '', min_theoretical_hours: 0, is_published: false })
                        setView('list')
                    }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSaveCourse}>{selectedCourse ? 'Salvar Alterações' : 'Criar Curso'}</button>
                </div>
            </div>
        </div>
    )

    const handleCreateModule = async () => {
        const title = window.prompt('Título do Novo Módulo:')
        if (!title) return

        const { error } = await supabase
            .from('lms_modules')
            .insert([{ course_id: selectedCourse.id, title, order_index: modules.length }])
        
        if (error) {
            alert('Erro ao criar módulo: ' + error.message)
        } else {
            fetchCourseDetails(selectedCourse.id)
        }
    }

    const handleCreateLesson = async (moduleId) => {
        const title = window.prompt('Título da Aula:')
        if (!title) return

        const minutes = window.prompt('Tempo estimado p/ esta aula (MINUTOS):', '10')
        if (minutes === null) return
        const min_watch_time_sec = (parseInt(minutes) || 0) * 60

        const choice = window.prompt('Qual o tipo de conteúdo?\nDigite 1 para VÍDEO (YouTube/Vimeo)\nDigite 2 para ARQUIVO (PDF)', '1')
        
        let video_url = null
        let pdf_url = null

        if (choice === '1') {
            video_url = window.prompt('URL do Vídeo (YouTube/Vimeo):')
            if (!video_url) return
        } else if (choice === '2') {
            const file = await new Promise(resolve => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf'
                input.style.display = 'none'
                document.body.appendChild(input)
                input.onchange = (e) => {
                    const selected = e.target.files[0]
                    document.body.removeChild(input)
                    resolve(selected)
                }
                input.click()
                // Limpeza de segurança caso o usuário cancele (alguns navegadores não disparam onchange)
                setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); resolve(null); }, 60000)
            })
            if (!file) return

            // Upload PDF
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedCourse.id}_lesson_${Date.now()}.${fileExt}`
            const filePath = `lessons/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('lms-docs')
                .upload(filePath, file)
            
            if (uploadError) return alert('Erro no upload do PDF: ' + uploadError.message)

            const { data: { publicUrl } } = supabase.storage.from('lms-docs').getPublicUrl(filePath)
            pdf_url = publicUrl
        }

        const { error } = await supabase
            .from('lms_lessons')
            .insert([{ 
                module_id: moduleId, 
                title, 
                video_url: video_url || null, 
                pdf_url: pdf_url || null,
                min_watch_time_sec,
                order_index: (lessons[moduleId]?.length || 0) 
            }])
        
        if (error) {
            alert('Erro ao criar aula: ' + error.message)
        } else {
            fetchCourseDetails(selectedCourse.id)
        }
    }

    const handleEditModule = async (mod) => {
        const newTitle = window.prompt('Novo título do módulo:', mod.title)
        if (!newTitle || newTitle === mod.title) return
        const { error } = await supabase.from('lms_modules').update({ title: newTitle }).eq('id', mod.id)
        if (error) alert('Erro ao editar: ' + error.message)
        else fetchCourseDetails(selectedCourse.id)
    }

    const handleEditLessonFull = async (lesson) => {
        const newTitle = window.prompt('Novo título da aula:', lesson.title)
        if (!newTitle) return

        let video_url = lesson.video_url
        let pdf_url = lesson.pdf_url

        if (window.confirm('Deseja alterar o conteúdo (Vídeo/PDF)?')) {
            const type = window.confirm('Novo conteúdo será VÍDEO? (Cancelar para PDF)')
            if (type) {
                video_url = window.prompt('URL do Vídeo:', video_url || '')
                pdf_url = null
            } else {
                const file = await new Promise(resolve => {
                    const input = document.createElement('input')
                    input.type = 'file'; input.accept = '.pdf'
                    input.style.display = 'none'; document.body.appendChild(input)
                    input.onchange = (e) => {
                        const s = e.target.files[0]; document.body.removeChild(input); resolve(s);
                    }; 
                    input.click()
                    setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); resolve(null); }, 60000)
                })
                if (file) {
                    const fileName = `${selectedCourse.id}_lesson_${Date.now()}.${file.name.split('.').pop()}`
                    const { data, error } = await supabase.storage.from('lms-docs').upload(`lessons/${fileName}`, file)
                    if (!error) {
                        const { data: { publicUrl } } = supabase.storage.from('lms-docs').getPublicUrl(`lessons/${fileName}`)
                        pdf_url = publicUrl; video_url = null
                    }
                }
            }
        }

        const newTime = window.prompt('Tempo mínimo de estudo (EM MINUTOS):', Math.round((lesson.min_watch_time_sec || 0) / 60))
        
        const { error } = await supabase
            .from('lms_lessons')
            .update({ 
                title: newTitle,
                video_url,
                pdf_url,
                min_watch_time_sec: (parseInt(newTime) || 0) * 60
            })
            .eq('id', lesson.id)
        
        if (error) alert('Erro ao editar: ' + error.message)
        else fetchCourseDetails(selectedCourse.id)
    }

    const handleDeleteModule = async (moduleId, title) => {
        if (!window.confirm(`Excluir módulo "${title}" e TODAS as suas aulas?`)) return
        const { error } = await supabase.from('lms_modules').delete().eq('id', moduleId)
        if (error) alert('Erro ao excluir module: ' + error.message)
        else fetchCourseDetails(selectedCourse.id)
    }

    const handleDeleteLesson = async (lessonId, title) => {
        if (!window.confirm(`Excluir aula "${title}"?`)) return
        const { error } = await supabase.from('lms_lessons').delete().eq('id', lessonId)
        if (error) alert('Erro ao excluir aula: ' + error.message)
        else fetchCourseDetails(selectedCourse.id)
    }

    const handleCreateQuiz = async (moduleId) => {
        const title = window.prompt('Título da Prova/Exercício:', 'Avaliação de Conhecimento')
        if (!title) return

        const minutes = window.prompt('Tempo Limite (em minutos). Digite 0 para sem limite:', '60')

        const { data, error } = await supabase
            .from('lms_quizzes')
            .insert([{ 
                course_id: selectedCourse.id, 
                module_id: moduleId, 
                title,
                quiz_type: window.confirm('Este teste é a PROVA FINAL do curso? (Clique em Cancelar para Exercício de Módulo)') ? 'final_exam' : 'exercise',
                passing_grade: 70,
                max_attempts: 3,
                time_limit_minutes: parseInt(minutes) || 0
            }])
            .select()
            .single()
        
        if (error) alert('Erro ao criar quiz: ' + error.message)
        else fetchCourseDetails(selectedCourse.id)
    }

    const handleManageQuiz = async (quiz) => {
        setSelectedQuiz(quiz)
        setIsEditingQuiz(true)
        const { data, error } = await supabase
            .from('lms_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
        
        if (!error) setQuizQuestions(data || [])
    }

    const handleAddQuestion = async () => {
        const text = window.prompt('Enunciado da Questão:')
        if (!text) return
        
        const q1 = window.prompt('Opção A:')
        const q2 = window.prompt('Opção B:')
        const q3 = window.prompt('Opção C:')
        const q4 = window.prompt('Opção D:')
        const correct = window.prompt('Qual é a correta (0 para A, 1 para B, 2 para C, 3 para D)?', '0')

        if (!q1 || !q2) return alert('Pelo menos duas opções são obrigatórias.')

        const { error } = await supabase
            .from('lms_questions')
            .insert([{
                quiz_id: selectedQuiz.id,
                question_text: text,
                options: [q1, q2, q3, q4].filter(q => q),
                correct_option_index: parseInt(correct) || 0
            }])
        
        if (error) alert('Erro ao salvar questão: ' + error.message)
        else handleManageQuiz(selectedQuiz)
    }

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm("Excluir esta questão?")) return
        const { error } = await supabase.from('lms_questions').delete().eq('id', qId)
        if (!error) handleManageQuiz(selectedQuiz)
    }

    const handleQuizImageUpload = async (file, pathPrefix = '') => {
        if (!file) return null
        const fileExt = file.name.split('.').pop()
        const fileName = `${selectedQuiz.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${pathPrefix}${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('lms-quiz-images')
            .upload(filePath, file)

        if (uploadError) {
            alert('Erro no upload: ' + uploadError.message)
            return null
        }

        const { data: { publicUrl } } = supabase.storage
            .from('lms-quiz-images')
            .getPublicUrl(filePath)
        
        return publicUrl
    }

    const handleAddFullQuestion = async () => {
        const text = window.prompt('Enunciado da Questão:')
        if (!text) return
        
        let image_url = null
        if (window.confirm("Deseja anexar uma imagem à PERGUNTA?")) {
            const file = await new Promise(resolve => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.style.display = 'none'; document.body.appendChild(input)
                input.onchange = (e) => {
                    const s = e.target.files[0]; document.body.removeChild(input); resolve(s);
                }
                input.click()
                setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); resolve(null); }, 60000)
            })
            if (file) {
                image_url = await handleQuizImageUpload(file, 'questions/')
            }
        }
        
        continueWithQuestion(text, image_url)
    }

    const continueWithQuestion = async (text, qImage) => {
        const options = []
        for (let i = 0; i < 5; i++) {
            const letter = String.fromCharCode(65+i)
            let optText = window.prompt(`Texto da Opção ${letter} (Deixe VAZIO se for usar APENAS IMAGEM ou para encerrar):`)
            
            let optImage = null
            if (window.confirm(`Deseja anexar uma imagem à OPÇÃO ${letter}?`)) {
                const file = await new Promise(resolve => {
                    const input = document.createElement('input')
                    input.type = 'file'; input.accept = 'image/*'
                    input.style.display = 'none'; document.body.appendChild(input)
                    input.onchange = (e) => {
                        const s = e.target.files[0]; document.body.removeChild(input); resolve(s);
                    }
                    input.click()
                    setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); resolve(null); }, 60000)
                })
                if (file) {
                    optImage = await handleQuizImageUpload(file, 'options/')
                }
            }

            // Se não tem texto E não tem imagem, e já temos pelo menos 2 opções, encerramos aqui.
            if (!optText && !optImage) {
                if (i >= 2) break;
                // Se é A ou B e não tem nada, a gente avisa.
                alert(`A opção ${letter} precisa de pelo menos Texto ou Imagem.`)
                return;
            }

            options.push({ text: optText || "", image_url: optImage })
        }

        const correct = window.prompt(`Qual é a correta (0 para A, 1 para B, 2 para C, 3 para D, 4 para E)?`, '0')

        const { error } = await supabase
            .from('lms_questions')
            .insert([{
                quiz_id: selectedQuiz.id,
                question_text: text,
                image_url: qImage,
                options: options,
                correct_option_index: parseInt(correct) || 0
            }])
        
        if (error) alert('Erro ao salvar questão: ' + error.message)
        else handleManageQuiz(selectedQuiz)
    }

    const handleTogglePublishCourse = async (courseId, currentStatus) => {
        const { error } = await supabase
            .from('lms_courses')
            .update({ is_published: !currentStatus })
            .eq('id', courseId)
        
        if (error) alert('Erro ao alterar status: ' + error.message)
        else {
            setSelectedCourse(prev => ({ ...prev, is_published: !currentStatus }))
            fetchCourses()
        }
    }

    const handlePreviewCourse = () => {
        if (!selectedCourse || modules.length === 0) return alert('Este curso ainda não possui módulos.')
        
        // Pegar a primeira aula do primeiro módulo
        const firstModId = modules[0].id
        const firstLesson = lessons[firstModId]?.[0]
        
        if (firstLesson) {
            navigate(`/curso/${selectedCourse.id}/aula/${firstLesson.id}`)
        } else {
            alert('Crie pelo menos uma aula no primeiro módulo para visualizar.')
        }
    }

    const renderManageCourse = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <button className="btn btn-secondary" onClick={() => setView('list')}>&larr; Voltar</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{selectedCourse?.title}</h2>
                        <button 
                            className="btn" 
                            style={{ 
                                padding: '0.25rem 0.75rem', 
                                fontSize: '0.75rem',
                                backgroundColor: selectedCourse?.is_published ? '#DEF7EC' : '#F3F4F6',
                                color: selectedCourse?.is_published ? '#03543F' : '#374151',
                                border: '1px solid currentColor'
                            }}
                            onClick={() => handleTogglePublishCourse(selectedCourse.id, selectedCourse.is_published)}
                        >
                            {selectedCourse?.is_published ? 'Publicado' : 'Rascunho (Clique p/ Publicar)'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={handlePreviewCourse}><ChevronRight size={16} /> Ver como Aluno</button>
                    <button className="btn btn-primary" onClick={handleCreateModule}><Plus size={16} /> Novo Módulo</button>
                </div>
            </div>

            {/* RESUMO DE CARGA HORÁRIA */}
            {(() => {
                let totalMin = 0
                Object.values(lessons).forEach(lessArr => {
                    lessArr.forEach(l => totalMin += (l.min_watch_time_sec || 0) / 60)
                })
                Object.values(quizzes).forEach(q => {
                    totalMin += (q.time_limit_minutes || 0)
                })
                
                const goalMin = (selectedCourse?.min_theoretical_hours || 0) * 60
                const isUnder = totalMin < goalMin
                
                return (
                    <div style={{ 
                        padding: '1rem', 
                        backgroundColor: isUnder ? '#FEF2F2' : '#F0FDF4', 
                        border: `1px solid ${isUnder ? '#FECACA' : '#BBF7D0'}`, 
                        borderRadius: '8px', 
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: isUnder ? '#EF4444' : '#10B981', color: 'white', borderRadius: '50%' }}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: isUnder ? '#991B1B' : '#065F46' }}>
                                    Carga Horária: {Math.floor(totalMin / 60)}h {Math.round(totalMin % 60)}min / {selectedCourse?.min_theoretical_hours}h total
                                </h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: isUnder ? '#B91C1C' : '#059669' }}>
                                    {isUnder 
                                        ? `Atenção: Faltam ${Math.floor((goalMin - totalMin) / 60)}h ${Math.round((goalMin - totalMin) % 60)}min para cumprir a meta.`
                                        : 'Meta de carga horária teórica atingida! ✅'
                                    }
                                </p>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isUnder ? '#EF4444' : '#10B981' }}>
                            {Math.round((totalMin / (goalMin || 1)) * 100)}%
                        </div>
                    </div>
                )
            })()}

            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                {modules.map((mod, idx) => (
                    <div key={mod.id} className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ width: '24px', height: '24px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {idx + 1}
                                </span>
                                <h4 style={{ fontWeight: 600 }}>{mod.title}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditModule(mod)}><Edit size={14} /></button>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.4rem' ,color: 'var(--danger)'}}
                                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {lessons[mod.id]?.map((lesson, lidx) => (
                                <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: lidx === lessons[mod.id].length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {lesson.video_url ? <Video size={16} /> : <FileText size={16} />}
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lesson.title}</span>
                                            {lesson.video_url ? (
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Video: {lesson.video_url}</span>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Documento: PDF anexado</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Edit 
                                            size={14} 
                                            className="text-muted" 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => handleEditLessonFull(lesson)}
                                        />
                                        <Trash2 
                                            size={14} 
                                            style={{ cursor: 'pointer', color: 'var(--danger)' }} 
                                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => handleCreateLesson(mod.id)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px dashed #e2e8f0', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', backgroundColor: 'transparent', cursor: 'pointer' }}
                            >
                                + Adicionar Aula neste Módulo
                            </button>
                            
                            {/* Seção de Quiz por Módulo */}
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                {quizzes[mod.id] ? (
                                    <div style={{ padding: '0.75rem', backgroundColor: '#F0F9FF', borderRadius: '6px', border: '1px solid #BAE6FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: quizzes[mod.id].quiz_type === 'final_exam' ? '#9333ea' : '#0369A1' }}>
                                                {quizzes[mod.id].quiz_type === 'final_exam' ? <Trophy size={16} /> : <CheckSquare size={16} />}
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                                    {quizzes[mod.id].quiz_type === 'final_exam' ? '🏆 PROVA FINAL: ' : '📝 EXERCÍCIO: '} 
                                                    {quizzes[mod.id].title}
                                                </span>
                                            </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', backgroundColor: '#fff' }} onClick={() => handleManageQuiz(quizzes[mod.id])}>Gerenciar Questões</button>
                                            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: 'var(--danger)' }} onClick={async () => {
                                                if (window.confirm("Excluir esta prova?")) {
                                                    await supabase.from('lms_quizzes').delete().eq('id', quizzes[mod.id].id)
                                                    fetchCourseDetails(selectedCourse.id)
                                                }
                                            }}>Excluir</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleCreateQuiz(mod.id)}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px dashed #BAE6FD', borderRadius: '6px', color: '#0369A1', fontSize: '0.875rem', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Plus size={16} /> Criar Prova/Exercício do Módulo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {modules.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p className="text-secondary">Este curso ainda não tem módulos.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleCreateModule}><Plus size={16} /> Adicionar Primeiro Módulo</button>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {view === 'list' && renderCourseList()}
            {view === 'add_course' && renderAddCourse()}
            {view === 'manage_course' && renderManageCourse()}

            {/* MODAL DE GERENCIAMENTO DE PROVAS */}
            {isEditingQuiz && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card animate-fade-in" style={{ width: '700px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckSquare size={20} /> Questões: {selectedQuiz?.title}
                                </h3>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Média para aprovação: {selectedQuiz?.passing_grade}%</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tempo: {selectedQuiz?.time_limit_minutes > 0 ? `${selectedQuiz.time_limit_minutes} min` : 'Sem limite'}</p>
                                </div>
                            </div>
                            <button className="btn" onClick={() => setIsEditingQuiz(false)}>Fechar</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {quizQuestions.map((q, idx) => (
                                <div key={q.id} style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{idx + 1}. {q.question_text}</p>
                                            {q.image_url && (
                                                <img src={q.image_url} alt="Referência" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid #ddd' }} />
                                            )}
                                        </div>
                                        <Trash2 size={16} style={{ color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleDeleteQuestion(q.id)} />
                                    </div>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: q.options.length > 3 ? '1fr 1fr' : '1fr', 
                                            gap: '0.75rem' 
                                        }}>
                                            {q.options.map((opt, oidx) => (
                                            <div key={oidx} style={{ 
                                                fontSize: '0.85rem', 
                                                padding: '0.75rem',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                border: oidx === q.correct_option_index ? '2px solid #10b981' : '1px solid #e2e8f0',
                                                color: oidx === q.correct_option_index ? '#059669' : 'inherit', 
                                                fontWeight: oidx === q.correct_option_index ? 700 : 400 
                                            }}>
                                                <span style={{ marginRight: '0.5rem' }}>{String.fromCharCode(65 + oidx)})</span>
                                                {typeof opt === 'object' ? opt.text : opt}
                                                {typeof opt === 'object' && opt.image_url && (
                                                    <img src={opt.image_url} alt="Opção" style={{ display: 'block', maxWidth: '100%', height: '80px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '4px' }} />
                                                )}
                                                {oidx === q.correct_option_index && <CheckSquare size={14} style={{ marginLeft: '0.5rem', display: 'inline' }} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {quizQuestions.length === 0 && <p className="text-center text-muted">Nenhuma questão cadastrada.</p>}
                            
                            <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center', padding: '1rem' }} onClick={handleAddFullQuestion}>
                                + Adicionar Questão com Imagem/Texto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    const renderDoubts = () => (
        <div className="animate-fade-in">
            <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setView('list')}>&larr; Voltar para listagem</button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Central Pedagógica (Todas as Dúvidas)</h3>
            
            {loading ? <p>Carregando histórico completo...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {eadDoubts.map(d => (
                        <div key={d.id} className="card" style={{ borderLeft: d.answer_text ? '4px solid #10b981' : '4px solid #ef4444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <strong>{d.student?.full_name}</strong> em {d.lesson?.lms_modules?.lms_courses?.title} &rarr; {d.lesson?.title}
                                </div>
                                <span style={{ fontSize: '0.75rem' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>"{d.question_text}"</p>
                            
                            {d.answer_text ? (
                                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>Resposta enviada:</p>
                                    <p style={{ fontSize: '0.85rem' }}>{d.answer_text}</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {answeringDoubtId === d.id ? (
                                        <>
                                            <textarea className="form-control" rows="2" value={doubtAnswerText} onChange={e => setDoubtAnswerText(e.target.value)} placeholder="Escreva a resposta pedagógica..."></textarea>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setAnsweringDoubtId(null)}>Cancelar</button>
                                                <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleAnswerDoubt(d.id)}>Enviar Resposta</button>
                                            </div>
                                        </>
                                    ) : (
                                        <button className="btn btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }} onClick={() => setAnsweringDoubtId(d.id)}>Responder</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {eadDoubts.length === 0 && <p className="text-secondary text-center" style={{ padding: '2rem' }}>Nenhuma dúvida enviada no sistema.</p>}
                </div>
            )}
        </div>
    )

    return (
        <div className="lms-admin-container">
            {view === 'list' && renderCourseList()}
            {view === 'add_course' && renderAddCourse()}
            {view === 'manage_course' && renderManageCourse()}
            {view === 'doubts' && renderDoubts()}
        </div>
    )
}
