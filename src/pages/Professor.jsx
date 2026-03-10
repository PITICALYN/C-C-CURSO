import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, CheckSquare, List, Calendar as CalendarIcon, Edit3, ShieldAlert } from 'lucide-react'

export default function Professor() {
    const [activeTab, setActiveTab] = useState('minhasTurmas') // minhasTurmas | diario
    const [selectedClass, setSelectedClass] = useState(null)
    const [loading, setLoading] = useState(true)

    // Data from Supabase
    const [classes, setClasses] = useState([])
    const [classStudents, setClassStudents] = useState([])

    // Form States
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
    const [recordContent, setRecordContent] = useState('')
    const [attendance, setAttendance] = useState({}) // { studentId: 'presente' | 'falta' }

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false })
            if (error) throw error
            setClasses(data || [])
        } catch (error) {
            console.error('Error fetching classes for professor:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchClassStudents = async (classId) => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('students').select('*').eq('turma_id', classId)
            if (error) throw error

            setClassStudents(data || [])

            // Initialize default attendance (all present by default to save time)
            const initialAttendance = {}
            if (data) {
                data.forEach(s => {
                    initialAttendance[s.id] = 'presente'
                })
            }
            setAttendance(initialAttendance)
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'minhasTurmas') fetchClasses()
    }, [activeTab])

    const handleOpenDiario = (turma) => {
        setSelectedClass(turma)
        setActiveTab('diario')
        fetchClassStudents(turma.id) // Fetch real students for this specific class
    }

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const handleSaveDiario = async () => {
        if (!recordContent) {
            alert('Por favor, descreva o conteúdo lecionado.')
            return
        }

        // 1. In a complete implementation, this would save to a 'class_records' and 'attendance' table in Supabase.
        // For now, we simulate success as requested.
        alert('Fichário Diário e Presença Salvos com Sucesso (Regra de Coordenador Ativa)!')

        // Return to class list
        setActiveTab('minhasTurmas')
        setSelectedClass(null)
        setRecordContent('')
    }

    const renderTurmas = () => (
        <div className="animate-fade-in">
            {loading ? <p>Carregando turmas da instituição...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {classes.map(turma => (
                        <div key={turma.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{turma.name}</h3>
                                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Curso: {turma.course_name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => handleOpenDiario(turma)}>
                                    <BookOpen size={16} /> Abrir Diário de Classe (Fichário)
                                </button>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && <p>Nenhuma turma cadastrada no BD.</p>}
                </div>
            )}
        </div>
    )

    const renderDiario = () => {
        if (!selectedClass) return null

        return (
            <div className="animate-fade-in">
                <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => { setActiveTab('minhasTurmas'); setSelectedClass(null) }}>
                    &larr; Voltar às Minhas Turmas
                </button>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedClass.name} - Diário de Classe</h2>
                    <p className="text-muted">Preencha o conteúdo lecionado e a presença da turma conectada pelo banco.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                    {/* Fichário */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit3 size={18} /> Novo Registro (Ficha)
                        </h3>
                        <div className="form-group">
                            <label className="form-label">Data Lecionada</label>
                            <input type="date" className="form-control" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Conteúdo Diferido / Atividade</label>
                            <textarea className="form-control" rows="5" placeholder="Descreva o que foi ensinado na aula de hoje..." value={recordContent} onChange={(e) => setRecordContent(e.target.value)}></textarea>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', margin: '1rem 0', padding: '1rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                            <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                            <div><strong>Atenção:</strong> De acordo com a Regra, não poderá alterar o registro após salvá-lo. (AuditTrail em Background)</div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveDiario}>Salvar Fichário e Fechar</button>
                    </div>

                    {/* Frequência */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckSquare size={18} /> Chamada / Frequência de Hoje
                        </h3>

                        {loading ? <p>Carregando alunos da Turma...</p> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '0.75rem' }}>Aluno Matriculado</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#065F46' }}>Presente</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#991B1B' }}>Falta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classStudents.map(student => (
                                            <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{student.full_name}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <input type="radio" name={`presenca_${student.id}`} value="presente"
                                                        checked={attendance[student.id] === 'presente'}
                                                        onChange={() => handleAttendanceChange(student.id, 'presente')} />
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <input type="radio" name={`presenca_${student.id}`} value="falta"
                                                        checked={attendance[student.id] === 'falta'}
                                                        onChange={() => handleAttendanceChange(student.id, 'falta')} />
                                                </td>
                                            </tr>
                                        ))}
                                        {classStudents.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>Nenhum aluno cadastrado nesta turma.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Portal do Instrutor / Professor</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'minhasTurmas' || activeTab === 'diario' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('minhasTurmas')}
                >
                    <List size={16} /> Fichário Eletrônico
                </button>
            </div>
            {activeTab === 'minhasTurmas' && renderTurmas()}
            {activeTab === 'diario' && renderDiario()}
        </div>
    )
}
