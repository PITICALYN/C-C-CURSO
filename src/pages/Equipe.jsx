import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Shield, Plus, UserCheck, RefreshCw, Trash2, UserX, UserCheck2 } from 'lucide-react'

export default function Equipe() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        email: '', password: '', full_name: '', role: 'atendente',
        permissions: { upload_manual: false }
    })
    const [errorMsg, setErrorMsg] = useState('')
    const [currentUser, setCurrentUser] = useState(null)

    const fetchUsers = async () => {
        setLoading(true)
        setErrorMsg('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            const { data, error } = await supabase
                .from('users')
                .select('*, permissions')
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Erro Fetch Equipe:", error)
                setErrorMsg(`Erro ao carregar equipe: ${error.message}`)
            } else {
                setUsers(data || [])
            }
        } catch (e) {
            setErrorMsg("Erro inesperado na aplicação: " + e.message)
        }
        setLoading(false)
    }

    const handleSyncOwnProfile = async () => {
        if (!currentUser) return
        setLoading(true)
        try {
            const { error } = await supabase.from('users').upsert([{
                id: currentUser.id,
                email: currentUser.email,
                full_name: currentUser.user_metadata?.full_name || 'Administrador Principal',
                role: currentUser.user_metadata?.role || 'admin',
                permissions: currentUser.user_metadata?.permissions || { upload_manual: true },
                is_active: true
            }])
            if (error) {
                alert("Erro ao sincronizar: " + error.message)
            } else {
                alert("Perfil sincronizado! Agora você aparece na lista.")
                fetchUsers()
            }
        } catch (e) {
            alert("Falha: " + e.message)
        }
        setLoading(false)
    }

    const handleToggleActive = async (userId, currentStatus) => {
        if (!confirm(`Deseja ${currentStatus ? 'BLOQUEAR' : 'ATIVAR'} este usuário?`)) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', userId)

            if (error) throw error
            fetchUsers()
        } catch (e) {
            alert("Erro ao alterar status: " + e.message)
        }
        setLoading(false)
    }

    const handleDeleteUser = async (userId, userEmail) => {
        if (userId === currentUser?.id) {
            alert("Você não pode excluir a si mesmo!")
            return
        }

        if (!confirm(`ATENÇÃO: Deseja EXCLUIR permanentemente o usuário ${userEmail} da lista da equipe? \n\nNota: Isso removerá o perfil do banco de dados, mas não exclui a conta de login (Auth).`)) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)

            if (error) throw error
            fetchUsers()
        } catch (e) {
            alert("Erro ao excluir: " + e.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

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
            const { error: dbError } = await supabase.from('users').insert([{
                id: data.user.id,
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                permissions: formData.permissions,
                is_active: true
            }])

            if (dbError) {
                console.error("Erro ao sincronizar perfil no BD:", dbError)
                setErrorMsg("Conta criada, mas falhou ao salvar perfil no banco: " + dbError.message)
            } else {
                alert('Membro da equipe cadastrado com sucesso!')
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
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Equipe</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Administre os acessos dos colaboradores ao sistema.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading} title="Atualizar Lista">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Novo Colaborador
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #FECACA', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Shield size={20} />
                    <span style={{ fontSize: '0.875rem' }}>{errorMsg}</span>
                </div>
            )}

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '1rem' }}>Nome Completo</th>
                            <th style={{ padding: '1rem' }}>E-mail</th>
                            <th style={{ padding: '1rem' }}>Papel / Função</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 && <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>Carregando Membros...</td></tr>}
                        {!loading && users.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                                        <p>Nenhum membro encontrado na lista oficial.</p>
                                        <div style={{ marginTop: '1.5rem', backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
                                            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#64748b' }}>Se você é o administrador, sincronize seu perfil agora:</p>
                                            <button className="btn btn-primary" onClick={handleSyncOwnProfile}>
                                                <UserCheck size={18} /> Sincronizar Meu Nome na Lista
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: u.is_active === false ? 0.6 : 1 }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                    {u.full_name}
                                    {u.is_active === false && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 'bold' }}>(BLOQUEADO)</span>}
                                </td>
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
                                    {u.permissions?.upload_manual ? (
                                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '4px', border: '1px solid #A7F3D0' }}>Gestor de Manuais</span>
                                    ) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Acesso Padrão</span>}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0' }}
                                            title={u.is_active === false ? "Ativar Usuário" : "Bloquear Usuário"}
                                            onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                                        >
                                            {u.is_active === false ? <UserCheck2 size={16} color="#059669" /> : <UserX size={16} color="#dc2626" />}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0' }}
                                            title="Excluir da Lista"
                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                        >
                                            <Trash2 size={16} color="#64748b" />
                                        </button>
                                    </div>
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
                                <label className="form-label" style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>Permissões Específicas</label>
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
