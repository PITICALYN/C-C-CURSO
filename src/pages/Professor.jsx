import { useState } from 'react'
import { MOCK_CLASSES, MOCK_STUDENTS } from '../lib/mockData'
import { BookOpen, CheckSquare, List, Calendar as CalendarIcon, Edit3, ShieldAlert } from 'lucide-react'

export default function Professor() {
    const [activeTab, setActiveTab] = useState('minhasTurmas') // minhasTurmas | diario
    const [selectedClass, setSelectedClass] = useState(null)

    const renderTurmas = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {MOCK_CLASSES.map(turma => (
                    <div key={turma.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{turma.name}</h3>
                                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Curso: {turma.course}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ justifyContent: 'center' }}
                                onClick={() => {
                                    setSelectedClass(turma)
                                    setActiveTab('diario')
                                }}
                            >
                                <BookOpen size={16} /> Abrir Diário de Classe (Fichário)
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderDiario = () => {
        if (!selectedClass) return null

        // Mock students for this class based on their assignment
        const classStudents = MOCK_STUDENTS.filter(s => s.class === selectedClass.name)

        return (
            <div className="animate-fade-in">
                <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => {
                    setActiveTab('minhasTurmas')
                    setSelectedClass(null)
                }}>
                    &larr; Voltar às Minhas Turmas
                </button>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedClass.name} - Diário de Classe</h2>
                    <p className="text-muted">Preencha o conteúdo lecionado e a presença de hoje ({new Date().toLocaleDateString('pt-BR')}).</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

                    {/* Lançamento do Fichário */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit3 size={18} /> Novo Registro (Ficha)
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Data Lecionada</label>
                            <input type="date" className="form-control" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Conteúdo Diferido / Atividade</label>
                            <textarea className="form-control" rows="5" placeholder="Descreva o que foi ensinado na aula de hoje..."></textarea>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', margin: '1rem 0', padding: '1rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                            <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                            <div>
                                <strong>Atenção:</strong> De acordo com a Regra do Sistema, você não poderá alterar este registro após salvá-lo. Em caso de correção, será necessário intervenção de um Usuário Coordenador.
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }}>Salvar Fichário do Dia</button>
                    </div>

                    {/* Chamada de Alunos */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckSquare size={18} /> Chamada / Frequência
                        </h3>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Aluno (Matriculado)</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Presente</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Falta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map(student => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{student.name}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <input type="radio" name={`presenca_${student.id}`} value="presente" defaultChecked />
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <input type="radio" name={`presenca_${student.id}`} value="falta" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary">Registrar Presenças</button>
                        </div>
                    </div>

                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Portal do Instrutor</h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'minhasTurmas' || activeTab === 'diario' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    <List size={16} /> Diário de Turmas
                </button>
            </div>

            {activeTab === 'minhasTurmas' && renderTurmas()}
            {activeTab === 'diario' && renderDiario()}
        </div>
    )
}
