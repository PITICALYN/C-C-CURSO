import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateDocument } from '../lib/pdfGenerator'
import { Search, Plus, Filter, Eye, Printer, FileText, FileBadge, Award, UploadCloud, Paperclip } from 'lucide-react'

export default function Alunos() {
    const [view, setView] = useState('list') // list | add | detail (student obj)
    const [searchTerm, setSearchTerm] = useState('')
    const [students, setStudents] = useState([])
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [formData, setFormData] = useState({
        full_name: '', cpf: '', rg: '', birth_date: '', birth_place: '', marital_status: 'Solteiro(a)',
        pai: '', mae: '', education_level: 'Ensino Médio Completo', email: '', phone: '',
        cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', turma_id: ''
    })

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const { data: clsData } = await supabase.from('classes').select('*')
            if (clsData) setClasses(clsData)

            const { data: stdData, error } = await supabase
                .from('students')
                .select('*, classes(name)')
                .order('created_at', { ascending: false })

            if (error) throw error

            const formatted = stdData.map(s => ({
                id: s.id,
                num: s.matricula_numero,
                name: s.full_name,
                cpf: s.cpf,
                class: s.classes ? s.classes.name : 'Sem Turma',
                status: 'Ativo',
                originalData: s
            }))
            setStudents(formatted)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudents()
    }, [])

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cpf.includes(searchTerm)
    )

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.cpf) {
            alert('Por favor, preencha pelo menos Nome e CPF.')
            return
        }

        const newStudent = {
            full_name: formData.full_name,
            cpf: formData.cpf,
            rg: formData.rg,
            birth_date: formData.birth_date ? formData.birth_date : null,
            birth_place: formData.birth_place,
            marital_status: formData.marital_status,
            email: formData.email,
            phone: formData.phone,
            education_level: formData.education_level,
            turma_id: formData.turma_id ? formData.turma_id : null,
            parents_names: { pai: formData.pai, mae: formData.mae },
            address: { cep: formData.cep, rua: formData.rua, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado }
        }

        const { error } = await supabase.from('students').insert([newStudent])

        if (error) {
            alert('Erro ao salvar no Supabase: ' + error.message)
        } else {
            alert('Matrícula realizada com sucesso na Nuvem!')
            setView('list')
            fetchStudents()
        }
    }

    const renderList = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Alunos</h2>
                <button className="btn btn-primary" onClick={() => setView('add')}>
                    <Plus size={20} /> Nova Matrícula
                </button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text" className="form-control" placeholder="Buscar por nome ou CPF..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '1rem' }}>Matrícula</th>
                                <th style={{ padding: '1rem' }}>Nome Completo</th>
                                <th style={{ padding: '1rem' }}>CPF</th>
                                <th style={{ padding: '1rem' }}>Turma</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da Nuvem...</td></tr>
                            ) : filteredStudents.map((s, idx) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{s.num}</td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.cpf}</td>
                                    <td style={{ padding: '1rem' }}>{s.class}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Ativo' ? '#D1FAE5' : '#FEE2E2', color: s.status === 'Ativo' ? '#065F46' : '#991B1B' }}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Visualizar Perfil" onClick={() => setView(s)}><Eye size={16} /></button>
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Impressão Rápida" onClick={() => setView(s)}><Printer size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )

    const renderAddForm = () => (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setView('list')}>&larr; Voltar para listagem</button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nova Ficha de Matrícula</h2>
                </div>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Matrícula (Nuvem)</button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>1. Dados Pessoais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group"><label className="form-label">Nome Completo</label><input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">CPF</label><input type="text" className="form-control" name="cpf" value={formData.cpf} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Identidade (RG)</label><input type="text" className="form-control" name="rg" value={formData.rg} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Data de Nascimento</label><input type="date" className="form-control" name="birth_date" value={formData.birth_date} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Naturalidade</label><input type="text" className="form-control" name="birth_place" value={formData.birth_place} onChange={handleFormChange} /></div>
                    <div className="form-group">
                        <label className="form-label">Estado Civil</label>
                        <select className="form-control" name="marital_status" value={formData.marital_status} onChange={handleFormChange}>
                            <option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option>
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Nome do Pai</label><input type="text" className="form-control" name="pai" value={formData.pai} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Nome da Mãe</label><input type="text" className="form-control" name="mae" value={formData.mae} onChange={handleFormChange} /></div>
                    <div className="form-group">
                        <label className="form-label">Escolaridade</label>
                        <select className="form-control" name="education_level" value={formData.education_level} onChange={handleFormChange}>
                            <option>Ensino Médio Incompleto</option><option>Ensino Médio Completo</option><option>Ensino Superior</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>2. Contato e Endereço</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group"><label className="form-label">E-mail</label><input type="email" className="form-control" name="email" value={formData.email} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Telefone</label><input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleFormChange} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                    <div className="form-group"><label className="form-label">CEP</label><input type="text" className="form-control" name="cep" value={formData.cep} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Rua/Logradouro</label><input type="text" className="form-control" name="rua" value={formData.rua} onChange={handleFormChange} /></div>
                    <div className="form-group"><label className="form-label">Nº</label><input type="text" className="form-control" name="numero" value={formData.numero} onChange={handleFormChange} /></div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>3. Turma (DB Link)</h3>
                <div className="form-group">
                    <label className="form-label">Selecione a Turma</label>
                    <select className="form-control" name="turma_id" value={formData.turma_id} onChange={handleFormChange}>
                        <option value="">Selecione...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.course_name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setView('list')}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Matrícula (Supabase)</button>
            </div>
        </div>
    )

    const renderDetail = (student) => (
        <div className="animate-fade-in">
            <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setView('list')}>&larr; Voltar para Listagem</button>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div><h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ficha: {student.name}</h2><p className="text-muted">CPF: {student.cpf}</p></div>
                    <div style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600, backgroundColor: '#D1FAE5', color: '#065F46' }}>Ativo</div>
                </div>

                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Central de Impressão Rápida (PDF Automático)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => generateDocument('contrato', student)}><FileText size={18} />Contrato de Capacitação</button>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => generateDocument('recibo', student)}><Printer size={18} />Recibo Simplificado</button>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => generateDocument('declaracao', student)}><FileBadge size={18} />Declaração</button>
                    <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => generateDocument('certificado', student)}><Award size={18} />Certificado RT</button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="alunos-container">
            {view === 'list' && renderList()}
            {view === 'add' && renderAddForm()}
            {typeof view === 'object' && renderDetail(view)}
        </div>
    )
}
