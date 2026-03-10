import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle, Clock, Trophy, TrendingUp, Users } from 'lucide-react'

export default function Dashboard() {
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState(null)
    const [metrics, setMetrics] = useState({
        pendingPix: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0
    })
    const [payables, setPayables] = useState([])
    const [pixList, setPixList] = useState([]) // Mock temporary list

    // Rankings & Analytics
    const [courseRanking, setCourseRanking] = useState({ month: [], year: [] })
    const [monthlySales, setMonthlySales] = useState([])
    const [classOccupancy, setClassOccupancy] = useState([])

    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            // Auth Check
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
                if (profile) setUserRole(profile.role)
            }

            // Fetch Payables
            const { data: costsData } = await supabase.from('financial_costs').select('*').order('date_incurred', { ascending: true })
            const activePayables = costsData || []

            // Analytics Extraction (Students & Classes)
            const { data: studentsData } = await supabase.from('students').select('created_at, turma_id, classes(name, course_name)')

            if (studentsData) {
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()

                // Courses Rankings
                let monthCourses = {}
                let yearCourses = {}
                let salesByMonth = {} // Month string -> count

                // Occupancy
                let classCounts = {} // turma_name -> count

                studentsData.forEach(st => {
                    if (!st.classes) return;
                    const cName = st.classes.course_name
                    const tName = st.classes.name
                    const stDate = new Date(st.created_at)

                    // Track By Course Name
                    if (stDate.getFullYear() === currentYear) {
                        yearCourses[cName] = (yearCourses[cName] || 0) + 1

                        if (stDate.getMonth() === currentMonth) {
                            monthCourses[cName] = (monthCourses[cName] || 0) + 1
                        }

                        // Track By Month (Jan, Fev, Mar...)
                        const monthLabel = stDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()
                        salesByMonth[monthLabel] = (salesByMonth[monthLabel] || 0) + 1
                    }

                    // Track Occupancy by Class
                    classCounts[tName] = (classCounts[tName] || 0) + 1
                })

                // Sort Arrays
                const sortObject = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))

                setCourseRanking({
                    month: sortObject(monthCourses),
                    year: sortObject(yearCourses).slice(0, 5) // Top 5 Anual
                })

                setMonthlySales(sortObject(salesByMonth))
                setClassOccupancy(sortObject(classCounts).slice(0, 5)) // Top 5 turmas mais cheias
            }

            // Calculate Approximate Total Revenue from Students
            const totalRevenue = (studentsData?.length || 0) * 1500 // Ex: 1500 per student avg

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
                        <span>Receita Bruta Estimada: {formatMoney(metrics.totalRevenue)}</span>
                        <span style={{ color: 'var(--danger)' }}>Custos Lançados: {formatMoney(metrics.totalCosts)}</span>
                    </div>
                </div>
            </div>

            {/* Painel Estratégico de BI (Admin e Coordenador Somente) */}
            {(userRole === 'admin' || userRole === 'coordenador') && !loading && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} /> Inteligência de Negócios e Vendas
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                        {/* Cursos Campeões de Venda */}
                        <div className="card" style={{ backgroundColor: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={18} className="text-warning" /> Top Cursos Mais Vendidos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Neste Mês</h4>
                                    {courseRanking.month.length > 0 ? courseRanking.month.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{i + 1}. {c.name}</span>
                                            <strong style={{ color: 'var(--primary)' }}>{c.count} matrículas</strong>
                                        </div>
                                    )) : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhuma venda este mês.</span>}
                                </div>
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>No Ano (Top 5)</h4>
                                    {courseRanking.year.length > 0 ? courseRanking.year.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{i + 1}. {c.name}</span>
                                            <strong style={{ color: 'var(--success)' }}>{c.count} matrículas</strong>
                                        </div>
                                    )) : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sem registros.</span>}
                                </div>
                            </div>
                        </div>

                        {/* Histórico Mensal */}
                        <div className="card" style={{ backgroundColor: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} className="text-primary" /> Meses Mais Fartos (Volume)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {monthlySales.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                                        <div style={{ width: '40px', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.name}</div>
                                        <div style={{ flex: 1, backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min((m.count / Math.max(...monthlySales.map(x => x.count))) * 100, 100)}%`, backgroundColor: 'var(--primary)', height: '100%' }}></div>
                                        </div>
                                        <div style={{ width: '80px', textAlign: 'right', fontWeight: 600 }}>{m.count} alunos</div>
                                    </div>
                                ))}
                                {monthlySales.length === 0 && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>O ano ainda não possui métricas fechadas.</span>}
                            </div>
                        </div>

                        {/* Taxa de Lotação */}
                        <div className="card" style={{ backgroundColor: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={18} className="text-success" /> Lotação por Turma (Top 5)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {classOccupancy.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                        <span style={{ fontWeight: 500 }}>{t.name}</span>
                                        <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem' }}>{t.count} Cadeiras Cheias</span>
                                    </div>
                                ))}
                                {classOccupancy.length === 0 && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhuma turma em aberto encontrada.</span>}
                            </div>
                        </div>

                    </div>
                </div>
            )}

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
