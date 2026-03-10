import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        pendingPix: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0
    })
    const [payables, setPayables] = useState([])
    const [pixList, setPixList] = useState([]) // Mock temporary list

    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            // Fetch Payables
            const { data: costsData } = await supabase.from('financial_costs').select('*').order('date_incurred', { ascending: true })
            const activePayables = costsData || []

            // Calculate Total Costs from payables
            const totalCosts = activePayables.reduce((acc, curr) => acc + Number(curr.amount), 0)

            // Calculate Approximate Total Revenue from Students
            const { count } = await supabase.from('students').select('*', { count: 'exact', head: true })
            const totalRevenue = (count || 0) * 1500 // Ex: 1500 per student avg

            setMetrics({
                pendingPix: 2, // Mock notification
                pendingInvoices: 0,
                totalRevenue,
                totalCosts,
                netProfit: totalRevenue - totalCosts
            })

            // Filter payables to only show upcoming / pending in dashboard list
            const pendingCosts = activePayables.filter(p => p.status !== 'pago').slice(0, 5)
            setPayables(pendingCosts)

            setPixList([
                { id: 1, student: 'João Guilherme Silva', amount: 1500, date: '2026-10-10' },
                { id: 2, student: 'Maria Oliveira Gomes', amount: 1500, date: '2026-10-15' }
            ])

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    return (
        <div className="animate-fade-in">
            {/* Top Banner Alerts */}
            {(metrics.pendingPix > 0 || metrics.pendingInvoices > 0) && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {metrics.pendingPix > 0 && (
                        <div style={{ flex: 1, backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400E' }}>
                            <AlertCircle size={24} />
                            <div>
                                <strong>Atenção:</strong> Há {metrics.pendingPix} pagamentos de PIX Parcelado aguardando checagem na conta.
                            </div>
                        </div>
                    )}
                    {metrics.pendingInvoices > 0 && (
                        <div style={{ flex: 1, backgroundColor: '#DBEAFE', border: '1px solid #3B82F6', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1E40AF' }}>
                            <AlertCircle size={24} />
                            <div>
                                <strong>Notas Fiscais:</strong> {metrics.pendingInvoices} notas pendentes de emissão.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 className="text-secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Lucro Líquido Parcial (Real + Previsto)
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>
                        {formatMoney(metrics.netProfit)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span>Receita Bruta: {formatMoney(metrics.totalRevenue)}</span>
                        <span style={{ color: 'var(--danger)' }}>Custos Locais: {formatMoney(metrics.totalCosts)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Contas a Pagar / Rateio */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Contas a Pagar (Próximas)</h3>
                    </div>
                    {loading ? <p className="text-muted">Carregando...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {payables.map(conta => (
                                <div key={conta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{conta.description}</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Vence em: {conta.date_incurred ? new Date(conta.date_incurred + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>- {formatMoney(conta.amount)}</p>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                            PENDENTE
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {payables.length === 0 && <p className="text-muted" style={{ textAlign: 'center' }}>Nenhuma despesa pendente registrada.</p>}
                        </div>
                    )}
                </div>

                {/* PIX Verification */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Verificação de PIX Parcelado</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pixList.map(pix => (
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
                    </div>
                </div>
            </div>
        </div>
    )
}
