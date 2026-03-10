import { MOCK_FINANCIAL_SUMMARY, MOCK_ACCOUNTS_PAYABLE, MOCK_PIX_VERIFICATION } from '../lib/mockData'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="animate-fade-in">
            {/* Top Banner Alerts */}
            {(MOCK_FINANCIAL_SUMMARY.pendingPix > 0 || MOCK_FINANCIAL_SUMMARY.pendingInvoices > 0) && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {MOCK_FINANCIAL_SUMMARY.pendingPix > 0 && (
                        <div style={{ flex: 1, backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400E' }}>
                            <AlertCircle size={24} />
                            <div>
                                <strong>Atenção:</strong> Há {MOCK_FINANCIAL_SUMMARY.pendingPix} pagamentos de PIX Parcelado aguardando checagem na conta.
                            </div>
                        </div>
                    )}
                    {MOCK_FINANCIAL_SUMMARY.pendingInvoices > 0 && (
                        <div style={{ flex: 1, backgroundColor: '#DBEAFE', border: '1px solid #3B82F6', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1E40AF' }}>
                            <AlertCircle size={24} />
                            <div>
                                <strong>Notas Fiscais:</strong> {MOCK_FINANCIAL_SUMMARY.pendingInvoices} notas pendentes de emissão.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 className="text-secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Lucro Líquido (Real + Previsto)
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>
                        {formatMoney(MOCK_FINANCIAL_SUMMARY.netProfit)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span>Receita Bruta: {formatMoney(MOCK_FINANCIAL_SUMMARY.totalRevenue)}</span>
                        <span style={{ color: 'var(--danger)' }}>Custos: {formatMoney(MOCK_FINANCIAL_SUMMARY.totalCosts)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Contas a Pagar / Rateio */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Contas a Pagar & Rateios</h3>
                        <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Ver todas</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {MOCK_ACCOUNTS_PAYABLE.map(conta => (
                            <div key={conta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{conta.description}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Vence em: {new Date(conta.dueDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>- {formatMoney(conta.amount)}</p>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px',
                                        backgroundColor: conta.status === 'Pago' ? '#D1FAE5' : '#FEF3C7',
                                        color: conta.status === 'Pago' ? '#065F46' : '#92400E'
                                    }}>
                                        {conta.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PIX Verification */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Verificação de PIX Parcelado</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {MOCK_PIX_VERIFICATION.map(pix => (
                            <div key={pix.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{pix.student}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Data informada: {new Date(pix.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatMoney(pix.amount)}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEF3C7', color: '#92400E' }} title="Aguardando checagem">
                                            <Clock size={18} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#D1FAE5', color: '#065F46' }} title="Confirmar Recebimento">
                                            <CheckCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {MOCK_PIX_VERIFICATION.length === 0 && (
                            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Nenhum PIX aguardando verificação.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
