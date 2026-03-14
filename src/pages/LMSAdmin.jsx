import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Book, Video, FileText, ChevronRight, ChevronDown, Save, Trash2, Edit } from 'lucide-react'

export default function LMSAdmin() {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('list') // list | add_course | manage_course
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [modules, setModules] = useState([])
    const [lessons, setLessons] = useState({}) // { moduleId: [lessons] }
    const [prices, setPrices] = useState([])
    const [pricingView, setPricingView] = useState(false) // Toggle para aba de preços

    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
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
        }
    }

    const fetchPrices = async () => {
        const { data } = await supabase.from('course_prices').select('*').order('course_name')
        if (data) setPrices(data)
    }

    useEffect(() => {
        fetchCourses()
        fetchPrices()
    }, [])

    const handleCreateCourse = async () => {
        if (!courseForm.title) return alert('Título é obrigatório')
        
        const { data, error } = await supabase
            .from('lms_courses')
            .insert([courseForm])
            .select()
        
        if (error) {
            alert('Erro ao criar curso: ' + error.message)
        } else {
            alert('Curso criado com sucesso!')
            setCourseForm({ title: '', description: '', is_published: false })
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
                                <h3 style={{ fontSize: '1.25rem' }}>{course.title}</h3>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '4px',
                                    backgroundColor: course.is_published ? '#DEF7EC' : '#F3F4F6',
                                    color: course.is_published ? '#03543F' : '#374151'
                                }}>
                                    {course.is_published ? 'Publicado' : 'Rascunho'}
                                </span>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setView('list')}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleCreateCourse}>Criar Curso</button>
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
        const video_url = window.prompt('URL do Vídeo (YouTube/Vimeo):')

        const { error } = await supabase
            .from('lms_lessons')
            .insert([{ 
                module_id: moduleId, 
                title, 
                video_url, 
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

    const handleEditLesson = async (lesson) => {
        const newTitle = window.prompt('Novo título da aula:', lesson.title)
        if (!newTitle || newTitle === lesson.title) return
        const { error } = await supabase.from('lms_lessons').update({ title: newTitle }).eq('id', lesson.id)
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
                    <button className="btn btn-secondary" onClick={() => alert('Em breve: Ver área do aluno')}><ChevronRight size={16} /> Ver como Aluno</button>
                    <button className="btn btn-primary" onClick={handleCreateModule}><Plus size={16} /> Novo Módulo</button>
                </div>
            </div>

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
                                        <Video size={16} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lesson.title}</span>
                                            {lesson.video_url && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Video: {lesson.video_url}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Edit 
                                            size={14} 
                                            className="text-muted" 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => handleEditLesson(lesson)}
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
        </div>
    )
}
