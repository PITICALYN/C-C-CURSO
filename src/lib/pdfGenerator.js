// src/lib/pdfGenerator.js
import jsPDF from 'jspdf'

export const generateDocument = (type, student) => {
    const doc = new jsPDF()

    // Global settings for ICC Docs
    doc.setFont('helvetica')

    if (type === 'contrato') {
        generateContractPDF(doc, student)
    } else if (type === 'recibo') {
        generateReceiptPDF(doc, student)
    } else if (type === 'inscrito') {
        generateDeclarationInscritoPDF(doc, student)
    } else if (type === 'termino') {
        generateDeclarationTerminoPDF(doc, student)
    } else if (type === 'matricula') {
        generateMatriculaPDF(doc, student)
    } else if (type === 'certificado') {
        generateCertificatePDF(doc, student)
    }

    doc.save(`${type}_${student.name.replace(/\s+/g, '_')}.pdf`)
}

function generateContractPDF(doc, student) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATO DE TREINAMENTO E CAPACITAÇÃO PROFISSIONAL', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const text = `
CONTRATADA: C&C ENGENHARIA E CAPACITAÇÃO.
CNPJ: 00.000.000/0000-00
Endereço: Rua Treze, nº 2, Caminho do Zepelin – Santa Cruz – Rio de Janeiro – RJ
Email: ensino@cecengenhariaecapacitacao

CONTRATANTE (ALUNO):
Nome: ${student.name}
CPF: ${student.cpf}
Turma Matriculada: ${student.class}

CLÁUSULA PRIMEIRA – DAS OBRIGAÇÕES
A CONTRATADA estabelece que o treinamento a ser ministrado está de acordo com as informações contidas no material informativo fornecido na contratação e que o material didático será entregue até a data do início das aulas.

CLÁUSULA SEGUNDA – DO PAGAMENTO E RATEIO
O ALUNO compromete-se a pagar o valor combinado na ficha de matrícula.
A modalidade PIX PARCELADO está sujeita à verificação de compensação mensal realizada pela coordenação do curso.
`

    const lines = doc.splitTextToSize(text, 180)
    doc.text(lines, 15, 35)

    // Page 2 Simulator (4 pages required by user)
    doc.addPage()
    doc.text('Página 2 - Cláusulas Adicionais do Regulamento Interno...', 15, 20)
    doc.addPage()
    doc.text('Página 3 - Regras de Retreinamento e Notas Mínimas de Aprovação...', 15, 20)
    doc.addPage()
    doc.text('Página 4 - Das Assinaturas e Foro Deliberativo...', 15, 20)

    doc.text('_________________________________', 105, 180, { align: 'center' })
    doc.text('Assinatura do Aluno Contratante', 105, 190, { align: 'center' })
}

function generateReceiptPDF(doc, student) {
    doc.setFontSize(18)
    doc.text('RECIBO DE PAGAMENTO', 105, 30, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Recebemos de ${student.name} o valor referente à parcela do curso.`, 15, 60)
    doc.text(`CPF: ${student.cpf}`, 15, 70)
    doc.text(`Assinatura da Coordenação: ___________________________`, 15, 120)
    doc.text(`Rio de Janeiro, ${new Date().toLocaleDateString('pt-BR')}`, 15, 140)
}

function generateDeclarationInscritoPDF(doc, student) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('DECLARAÇÃO DE INSCRITO', 105, 40, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const text = `Declaramos para os devidos fins que o(a) aluno(a) ${student.name}, portador(a) do CPF nº ${student.cpf}, encontra-se regularmente inscrito(a) no curso correspondente à turma ${student.class}.`
    const lines = doc.splitTextToSize(text, 170)
    doc.text(lines, 20, 70)
    doc.text(`Rio de Janeiro, ${new Date().toLocaleDateString('pt-BR')}`, 20, 140)
    doc.text('_________________________________', 105, 200, { align: 'center' })
    doc.text('Coordenação do Curso', 105, 210, { align: 'center' })
}

function generateDeclarationTerminoPDF(doc, student) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('DECLARAÇÃO DE TÉRMINO DE CURSO', 105, 40, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const text = `Declaramos para os devidos fins que o(a) aluno(a) ${student.name}, portador(a) do CPF nº ${student.cpf}, concluiu toda a carga horária estabelecida para o curso correspondente à turma ${student.class}.`
    const lines = doc.splitTextToSize(text, 170)
    doc.text(lines, 20, 70)
    doc.text(`Rio de Janeiro, ${new Date().toLocaleDateString('pt-BR')}`, 20, 140)
    doc.text('_________________________________', 105, 200, { align: 'center' })
    doc.text('C&C Engenharia e Capacitação', 105, 210, { align: 'center' })
}

function generateMatriculaPDF(doc, student) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('FICHA DE MATRÍCULA INTERNA', 105, 30, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const text = `
DADOS DO ALUNO:
Nome Completo: ${student.name}
CPF: ${student.cpf}
RG: ${student.originalData?.rg || 'Não informado'}
Naturalidade: ${student.originalData?.birth_place || 'Não informado'}
Estado Civil: ${student.originalData?.marital_status || 'Não informado'}
Escolaridade: ${student.originalData?.education_level || 'Não informado'}

CONTATO:
Telefone: ${student.originalData?.phone || 'Não informado'}
E-mail: ${student.originalData?.email || 'Não informado'}

DADOS DA TURMA E PACOTE:
Turma Selecionada: ${student.class}
Valor Base do Curso: R$ ${student.originalData?.base_value || '0.00'}
Desconto Aplicado: R$ ${student.originalData?.discount_value || '0.00'}
Manual do Aluno Entregue e Assinado: ${student.originalData?.manual_signed ? 'SIM' : 'NÃO'}
`
    const lines = doc.splitTextToSize(text, 170)
    doc.text(lines, 20, 50)
    doc.text('_________________________________', 105, 230, { align: 'center' })
    doc.text('Assinatura do Aluno', 105, 240, { align: 'center' })
}

function generateCertificatePDF(doc, student) {
    // A4 Landscape for Certificate (297 x 210 mm)
    doc.addPage("a4", "landscape")
    doc.setPage(2) // Jump to landscape page

    // Background Color or Border
    doc.setFillColor(250, 252, 255) // Ice background
    doc.rect(0, 0, 297, 210, 'F')
    doc.setDrawColor(30, 64, 175) // Primary Blue Border
    doc.setLineWidth(3)
    doc.rect(10, 10, 277, 190)

    // Try to load logo image to compose the document
    try {
        const logoUrl = '/assets/logo.png' // URL or Base64 (Assuming URL works on Vite built serve)
        // Adjust these coordinates to fit nicely at the top center
        doc.addImage(logoUrl, 'PNG', 118, 15, 60, 25)
    } catch (e) {
        console.warn("Logo não foi carregada no PDF. Imprimindo sem Logo.")
    }

    // Atestado x Certificado (Grade Rules)
    const isReprovado = student.originalData?.academic_records?.length > 0 && student.originalData.academic_records[0].final_status === 'REPROVADO'
    const title = isReprovado ? 'ATESTADO DE PARTICIPAÇÃO' : 'CERTIFICADO DE EXCELÊNCIA TÉCNICA'
    const verb = isReprovado ? 'participou do' : 'concluiu com excelente aproveitamento o'

    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 148, 50, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('Certificamos que o(a) aluno(a)', 148, 80, { align: 'center' })

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(`${student.name}`, 148, 100, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`${verb} treinamento correspondente à ${student.class}.`, 148, 120, { align: 'center' })

    // Assinaturas e Carimbos
    doc.setFontSize(12)
    doc.text('_________________________________', 148, 170, { align: 'center' })
    doc.text('Diretoria e Coordenação C&C', 148, 178, { align: 'center' })
    if (!isReprovado) {
        doc.text('Assinatura Digital de Responsabilidade Técnica (RT)', 148, 186, { align: 'center' })
    }
}
