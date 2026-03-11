import { useState, useEffect } from 'react'
import { FileText, Save, Eye, LayoutTemplate, Briefcase, UploadCloud, CheckCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import { supabase } from '../lib/supabase'

const AVAILABLE_VARIABLES = [
    { code: '{{NOME_ALUNO}}', desc: 'Nome completo do aluno' },
    { code: '{{CPF}}', desc: 'CPF formatado' },
    { code: '{{RG}}', desc: 'RG do aluno' },
    { code: '{{NOME_TURMA}}', desc: 'Nome da Turma (Ex: T1 15/12)' },
    { code: '{{NOME_CURSO}}', desc: 'Nome do Curso Matriculado' },
    { code: '{{VALOR_CURSO}}', desc: 'Valor total do curso contratado' },
    { code: '{{DATA_HOJE}}', desc: 'Data da geração do documento' },
]

const defaultContrato = `C&C ENGENHARIA e CAPACITAÇÃO.
Rua Treze, n° 2, Caminho do Zepelin – Santa Cruz – Rio de Janeiro – RJ
Fone/Fax: (21) 965554180 ensino@cecengenhariaecapacitacao

CONTRATO DE TREINAMENTO E CAPACITAÇÃO PROFISSIONAL

CONTRATANTE (ALUNO): {{NOME_ALUNO}}, Identidade RG nº {{RG}}, inscrita no CPF sob o nº {{CPF}}, cujo Curso Matriculado é: {{NOME_CURSO}} / Turma: {{NOME_TURMA}}. 

Valor Total Carga Horária e Turma: {{VALOR_CURSO}}.

CLÁUSULA PRIMEIRA – DAS OBRIGAÇÕES
A CONTRATADA estabelece que o treinamento a ser ministrado está de acordo com as informações contidas no material informativo fornecido na contratação e que o material didático será entregue até a data do início das aulas, porém, reserva-se o direito de propor alterações referentes a datas, horários ou docente(s), caso necessário.
§ 1°. O ALUNO declara estar ciente de todas as informações sobre o treinamento e submete-se aos planos de ensino e estrutura de funcionamento do mesmo.
§ 2°. O ALUNO que deixar de assistir a algum módulo não terá direito à reposição do mesmo ou à compensação do valor pago pelo referido curso, mesmo tendo sua falta justificada.
§ 3°. As faltas só serão justificadas mediante apresentação de atestado médico ou em caso de óbito familiar.
§ 4°. O ALUNO poderá solicitar o cancelamento da matrícula, devendo requerê-lo em até 10 dias antes da ocorrência da primeira aula. Neste caso, lhe será devolvido 70% do valor pago.
`

const defaultDeclaracao = `C&C ENGENHARIA e CAPACITAÇÃO.
CNPJ: 00.000.000/0000-00

DECLARAÇÃO DE INSCRITO

Declaramos para os devidos fins que o aluno {{NOME_ALUNO}}, portador do CPF {{CPF}}, encontra-se regularmente inscrito no curso {{NOME_CURSO}} correspondente à turma {{NOME_TURMA}}.

Rio de Janeiro, {{DATA_HOJE}}.`

const defaultRecibo = `RECIBO DE PAGAMENTO

Recebemos de {{NOME_ALUNO}}, inscrito no CPF {{CPF}}, a importância referente à parcela ou quitação do curso {{NOME_CURSO}} - Turma {{NOME_TURMA}}.

Valor: {{VALOR_CURSO}}

Por ser verdade, firmamos o presente.
Rio de Janeiro, {{DATA_HOJE}}
Assinatura: ___________________________`

export default function ConfigDocs() {
    const [activeDoc, setActiveDoc] = useState('contrato')
    const [templateContent, setTemplateContent] = useState(defaultContrato)
    const [userAuth, setUserAuth] = useState({ role: null, canUpload: false })
    const [manualBase64, setManualBase64] = useState('')
    const [bgImageBase64, setBgImageBase64] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingBg, setIsUploadingBg] = useState(false)

    useEffect(() => {
        const fetchConfig = async () => {
            // ... (Auth check omitted for brevity in chunking if possible, but I'll keep it)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('users').select('role, permissions').eq('id', user.id).single()
                const email = user.email?.toLowerCase() || ''
                const metadata = user.user_metadata || {}
                const isDev = email.includes('desenvolvedor') || email.includes('carlos') || metadata.role === 'admin'

                if (isDev) {
                    setUserAuth({ role: 'admin', canUpload: true })
                } else if (profile) {
                    setUserAuth({
                        role: profile.role,
                        canUpload: profile.role === 'admin' || profile.role === 'developer' || (profile.permissions && profile.permissions.upload_manual)
                    })
                } else if (metadata.role) {
                    setUserAuth({
                        role: metadata.role,
                        canUpload: metadata.role === 'admin' || (metadata.permissions && metadata.permissions.upload_manual)
                    })
                }
            }

            // Buscar Configurações
            const { data: settings } = await supabase.from('system_settings').select('key, value')
            if (settings) {
                const manual = settings.find(s => s.key === 'manual_aluno_url')
                if (manual) setManualBase64(manual.value)

                const currentBgKey = `bg_doc_${activeDoc}`
                const bg = settings.find(s => s.key === currentBgKey)
                if (bg) setBgImageBase64(bg.value)
            }
        }
        fetchConfig()
    }, [activeDoc])

    const handleTabChange = (docType) => {
        setActiveDoc(docType)
        if (docType === 'contrato') setTemplateContent(defaultContrato)
        if (docType === 'declaracao') setTemplateContent(defaultDeclaracao)
        if (docType === 'recibo') setTemplateContent(defaultRecibo)
    }

    const handleCopyVar = (code) => {
        navigator.clipboard.writeText(code)
    }

    const testPdfSimulator = () => {
        const doc = new jsPDF()
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)

        let simText = templateContent
        // Substituindo variáveis por Fakes para Teste
        simText = simText.replace(/{{NOME_ALUNO}}/g, 'João Silva de Teste')
        simText = simText.replace(/{{CPF}}/g, '123.456.789-00')
        simText = simText.replace(/{{RG}}/g, '12.345.678-9')
        simText = simText.replace(/{{NOME_TURMA}}/g, 'Simulação-T1')
        simText = simText.replace(/{{NOME_CURSO}}/g, 'Mecânica CD-CM')
        simText = simText.replace(/{{VALOR_CURSO}}/g, 'R$ 1.500,00')
        simText = simText.replace(/{{DATA_HOJE}}/g, new Date().toLocaleDateString('pt-BR'))

        const lines = doc.splitTextToSize(simText, 180)
        doc.text(lines, 15, 20)

        // Exporta abrindo em nova aba Virtual
        window.open(doc.output('bloburl'), '_blank')
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.type !== 'application/pdf') {
            alert('Apenas arquivos PDF são aceitos.')
            return
        }
        if (file.size > 2 * 1024 * 1024) { // Max 2MB base64 recommend
            alert('O arquivo PDF não pode ultrapassar 2MB.')
            return
        }

        setIsUploading(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64Data = reader.result

            const { error } = await supabase
                .from('system_settings')
                .upsert({ key: 'manual_aluno_url', value: base64Data, updated_at: new Date() }, { onConflict: 'key' })

            if (error) alert("Erro ao salvar Manual na nuvem: " + error.message)
            else {
                setManualBase64(base64Data)
                alert("Manual Atualizado com sucesso na Base de Dados global.")
            }
            setIsUploading(false)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Modelos de Documentos Oficiais</h2>
                    <p className="text-muted">Ajuste os textos padrões de Contratos e Declarações. O sistema irá preencher magicamente os locais onde houver chaves de Variáveis.</p>
                </div>
                <button className="btn btn-primary">
                    <Save size={18} /> Salvar Modelo
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Menu Lateral de Documentos */}
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Tipos de Documento</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            className={`btn ${activeDoc === 'contrato' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => handleTabChange('contrato')}
                        >
                            <Briefcase size={16} /> Contrato de Capacitação
                        </button>
                        <button
                            className={`btn ${activeDoc === 'declaracao' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => handleTabChange('declaracao')}
                        >
                            <FileText size={16} /> Declaração Padrão
                        </button>
                        <button
                            className={`btn ${activeDoc === 'recibo' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => handleTabChange('recibo')}
                        >
                            <LayoutTemplate size={16} /> Recibo Financeiro
                        </button>
                    </div>

                    {userAuth.canUpload && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Manual do Aluno</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Carregue o PDF matriz. Atendentes baixarão a versão mais atual por aqui.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', padding: '1.5rem 1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC' }}>
                                <UploadCloud size={32} color="var(--primary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <label htmlFor="manual-upload" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                                        {isUploading ? 'Transferindo...' : 'Selecionar Novo PDF'}
                                    </label>
                                    <input type="file" id="manual-upload" accept="application/pdf" style={{ display: 'none' }} disabled={isUploading} onChange={handleFileUpload} />
                                </div>
                                {/* Status do Manual */}
                                {manualBase64 ? (
                                    <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> PDF Versão Atualizada Gravado</span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Nenhum manual carregado.</span>
                                )}
                            </div>
                        </div>
                    )}

                    {userAuth.canUpload && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Papel Timbrado ({activeDoc})</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Fundo visual para este documento. Os textos serão carimbados por cima.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#F0F9FF' }}>
                                <LayoutTemplate size={32} color="var(--primary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <label htmlFor="bg-upload" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                                        {isUploadingBg ? 'Carregando...' : 'Subir Papel Timbrado'}
                                    </label>
                                    <input type="file" id="bg-upload" accept="image/png, image/jpeg" style={{ display: 'none' }} disabled={isUploadingBg} onChange={handleBgUpload} />
                                </div>
                                {bgImageBase64 ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Timbre Ativo</span>
                                        <img src={bgImageBase64} alt="Previa Timbre" style={{ width: '60px', height: '80px', objectFit: 'cover', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem fundo definido (Padrão Branco)</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor Central */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Editando Texto-Base</h3>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={testPdfSimulator}>
                            <Eye size={16} /> Simular Geração PDF
                        </button>
                    </div>

                    <textarea
                        className="form-control"
                        style={{ flex: 1, resize: 'none', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6' }}
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                    ></textarea>
                </div>

                {/* Guia de Variáveis */}
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', border: 'none' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Variáveis Automáticas</h3>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                        Clique na variável para copiar, e cole no texto ao lado. Quando você imprimir pela aba do Aluno, o sistema trocará isso pelo dado real do cliente.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {AVAILABLE_VARIABLES.map(v => (
                            <div key={v.code}
                                onClick={() => handleCopyVar(v.code)}
                                style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <code style={{ color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>{v.code}</code>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
