import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateDocument } from '../lib/pdfGenerator'
import { Search, Plus, Filter, Eye, Printer, FileText, FileBadge, Award, UploadCloud, Paperclip, Lock, Unlock, BookOpen, CheckSquare } from 'lucide-react'

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
        cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', turma_id: '',
        how_knew: 'Amigo', how_knew_other: '',
        base_value: '', discount_value: '', manual_signed: false
    })

    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authPassword, setAuthPassword] = useState('')
    const [authError, setAuthError] = useState('')
    const [discountUnlocked, setDiscountUnlocked] = useState(false)
    const [isEditing, setIsEditing] = useState(null) // ID do aluno sendo editado

    // Eval state
    const [evalData, setEvalData] = useState({ exam_type: 'TEORICA', attempt: 1, grade: '', retraining_hours: 0, date: new Date().toISOString().split('T')[0] })

    const handleEvalSubmit = async (student_id, class_id) => {
        if (!evalData.grade || !evalData.date) return alert("Preencha a nota e a data.")
        const payload = { ...evalData, student_id, class_id, grade: parseFloat(evalData.grade) }
        const { error } = await supabase.from('student_evaluations').insert([payload])
        if (error) alert("Erro ao lançar nota: " + error.message)
        else {
            alert("Lançamento de Avaliação efetuado com sucesso!")
            setEvalData({ exam_type: 'TEORICA', attempt: 1, grade: '', retraining_hours: 0, date: new Date().toISOString().split('T')[0] })
            fetchStudents()
        }
    }

    const handleUnlockDiscount = async (e) => {
        e.preventDefault()
        setAuthError('')
        const { data, error } = await supabase.from('financial_pins').select('*').eq('pin', authPassword).single()
        if (data) {
            setDiscountUnlocked(true)
            setShowAuthModal(false)
            setAuthPassword('')
        } else {
            setAuthError('Senha de autorização incorreta.')
        }
    }

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const { data: clsData } = await supabase.from('classes').select('*')
            if (clsData) setClasses(clsData)

            const { data: stdData, error } = await supabase
                .from('students')
                .select('*, classes(name, course_name), academic_records(*), student_evaluations(*)')
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

        const studentPayload = {
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
            how_knew: formData.how_knew,
            how_knew_other: formData.how_knew === 'Outro' ? formData.how_knew_other : null,
            parents_names: { pai: formData.pai, mae: formData.mae },
            address: { cep: formData.cep, rua: formData.rua, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado },
            base_value: formData.base_value ? parseFloat(formData.base_value) : 0,
            discount_value: formData.discount_value && discountUnlocked ? parseFloat(formData.discount_value) : 0,
            manual_signed: formData.manual_signed
        }

        let result;
        if (isEditing) {
            result = await supabase.from('students').update(studentPayload).eq('id', isEditing)
        } else {
            result = await supabase.from('students').insert([studentPayload])
        }

        if (result.error) {
            alert('Erro ao salvar no Supabase: ' + result.error.message)
        } else {
            alert(isEditing ? 'Dados atualizados com sucesso!' : 'Matrícula realizada com sucesso!')
            resetForm()
            setView('list')
            fetchStudents()
        }
    }

    const resetForm = () => {
        setFormData({
            full_name: '', cpf: '', rg: '', birth_date: '', birth_place: '', marital_status: 'Solteiro(a)',
            pai: '', mae: '', education_level: 'Ensino Médio Completo', email: '', phone: '',
            cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', turma_id: '',
            how_knew: 'Amigo', how_knew_other: '',
            base_value: '', discount_value: '', manual_signed: false
        })
        setIsEditing(null)
        setDiscountUnlocked(false)
    }

    const handleEdit = (student) => {
        const s = student.originalData
        setFormData({
            full_name: s.full_name || '',
            cpf: s.cpf || '',
            rg: s.rg || '',
            birth_date: s.birth_date || '',
            birth_place: s.birth_place || '',
            marital_status: s.marital_status || 'Solteiro(a)',
            pai: s.parents_names?.pai || '',
            mae: s.parents_names?.mae || '',
            education_level: s.education_level || 'Ensino Médio Completo',
            email: s.email || '',
            phone: s.phone || '',
            cep: s.address?.cep || '',
            rua: s.address?.rua || '',
            numero: s.address?.numero || '',
            bairro: s.address?.bairro || '',
            cidade: s.address?.cidade || '',
            estado: s.address?.estado || '',
            turma_id: s.turma_id || '',
            how_knew: s.how_knew || 'Amigo',
            how_knew_other: s.how_knew_other || '',
            base_value: s.base_value || '',
            discount_value: s.discount_value || '',
            manual_signed: s.manual_signed || false
        })
        setIsEditing(s.id)
        setView('add')
    }

    const handleDownloadManual = async () => {
        const { data: settings } = await supabase.from('system_settings').select('value').eq('key', 'manual_aluno_url').single()
        if (settings && settings.value) {
            fetch(settings.value)
                .then(res => res.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob)
                    window.open(url, '_blank')
                })
        } else {
            alert('O Manual do Aluno ainda não foi configurado pelos gestores. Verifique no painel de "Modelos Oficiais".')
        }
    }

    const handleSignManual = async (studentId) => {
        const confirmSign = window.confirm("Confirmar que o aluno recebeu fisicamente/digitalmente e assinou o termo do Manual do Aluno?")
        if (confirmSign) {
            const { error } = await supabase.from('students').update({ manual_signed: true }).eq('id', studentId)
            if (error) {
                alert('Erro ao registrar assinatura: ' + error.message)
            } else {
                alert('Termo Assinado registrado com sucesso! (O certificado agora pode ser impresso no futuro).')
                fetchStudents()
                setView(prev => ({ ...prev, originalData: { ...prev.originalData, manual_signed: true } }))
            }
        }
    }

    const renderList = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Alunos</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setView('add'); }}>
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
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Editar Dados" onClick={() => handleEdit(s)}><FileText size={16} /></button>
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
                    <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => { resetForm(); setView('list'); }}>&larr; Voltar para listagem</button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{isEditing ? 'Editar Ficha do Aluno' : 'Nova Ficha de Matrícula'}</h2>
                </div>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Matrícula</button>
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

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>3. Pesquisa e Marketing</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1.5rem', alignItems: 'end' }}>
                    <div className="form-group">
                        <label className="form-label">Como conheceu o curso?</label>
                        <select className="form-control" name="how_knew" value={formData.how_knew} onChange={handleFormChange}>
                            <option value="Amigo">Indicação de Amigo / Ex-Aluno</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Outro">Outro Canal/Forma</option>
                        </select>
                    </div>
                    {formData.how_knew === 'Outro' && (
                        <div className="form-group animate-fade-in">
                            <label className="form-label">Qual outro canal? (Especifique)</label>
                            <input type="text" className="form-control" name="how_knew_other" value={formData.how_knew_other} onChange={handleFormChange} placeholder="Ex: Panfleto, Outdoor, Rádio..." />
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>4. Dados Financeiros & Matrícula</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
                    <div className="form-group">
                        <label className="form-label">Valor do Curso Bruto (R$)</label>
                        <input type="number" step="0.01" className="form-control" name="base_value" value={formData.base_value} onChange={handleFormChange} placeholder="Ex: 1500.00" />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Desconto Autorizado (R$)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="number" step="0.01" className="form-control" name="discount_value" value={formData.discount_value} onChange={handleFormChange} disabled={!discountUnlocked} placeholder={!discountUnlocked ? "Bloqueado..." : "Ex: 200.00"} />
                            {!discountUnlocked ? (
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAuthModal(true)} title="Desbloquear Desconto" style={{ padding: '0.5rem 0.75rem' }}><Lock size={18} /></button>
                            ) : (
                                <button type="button" className="btn btn-secondary" disabled style={{ padding: '0.5rem 0.75rem', color: 'green', borderColor: 'green' }}><Unlock size={18} /></button>
                            )}
                        </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" id="manual_signed" checked={formData.manual_signed} onChange={(e) => setFormData({ ...formData, manual_signed: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                            <label htmlFor="manual_signed" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>Aluno Assinou o Manual?</label>
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={handleDownloadManual} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Printer size={16} /> Imprimir Manual
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>5. Turma (DB Link)</h3>
                <div className="form-group">
                    <label className="form-label">Selecione a Turma</label>
                    <select className="form-control" name="turma_id" value={formData.turma_id} onChange={handleFormChange}>
                        <option value="">Selecione...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.course_name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => { resetForm(); setView('list'); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmit}>Salvar Matrícula</button>
            </div>
        </div>
    )

    const renderDetail = (student) => {
        const courseName = student.originalData?.classes?.course_name || ''
        const requiresEval = courseName.includes('CD-CL') || courseName.includes('CD-TO') || courseName.includes('CD-CM')
        const evals = student.originalData?.student_evaluations || []

        const maxTeorica = Math.max(0, ...evals.filter(e => e.exam_type === 'TEORICA').map(e => e.grade))
        const maxPratica = Math.max(0, ...evals.filter(e => e.exam_type === 'PRATICA').map(e => e.grade))
        const attemptsTeorica = evals.filter(e => e.exam_type === 'TEORICA').length
        const attemptsPratica = evals.filter(e => e.exam_type === 'PRATICA').length

        const isApproved = maxTeorica >= 7 && maxPratica >= 7
        const isReprovado = (attemptsTeorica >= 3 && maxTeorica < 7) || (attemptsPratica >= 3 && maxPratica < 7)

        let statusBadge = { label: 'Em Andamento', bg: '#DBEAFE', color: '#1E40AF' }
        if (isApproved) statusBadge = { label: 'Aprovado (Certificado Liberado)', bg: '#D1FAE5', color: '#065F46' }
        else if (isReprovado) statusBadge = { label: 'Reprovado (Atestado)', bg: '#FEE2E2', color: '#991B1B' }

        return (
            <div className="animate-fade-in">
                <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setView('list')}>&larr; Voltar para Listagem</button>
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div><h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ficha: {student.name}</h2><p className="text-muted">CPF: {student.cpf}</p></div>
                        <div style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600, backgroundColor: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</div>
                    </div>

                    <div style={{ padding: '1.5rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>Central de Emissão de Documentos e PDFs</h3>
                        {!student.originalData.manual_signed && (
                            <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>⚠️ O Certificado RT está bloqueado: Aluno não assinou/entregou o Manual.</span>
                                <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleSignManual(student.id)}>Registrar Entrega do Manual</button>
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={handleDownloadManual}><BookOpen size={18} className="text-secondary" /> Imprimir Manual</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={() => generateDocument('matricula', student)}><FileText size={18} />Ficha de Matrícula</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={() => generateDocument('recibo', student)}><Printer size={18} />Recibo de Pagamento</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={() => generateDocument('inscrito', student)}><FileBadge size={18} />Declaração de Inscrito</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={() => generateDocument('termino', student)}><FileBadge size={18} />Declaração de Término</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#fff' }} onClick={() => generateDocument('contrato', student)}><FileText size={18} />Contrato (4 Págs)</button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', backgroundColor: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE', gridColumn: '1 / -1' }} onClick={() => generateDocument('melhorias', student)}><FileText size={18} />Pontos de Melhorias</button>
                            <button className="btn btn-primary" style={{ justifyContent: 'center', opacity: student.originalData.manual_signed ? 1 : 0.5, gridColumn: '1 / -1' }} disabled={!student.originalData.manual_signed} onClick={() => {
                                student.originalData.academic_records = [{ final_status: isReprovado ? 'REPROVADO' : 'APROVADO' }];
                                generateDocument('certificado', student)
                            }}><Award size={18} />Emitir Certificado / Atestado (Oficial)</button>
                        </div>
                    </div>

                    {requiresEval && (
                        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', backgroundColor: 'var(--bg-color)' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={20} /> Lançamento de Avaliações Técnicas</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Novo Lançamento</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Prova</label>
                                            <select className="form-control" style={{ padding: '0.5rem' }} value={evalData.exam_type} onChange={e => setEvalData({ ...evalData, exam_type: e.target.value })}>
                                                <option value="TEORICA">Teórica</option><option value="PRATICA">Prática</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nota (0 - 10)</label>
                                                <input type="number" step="0.1" className="form-control" style={{ padding: '0.5rem' }} value={evalData.grade} onChange={e => setEvalData({ ...evalData, grade: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nº Tentativa</label>
                                                <input type="number" min="1" max="3" className="form-control" style={{ padding: '0.5rem' }} value={evalData.attempt} onChange={e => setEvalData({ ...evalData, attempt: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Retreinamento (Horas)</label>
                                                <input type="number" className="form-control" style={{ padding: '0.5rem' }} placeholder="Ex: 16" value={evalData.retraining_hours} onChange={e => setEvalData({ ...evalData, retraining_hours: parseInt(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Data</label>
                                                <input type="date" className="form-control" style={{ padding: '0.5rem' }} value={evalData.date} onChange={e => setEvalData({ ...evalData, date: e.target.value })} />
                                            </div>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => handleEvalSubmit(student.id, student.originalData.turma_id)} style={{ padding: '0.5rem', marginTop: '0.5rem' }}>Salvar Nota</button>
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Histórico de Lançamentos</h4>
                                    {evals.length === 0 ? <p className="text-muted" style={{ fontSize: '0.9rem' }}>Nenhuma avaliação lançada ainda.</p> : (
                                        <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Data</th>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Tipo</th>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Tent.</th>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Nota</th>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Retreino</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {evals.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
                                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--bg-color)' }}>
                                                        <td style={{ padding: '0.5rem 0' }}>{new Date(e.date).toLocaleDateString()}</td>
                                                        <td style={{ padding: '0.5rem 0', fontWeight: 600, color: e.exam_type === 'TEORICA' ? '#1E40AF' : '#92400E' }}>{e.exam_type}</td>
                                                        <td style={{ padding: '0.5rem 0' }}>{e.attempt}ª</td>
                                                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold', color: e.grade >= 7 ? '#059669' : '#DC2626' }}>{e.grade}</td>
                                                        <td style={{ padding: '0.5rem 0' }}>{e.retraining_hours > 0 ? `${e.retraining_hours}h` : '--'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                        <div>
                            <h4 style={{ margin: 0 }}>Deseja corrigir algum dado deste aluno?</h4>
                            <p className="text-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>Altere CPF, Nome ou outras informações pessoais.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleEdit(student)}>Editar Cadastro</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="alunos-container">
            {view === 'list' && renderList()}
            {view === 'add' && renderAddForm()}
            {typeof view === 'object' && renderDetail(view)}

            {showAuthModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><Lock size={20} /> Autorização de Gestor</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Insira a senha mestra ou PIN financeiro para habilitar a aplicação de descontos na matrícula.</p>
                        {authError && <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{authError}</div>}
                        <input type="password" placeholder="PIN de Autorização..." className="form-control" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ marginBottom: '1.5rem', letterSpacing: '2px', textAlign: 'center', fontSize: '1.25rem' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAuthModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleUnlockDiscount}>Desbloquear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
