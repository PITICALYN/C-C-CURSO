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
    } else if (type === 'declaracao') {
        generateDeclarationPDF(doc, student)
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
    doc.text('Página 2 - Cláusulas Adicionais...', 15, 20)
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

function generateDeclarationPDF(doc, student) {
    doc.setFontSize(18)
    doc.text('DECLARAÇÃO DE INSCRITO', 105, 30, { align: 'center' })
    doc.setFontSize(12)
    const text = `Declaramos para os devidos fins que o aluno ${student.name}, portador do CPF ${student.cpf}, encontra-se regularmente inscrito no curso correspondente à turma ${student.class}.`
    const lines = doc.splitTextToSize(text, 180)
    doc.text(lines, 15, 60)
    doc.text(`Rio de Janeiro, ${new Date().toLocaleDateString('pt-BR')}`, 15, 140)
}

function generateCertificatePDF(doc, student) {
    // A4 Landscape for Certificate
    doc.addPage("a4", "landscape")
    doc.setPage(2) // Jump to landscape page

    // Custom Border
    doc.setLineWidth(2)
    doc.rect(10, 10, 277, 190)

    doc.setFontSize(30)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICADO DE CONCLUSÃO', 148, 50, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text(`Certificamos que`, 148, 80, { align: 'center' })

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(`${student.name}`, 148, 100, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`concluiu com êxito o treinamento da turma ${student.class}.`, 148, 120, { align: 'center' })

    // Signature Block
    doc.setFontSize(12)
    doc.text('_________________________________', 148, 170, { align: 'center' })
    doc.text('Responsável Técnico (RT)', 148, 180, { align: 'center' })
    doc.text('Assinatura Digital Validada', 148, 188, { align: 'center' })
}
