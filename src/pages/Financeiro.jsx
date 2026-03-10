import { useState } from 'react'
import { MOCK_FINANCIAL_SUMMARY, MOCK_ACCOUNTS_PAYABLE, MOCK_PIX_VERIFICATION, MOCK_CLASSES } from '../lib/mockData'
import { CheckCircle, Clock, Receipt, FilePlus, Calendar as CalendarIcon, DollarSign, Wallet, Filter } from 'lucide-react'

export default function Financeiro() {
    const [activeTab, setActiveTab] = useState('pix') // pix | nf | payables | split

    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const renderTabs = () => (
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', width: '100%', overflowX: 'auto', marginBottom: '2rem' }}>
            <button
                className={`btn ${activeTab === 'pix' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('pix')}
            >
                <Clock size={16} /> Verificação PIX Parcelado
            </button>
            <button
                className={`btn ${activeTab === 'payables' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('payables')}
            >
                <Wallet size={16} /> Contas a Pagar / Custos
            </button>
            <button
                className={`btn ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('split')}
            >
                <DollarSign size={16} /> Rateio de Lucros (50/50)
            </button>
            <button
                className={`btn ${activeTab === 'nf' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('nf')}
            >
                <Receipt size={16} /> Emissão de NFs
            </button>
        </div>
    )

    const renderPixTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem' }}>Validação de PIX Recebidos Constantes em Contrato</h3>
                <button className="btn btn-secondary">
                    <Filter size={16} /> Filtrar por Turma
                </button>
            </div>
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
                    {MOCK_PIX_VERIFICATION.map(pix => (
                        <tr key={pix.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 500 }}>{pix.student}</td>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{formatMoney(pix.amount)}</td>
                            <td style={{ padding: '1rem' }}>{new Date(pix.date).toLocaleDateString('pt-BR')}</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {pix.status}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => alert('Parabéns! PIX compensado com sucesso. Parcela do aluno baixada.')}>
                                    <CheckCircle size={16} /> Dar Baixa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    const renderNftTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Registro de Notas Fiscais</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Registro interno manual para controle de faturamento e NFs geradas no mês.</p>
                </div>
                <button className="btn btn-primary">
                    <FilePlus size={16} /> Registrar Emissão de NF
                </button>
            </div>
            <div style={{ backgroundColor: '#eff6ff', border: '1px dashed #3B82F6', borderRadius: 'var(--radius-md)', padding: '3rem', textAlign: 'center', color: '#1E40AF' }}>
                <Receipt size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>Nenhum registro de Nota Fiscal no período filtrado.</p>
            </div>
        </div>
    )

    const renderPayablesTab = () => (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem' }}>Contas a Pagar e Custos Fixos</h3>
                <button className="btn btn-primary">Nova Despesa</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '1rem' }}>Descrição do Custo</th>
                        <th style={{ padding: '1rem' }}>Vencimento</th>
                        <th style={{ padding: '1rem' }}>Valor a Pagar</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_ACCOUNTS_PAYABLE.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 500 }}>{p.description}</td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarIcon size={14} className="text-muted" />
                                    {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--danger)' }}>- {formatMoney(p.amount)}</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    backgroundColor: p.status === 'Pago' ? '#D1FAE5' : '#FEF3C7',
                                    color: p.status === 'Pago' ? '#065F46' : '#92400E'
                                }}>
                                    {p.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    const renderSplitTab = () => (
        <div className="animate-fade-in">
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#166534' }}>Inteligência de Rateio de Lucros (50/50)</h3>
                <p style={{ color: '#15803d', fontSize: '0.875rem' }}>O sistema calcula automaticamente o lucro líquido por Turma (Receita de Pagamentos - Custos Alocados) e simula o rateio societário parametrizado antes da transferência para as partes.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {MOCK_CLASSES.map(cls => {
                    // Fake calculation for demonstration
                    const revenue = cls.studentsCount * 1300 // R$1.3k per student on avg
                    const costs = revenue * 0.35 // Fake 35% costs
                    const netProfit = revenue - costs
                    const splitShare = netProfit / 2

                    return (
                        <div key={cls.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 600, color: 'var(--primary)' }}>{cls.name}</h4>
                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{cls.course}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-muted">Receita Bruta (Apuração):</span>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(revenue)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-muted">Despesas e Tributos:</span>
                                    <span style={{ color: 'var(--danger)' }}>- {formatMoney(costs)}</span>
                                </div>
                                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1rem' }}>
                                    <span>Lucro Líquido Realizado:</span>
                                    <span style={{ color: 'var(--success)' }}>{formatMoney(netProfit)}</span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>Projeção de Repasse 50/50</p>
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membro A</p>
                                        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(splitShare)}</p>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', color: 'var(--border-color)' }}>+</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membro B</p>
                                        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(splitShare)}</p>
                                    </div>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem' }}>Efetivar Rateio na Conta a Pagar</button>
                            </div>
                        </div>
                    )
                })}
            </div>
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
