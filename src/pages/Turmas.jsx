import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Users, LogIn, LineChart, Calendar as CalendarIcon, Clock } from 'lucide-react'

export default function Turmas() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('list') // list | add

    const [formData, setFormData] = useState({
        name: '', course_name: '', start_date: '', predicted_end_date: '', schedule: '', duration: ''
    })

    const fetchClasses = async () => {
        setLoading(true)
        try {
            // Conta os alunos dentro de cada turma usando join na tabela students
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    id, name, course_name, start_date, predicted_end_date, schedule, duration,
                    students ( count )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formatted = data.map(c => ({
                id: c.id,
                name: c.name,
                course: c.course_name,
                startDate: c.start_date,
                predictedEndDate: c.predicted_end_date,
                schedule: c.schedule,
                duration: c.duration,
                studentsCount: c.students[0]?.count || 0
            }))
            setClasses(formatted)
        } catch (error) {
            console.error('Error fetching classes:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClasses()
    }, [])

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.course_name) {
            alert('Por favor, preencha o Nome e Curso.')
            return
        }

        const newClass = {
            name: formData.name,
            course_name: formData.course_name,
            start_date: formData.start_date ? formData.start_date : null,
            predicted_end_date: formData.predicted_end_date ? formData.predicted_end_date : null,
            schedule: formData.schedule,
            duration: formData.duration
        }

        const { error } = await supabase.from('classes').insert([newClass])
        if (error) {
            alert('Erro ao salvar no Supabase: ' + error.message)
        } else {
            alert('Turma criada com sucesso na Nuvem!')
            setView('list')
            setFormData({ name: '', course_name: '', start_date: '', predicted_end_date: '', schedule: '', duration: '' })
            fetchClasses()
        }
    }

    const renderList = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Turmas</h2>
                <button className="btn btn-primary" onClick={() => setView('add')}>
                    <BookOpen size={16} /> Nova Turma
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados da Nuvem...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {classes.map(turma => (
                        <div key={turma.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{turma.name}</h3>
                                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Curso: {turma.course}</p>
                                </div>
                                <span style={{
                                    backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.25rem 0.75rem',
                                    borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    <Users size={14} /> {turma.studentsCount} Alunos
                                </span>
                            </div>

                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarIcon size={16} className="text-primary" />
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Início</p>
                                        <p className="text-muted">{turma.startDate ? new Date(turma.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} className="text-warning" />
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Término</p>
                                        <p className="text-muted">{turma.predictedEndDate ? new Date(turma.predictedEndDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                    <Users size={16} /> Grade de Alunos
                                </button>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                    <LogIn size={16} /> Diário e Frequência
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="card" onClick={() => setView('add')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <BookOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 600 }}>Abrir Nova Turma</p>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }}>Configurar Grade</button>
                    </div>
                </div>
            )}
        </div>
    )

    const renderAddForm = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setView('list')}>&larr; Voltar</button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nova Grade de Turma</h2>
                </div>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Turma (Nuvem)</button>
            </div>

            <div className="card">
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Dados Básicos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group"><label className="form-label">Nome da Turma (Ex: T1 15/12)</label><input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Curso (Ex: Inspetor de Soldagem)</label><input type="text" className="form-control" name="course_name" value={formData.course_name} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Data de Início Programado</label><input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Previsão de Término</label><input type="date" className="form-control" name="predicted_end_date" value={formData.predicted_end_date} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Horários Base</label><input type="text" className="form-control" name="schedule" value={formData.schedule} onChange={handleFormChange} placeholder="Ex: Seg a Sex 18h às 22h" /></div>
                    <div className="form-group"><label className="form-label">Carga Horária (Duração)</label><input type="text" className="form-control" name="duration" value={formData.duration} onChange={handleFormChange} placeholder="Ex: 80 horas" /></div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setView('list')}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Turma (Nuvem)</button>
            </div>
        </div>
    )

    return (
        <div className="turmas-container">
            {view === 'list' && renderList()}
            {view === 'add' && renderAddForm()}
        </div>
    )
}
