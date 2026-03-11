import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <header className="topbar">
                    <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, border: '1px solid #f59e0b', marginBottom: '1rem', width: '100%', textAlign: 'center' }}>
                        🛠️ AMBIENTE ATUALIZADO (11/03 - 22:30) - Se você vê isso, o deploy funcionou!
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Visão Geral
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                A
                            </div>
                        </div>
                    </div>
                </header>
                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
