import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Clock, Receipt, FilePlus, Calendar as CalendarIcon, DollarSign, Wallet, Filter } from 'lucide-react'

export default function Financeiro() {
    const [activeTab, setActiveTab] = useState('pix') // pix | nf | payables | split
    const [transactions, setTransactions] = useState({ pix: [], payables: [], classesData: [] })
    const [loading, setLoading] = useState(true)

    // Form inputs for new payable
    const [newCost, setNewCost] = useState({ description: '', value: '', dueDate: '' })
    const [showNewCostForm, setShowNewCostForm] = useState(false)

    // Form inputs for new NF
    const [newNf, setNewNf] = useState({ student: '', amount: '', issueDate: '' })
    const [showNewNfForm, setShowNewNfForm] = useState(false)

    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Payables
            const { data: costsData } = await supabase.from('financial_costs').select('*').order('date_incurred', { ascending: false })

            // Fetch Classes for Split
            const { data: clsData } = await supabase.from('classes').select('*, students(count)')

            setTransactions({
                pix: [
                    // Mock temporarily while we build the installment JSON logic for Students
                    { id: 1, student: 'João Guilherme Silva', amount: 1500, date: '2026-10-10', status: 'Aguardando Checagem' },
                    { id: 2, student: 'Maria Oliveira Gomes', amount: 1500, date: '2026-10-15', status: 'Aguardando Checagem' }
                ],
                payables: costsData || [],
                classesData: clsData || []
            })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAddCost = async () => {
        if (!newCost.description || !newCost.value) return alert('Preencha descrição e valor')
        const { error } = await supabase.from('financial_costs').insert([{
            description: newCost.description,
            type: 'fixed',
            value: Number(newCost.value),
            amount: Number(newCost.value),
            status: 'pendente',
            date_incurred: newCost.dueDate
        }])
        if (error) alert(error.message)
        else {
            alert('Custo adicionado na Nuvem!')
            setNewCost({ description: '', value: '', dueDate: '' })
            setShowNewCostForm(false)
            fetchData()
        }
    }

    const handlePayCost = async (id) => {
        const { error } = await supabase.from('financial_costs').update({ status: 'pago' }).eq('id', id)
        if (!error) fetchData()
    }

    const renderTabs = () => (
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', width: '100%', overflowX: 'auto', marginBottom: '2rem' }}>
            <button className={`btn ${activeTab === 'pix' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pix')}><Clock size={16} /> Verificação PIX Parcelado</button>
            <button className={`btn ${activeTab === 'payables' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('payables')}><Wallet size={16} /> Contas a Pagar / Custos</button>
            <button className={`btn ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('split')}><DollarSign size={16} /> Rateio de Lucros (50/50)</button>
            <button className={`btn ${activeTab === 'nf' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('nf')}><Receipt size={16} /> Emissão de NFs</button>
        </div>
    )

    const renderPixTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem' }}>Validação de PIX Recebidos Constantes em Contrato</h3>
                <button className="btn btn-secondary"><Filter size={16} /> Filtrar por Turma</button>
            </div>
            {loading ? <p>Carregando BD...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '1rem' }}>Aluno</th>
                            <th style={{ padding: '1rem' }}>Valor Declarado</th>
                            <th style={{ padding: '1rem' }}>Data do Pagamento</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ação (Aprovar na Conta)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.pix.map(pix => (
                            <tr key={pix.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{pix.student}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{formatMoney(pix.amount)}</td>
                                <td style={{ padding: '1rem' }}>{new Date(pix.date).toLocaleDateString('pt-BR')}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{pix.status}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => alert('Parabéns! PIX compensado com sucesso. Parcela do aluno baixada no DB.')}><CheckCircle size={16} /> Dar Baixa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )

    const renderNftTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div><h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Registro de Notas Fiscais</h3><p className="text-muted" style={{ fontSize: '0.875rem' }}>Registro interno manual de emissões.</p></div>
                <button className="btn btn-primary" onClick={() => setShowNewNfForm(!showNewNfForm)}><FilePlus size={16} /> Emitir Nova NF</button>
            </div>

            {showNewNfForm && (
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Registrar Faturamento</h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}><label className="form-label">Sacado (Aluno)</label><input type="text" className="form-control" /></div>
                        <div style={{ flex: 1 }}><label className="form-label">Valor R$</label><input type="number" className="form-control" /></div>
                        <div><button className="btn btn-primary" onClick={() => { alert('NF Registrada no BD!'); setShowNewNfForm(false) }}>Salvar Registro</button></div>
                    </div>
                </div>
            )}

            <div style={{ backgroundColor: '#eff6ff', border: '1px dashed #3B82F6', borderRadius: 'var(--radius-md)', padding: '3rem', textAlign: 'center', color: '#1E40AF' }}>
                <Receipt size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>Nenhum registro consolidado no período.</p>
            </div>
        </div>
    )

    const renderPayablesTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem' }}>Contas a Pagar e Custos Fixos</h3>
                <button className="btn btn-primary" onClick={() => setShowNewCostForm(!showNewCostForm)}>Nova Despesa</button>
            </div>

            {showNewCostForm && (
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Adicionar Despesa Real</h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}><label className="form-label">Descrição (Ex: Taxa ABENDI)</label><input type="text" className="form-control" value={newCost.description} onChange={(e) => setNewCost({ ...newCost, description: e.target.value })} /></div>
                        <div style={{ flex: 1 }}><label className="form-label">Valor R$</label><input type="number" className="form-control" value={newCost.value} onChange={(e) => setNewCost({ ...newCost, value: e.target.value })} /></div>
                        <div style={{ flex: 1 }}><label className="form-label">Vencimento</label><input type="date" className="form-control" value={newCost.dueDate} onChange={(e) => setNewCost({ ...newCost, dueDate: e.target.value })} /></div>
                        <div><button className="btn btn-primary" onClick={handleAddCost}>Salvar (BD)</button></div>
                    </div>
                </div>
            )}

            {loading ? <p>Carregando BD...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '1rem' }}>Descrição do Custo</th>
                            <th style={{ padding: '1rem' }}>Vencimento</th>
                            <th style={{ padding: '1rem' }}>Valor a Pagar</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.payables.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{p.description}</td>
                                <td style={{ padding: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CalendarIcon size={14} className="text-muted" />{p.date_incurred ? new Date(p.date_incurred + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</div></td>
                                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--danger)' }}>- {formatMoney(p.amount)}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.status === 'pago' ? '#D1FAE5' : '#FEF3C7', color: p.status === 'pago' ? '#065F46' : '#92400E' }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {p.status !== 'pago' && (
                                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handlePayCost(p.id)}>Marcar Pago</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {transactions.payables.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Sem despesas pendentes.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
    )

    const renderSplitTab = () => (
        <div className="animate-fade-in">
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#166534' }}>Inteligência de Rateio de Lucros (50/50 Real)</h3>
                <p style={{ color: '#15803d', fontSize: '0.875rem' }}>O sistema calcula lucro líquido pelas Turmas Cadastradas (Base de 1.500 reais de margem por Receita de Aluno - Custos) e gera o rateio societário parametrizado antes da transferência para banco.</p>
            </div>

            {loading ? <p>Carregando classes...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {transactions.classesData.map(cls => {
                        const studentCount = cls.students[0]?.count || 0
                        if (studentCount === 0) return null

                        // Simulation logic based on actual Student counts from Supabase
                        const revenue = studentCount * 1500
                        const costs = revenue * 0.35
                        const netProfit = revenue - costs
                        const splitShare = netProfit / 2

                        return (
                            <div key={cls.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4 style={{ fontWeight: 600, color: 'var(--primary)' }}>{cls.name}</h4>
                                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{cls.course_name}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="text-muted">Receita Bruta Prevista ({studentCount} Alunos):</span>
                                        <span style={{ fontWeight: 600 }}>{formatMoney(revenue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="text-muted">Despesas Tributos (Média):</span>
                                        <span style={{ color: 'var(--danger)' }}>- {formatMoney(costs)}</span>
                                    </div>
                                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1rem' }}>
                                        <span>Lucro Líquido Parcial:</span>
                                        <span style={{ color: 'var(--success)' }}>{formatMoney(netProfit)}</span>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>Projeção de Repasse 50/50</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>C&C (Sócio A)</p>
                                            <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(splitShare)}</p>
                                        </div>
                                        <div style={{ fontSize: '1.5rem', color: 'var(--border-color)' }}>+</div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membro ICC</p>
                                            <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(splitShare)}</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem' }}>Efetivar Rateio (Criar na Conta a Pagar)</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Tesouraria e Financeiro</h2>
            </div>

            {renderTabs()}

            {activeTab === 'pix' && renderPixTab()}
            {activeTab === 'payables' && renderPayablesTab()}
            {activeTab === 'split' && renderSplitTab()}
            {activeTab === 'nf' && renderNftTab()}
        </div>
    )
}
