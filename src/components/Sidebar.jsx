import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, DollarSign, LogOut, BookOpen, ShieldCheck, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Sidebar() {
    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <aside className="sidebar">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/assets/logo.png" alt="C&C Engenharia Logo" style={{ maxWidth: '140px', height: 'auto', objectFit: 'contain' }} />
            </div>

            <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <NavLink
                    to="/"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/alunos"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <Users size={20} />
                    Alunos
                </NavLink>

                <NavLink
                    to="/turmas"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <GraduationCap size={20} />
                    Turmas
                </NavLink>

                <NavLink
                    to="/financeiro"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <DollarSign size={20} />
                    Financeiro
                </NavLink>

                <NavLink
                    to="/professor"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <BookOpen size={20} />
                    Portal do Instrutor
                </NavLink>

                <NavLink
                    to="/auditoria"
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        fontWeight: isActive ? '600' : '500'
                    })}
                >
                    <ShieldCheck size={20} />
                    Auditoria (Logs)
                </NavLink>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <NavLink
                        to="/equipe"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                            fontWeight: isActive ? '600' : '500'
                        })}
                    >
                        <ShieldCheck size={20} />
                        Equipe (Auth)
                    </NavLink>

                    <NavLink
                        to="/config"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)', color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                            fontWeight: isActive ? '600' : '500',
                            marginTop: '0.5rem'
                        })}
                    >
                        <Settings size={20} />
                        Modelos de Texto
                    </NavLink>
                </div>
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={handleLogout}
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
                    <LogOut size={20} />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    )
}
