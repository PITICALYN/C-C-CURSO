import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Mail, Shield, Plus, Lock } from 'lucide-react'

export default function Equipe() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', role: 'atendente',
        permissions: { upload_manual: false }
    })
    const [errorMsg, setErrorMsg] = useState('')

    const fetchUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('users').select('*, permissions').order('created_at', { ascending: false })
        if (!error && data) setUsers(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        // Usa o admin trick ou Auth SignUp (Se AutoConfirm estiver On)
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.full_name,
                    role: formData.role,
                    permissions: formData.permissions
                }
            }
        })

        if (error) {
            setErrorMsg(error.message)
        } else {
            // Sincronização Manual: Inserir na tabela public.users
            const { error: dbError } = await supabase.from('users').insert([{
                id: data.user.id,
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                permissions: formData.permissions
            }])

            if (dbError) {
                console.error("Erro ao sincronizar perfil no BD:", dbError)
                setErrorMsg("Conta criada no Auth, mas falhou ao salvar perfil: " + dbError.message)
            } else {
                alert('Membro da equipe cadastrado e ativado com sucesso!')
                setShowModal(false)
                setFormData({ email: '', password: '', full_name: '', role: 'atendente', permissions: { upload_manual: false } })
                fetchUsers()
            }
        }
        setLoading(false)
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Equipe (Acesso Mestre)</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Novo Colaborador
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '1rem' }}>Nome Completo</th>
                            <th style={{ padding: '1rem' }}>E-mail</th>
                            <th style={{ padding: '1rem' }}>Papel / Função</th>
                            <th style={{ padding: '1rem' }}>Permissões Extras</th>
                            <th style={{ padding: '1rem' }}>Data de Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Carregando Membros...</td></tr>}
                        {!loading && users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{u.full_name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                                        backgroundColor: u.role === 'admin' ? '#FEE2E2' : (u.role === 'coordenador' ? '#FEF3C7' : '#E0E7FF'),
                                        color: u.role === 'admin' ? '#991B1B' : (u.role === 'coordenador' ? '#92400E' : '#3730A3'),
                                        textTransform: 'uppercase'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {u.permissions?.upload_manual ? (
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '4px', border: '1px solid #A7F3D0' }}>Gerencia Manuais</span>
                                        ) : <span className="text-muted" style={{ fontSize: '0.75rem' }}>Padrão</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '1rem', paddingTop: '5vh' }}>
                    <div className="card animate-fade-in" style={{ width: '500px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><Shield size={20} /> Cadastrar Nova Conta</h3>

                        {errorMsg && <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{errorMsg}</div>}

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label className="form-label">Nome Completo</label>
                                <input type="text" className="form-control" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail Corporativo</label>
                                <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nível de Permissão</label>
                                <select className="form-control" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="atendente">Atendente (Vendas & Matrículas)</option>
                                    <option value="instrutor">Instrutor (Diários e Notas)</option>
                                    <option value="coordenador">Coordenador (Financeiro e Currículo)</option>
                                    <option value="admin">Administrador Geral</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <label className="form-label" style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>Permissões Específicas (Opcional)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="perm_upload_manual"
                                        checked={formData.permissions.upload_manual}
                                        onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, upload_manual: e.target.checked } })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="perm_upload_manual" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>Pode Atualizar e Fazer Upload de "Manuais do Aluno"</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Senha Inicial do Usuário</label>
                                <input type="password" placeholder="Min. 6 caracteres" className="form-control" required minLength="6" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Criando...' : 'Criar Conta'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
