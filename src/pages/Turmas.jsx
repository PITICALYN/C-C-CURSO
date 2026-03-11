import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Users, LogIn, LineChart, Calendar as CalendarIcon, Clock, X, Printer, FileText } from 'lucide-react'
import { generateDocument } from '../lib/pdfGenerator'

export default function Turmas() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('list') // list | add
    const [selectedClassData, setSelectedClassData] = useState(null)
    const [classStudents, setClassStudents] = useState([])
    const [modalLoading, setModalLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        course_name: 'Controle Dimensional – Caldeiraria e Tubulação – (CD-CL)',
        start_date: '', predicted_end_date: '', schedule: 'Seg a Sex 18h as 22h', duration: '136'
    })

    // Função para calcular dias úteis entre duas datas (ignora sábados, domingos e feriados se existissem)
    const countWorkingDays = (startDateStr, endDateStr) => {
        let count = 0
        let curDate = new Date(startDateStr + 'T00:00:00')
        const endDate = new Date(endDateStr + 'T00:00:00')

        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay() // 0 = Domingo, 6 = Sábado
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++
            }
            curDate.setDate(curDate.getDate() + 1)
        }
        return count
    }

    // Auto-preenchimento ao mudar o curso
    useEffect(() => {
        const course = formData.course_name.toLowerCase()
        if (course.includes('treinamento')) {
            // Treinamentos são livres
            setFormData(prev => ({ ...prev, duration: '', schedule: '' }))
        } else if (course.includes('topografia') || course.includes('to')) {
            // Curso Topografia Base 80h
            setFormData(prev => ({ ...prev, duration: '80', schedule: 'Seg a Sex 18h as 22h' }))
        } else {
            // Cursos Mecânica/Caldeiraria Base 136h
            setFormData(prev => ({ ...prev, duration: '136', schedule: 'Seg a Sex 18h as 22h' }))
        }
    }, [formData.course_name])

    const generateNextClassName = (existingClasses) => {
        const yearSuffix = new Date().getFullYear().toString().slice(-2) // Ex: "26" p/ 2026
        const nextNumber = (existingClasses.length + 1).toString().padStart(2, '0') // Ex: "01", "02"
        return `T${nextNumber}/${yearSuffix}`
    }

    const fetchClasses = async () => {
        setLoading(true)
        try {
            // Conta os alunos dentro de cada turma usando join na tabela students
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    id, name, course_name, start_date, actual_start_date, predicted_end_date, actual_end_date, schedule, duration,
                    students ( count )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formatted = data.map(c => ({
                id: c.id,
                name: c.name,
                course: c.course_name,
                startDate: c.start_date,
                actualStartDate: c.actual_start_date,
                predictedEndDate: c.predicted_end_date,
                actualEndDate: c.actual_end_date,
                schedule: c.schedule,
                duration: c.duration,
                studentsCount: c.students[0]?.count || 0
            }))

            // Reorganizando e Forçando state default p/ Form
            setClasses(formatted)
            setFormData(prev => ({ ...prev, name: generateNextClassName(formatted) }))
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

        // Validação Inteligente de Carga Horária vs Dias Úteis (Motor Fase 16)
        const isTreinamentoLivre = formData.course_name.toLowerCase().includes('treinamento')

        if (!isTreinamentoLivre && formData.start_date && formData.predicted_end_date && formData.schedule.toLowerCase().includes('seg a sex')) {
            const workingDays = countWorkingDays(formData.start_date, formData.predicted_end_date)
            // Assumindo aula noturna de 4 horas (18h às 22h) ou 8h a 17h para Sábado (mas o alerta é geral pra dias uteis)
            const availableHours = workingDays * 4
            const targetHours = parseInt(formData.duration.replace(/\D/g, '')) || 0 // Pega só os números

            if (availableHours < targetHours) {
                const proceed = window.confirm(`ATENÇÃO CONFLITO DE GRADE!\n\nO período selecionado contém apenas ${workingDays} dias úteis (Seg-Sex), totalizando ~${availableHours} horas (base 4h/dia).\nMas a duração do curso exige ${targetHours} horas.\n\nDeseja ignorar o alerta e criar a turma mesmo assim (talvez usando Sábados Extras)?`)
                if (!proceed) return
            }
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

    const handleStartClass = async (classId, className) => {
        const confirmedDate = window.prompt(`Registrar Data Real de Início para a Turma: ${className}\n\nDeixe em branco para usar a data de hoje ou preencha no formato YYYY-MM-DD:`, new Date().toISOString().split('T')[0])

        if (confirmedDate !== null) {
            const dateToSave = confirmedDate || new Date().toISOString().split('T')[0]
            const { error } = await supabase.from('classes').update({ actual_start_date: dateToSave }).eq('id', classId)

            if (error) {
                alert('Erro ao iniciar turma: ' + error.message)
            } else {
                alert('Marcada como Em Andamento com sucesso!')
                fetchClasses()
            }
        }
    }

    const handleEndClass = async (classId, className) => {
        const confirmedDate = window.prompt(`Registrar Data Real de TÉRMINO para a Turma: ${className}\n\nIsso fechará a turma definitivamente. Deixe em branco para usar a data de hoje ou preencha (YYYY-MM-DD):`, new Date().toISOString().split('T')[0])

        if (confirmedDate !== null) {
            const dateToSave = confirmedDate || new Date().toISOString().split('T')[0]
            const { error } = await supabase.from('classes').update({ actual_end_date: dateToSave }).eq('id', classId)

            if (error) {
                alert('Erro ao encerrar turma: ' + error.message)
            } else {
                alert('Turma finalizada e arquivada com sucesso!')
                fetchClasses()
            }
        }
    }

    const handleOpenClassStudents = async (turma) => {
        setSelectedClassData(turma)
        setModalLoading(true)

        // Buscar alunos matriculados e informações vinculadas como faltas e notas.
        const { data, error } = await supabase
            .from('students')
            .select(`
                id, full_name, cpf, manual_signed,
                attendance_records ( status ),
                academic_records ( grade, final_status )
            `)
            .eq('turma_id', turma.id)
            .order('full_name', { ascending: true })

        if (!error && data) {
            setClassStudents(data)
        } else {
            alert("Erro ao buscar alunos da turma.")
        }
        setModalLoading(false)
    }

    const printClassReport = (turma, includeGrades) => {
        const payload = {
            name: turma.name,
            course: turma.course,
            startDate: turma.startDate,
            predictedEndDate: turma.predictedEndDate,
            includeGrades: includeGrades,
            students: classStudents
        }
        generateDocument('relatorio_turma', payload)
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
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Início (Previsto vs Real)</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                            <p className="text-muted" style={{ textDecoration: turma.actualStartDate ? 'line-through' : 'none' }}>
                                                {turma.startDate ? new Date(turma.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                            </p>
                                            {turma.actualStartDate && (
                                                <span style={{ color: '#065F46', fontWeight: 600 }}>{new Date(turma.actualStartDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} className={turma.actualEndDate ? "text-success" : "text-warning"} />
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Término ({turma.actualEndDate ? 'Real / Fechado' : 'Previsão'})</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                            <p className="text-muted" style={{ textDecoration: turma.actualEndDate ? 'line-through' : 'none' }}>
                                                {turma.predictedEndDate ? new Date(turma.predictedEndDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                            </p>
                                            {turma.actualEndDate && (
                                                <span style={{ color: '#065F46', fontWeight: 600 }}>{new Date(turma.actualEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {!turma.actualStartDate && (
                                    <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }} onClick={() => handleStartClass(turma.id, turma.name)}>
                                        <CalendarIcon size={16} /> Marcar Início Oficial
                                    </button>
                                )}
                                {(turma.actualStartDate && !turma.actualEndDate) && (
                                    <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' }} onClick={() => handleEndClass(turma.id, turma.name)}>
                                        <Clock size={16} /> Encerrar e Fechar Turma
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenClassStudents(turma)}>
                                        <Users size={16} /> Alunos
                                    </button>
                                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                        <LogIn size={16} /> Fichário
                                    </button>
                                </div>
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

            {/* MODAL: ALUNOS DA TURMA E RELATÓRIOS */}
            {selectedClassData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '1rem', paddingTop: '5vh' }}>
                    <div className="card animate-fade-in" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Relatório da Turma: {selectedClassData.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedClassData.course}</p>
                            </div>
                            <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }} onClick={() => setSelectedClassData(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Ações de Impressão */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }} onClick={() => printClassReport(selectedClassData, false)}>
                                <Printer size={18} /> Relatório Padrão (Sem Notas)
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => printClassReport(selectedClassData, true)}>
                                <FileText size={18} /> Relatório Gerencial (Com Notas e Faltas)
                            </button>
                        </div>

                        {/* Tabela de Preview dos Alunos */}
                        {modalLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando vínculos...</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.75rem' }}>Nome do Aluno(a)</th>
                                        <th style={{ padding: '0.75rem' }}>CPF</th>
                                        <th style={{ padding: '0.75rem' }}>Manual?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map(st => (
                                        <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 500 }}>{st.full_name}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{st.cpf}</td>
                                            <td style={{ padding: '0.75rem' }}>{st.manual_signed ? 'Sim' : 'Não'}</td>
                                        </tr>
                                    ))}
                                    {classStudents.length === 0 && (
                                        <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum aluno matriculado nesta turma ainda.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
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
                    <div className="form-group">
                        <label className="form-label">Nome da Turma (Ex: T01/26)</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerado automaticamente pelo sistema, mas pode ser alterado se necessário.</span>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Curso</label>
                        <select className="form-control" name="course_name" value={formData.course_name} onChange={handleFormChange}>
                            <option value="Controle Dimensional – Caldeiraria e Tubulação – (CD-CL)">Controle Dimensional – Caldeiraria e Tubulação – (CD-CL)</option>
                            <option value="Controle Dimensional – Topografia (CD-TO)">Controle Dimensional – Topografia (CD-TO)</option>
                            <option value="Controle Dimensional - Mecânica- (CD-CM)">Controle Dimensional - Mecânica- (CD-CM)</option>
                            <option value="TREINAMENTO Dimensional – Caldeiraria e Tubulação – (CD-CL)">TREINAMENTO Dimensional – Caldeiraria e Tubulação – (CD-CL)</option>
                            <option value="Treinamento Dimensional – Topografia (CD-TO)">Treinamento Dimensional – Topografia (CD-TO)</option>
                            <option value="Treinamento Dimensional - Mecânica- (CD-CM)">Treinamento Dimensional - Mecânica- (CD-CM)</option>
                        </select>
                    </div>
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
