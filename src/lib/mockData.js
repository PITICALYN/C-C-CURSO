// src/lib/mockData.js

export const MOCK_STUDENTS = [
    { id: 1, name: 'Maxwel Lima da Costa', cpf: '111.222.333-44', status: 'Ativo', class: 'T1 15/12' },
    { id: 2, name: 'Adalberto da Silva Oliveira', cpf: '555.666.777-88', status: 'Ativo', class: 'T1 15/12' },
    { id: 3, name: 'José Daniel Rodrigues', cpf: '999.000.111-22', status: 'Inadimplente', class: 'T1 15/12' },
];

export const MOCK_CLASSES = [
    { id: 1, name: 'T1 15/12', course: 'Linguagens (Cd-to)', studentsCount: 45, profitSplit: true, startDate: '2025-12-15', predictedEndDate: '2026-06-15' },
    { id: 2, name: 'T2 20/01', course: 'Inspetor (Cd-mc)', studentsCount: 30, profitSplit: true, startDate: '2026-01-20', predictedEndDate: '2026-08-20' },
]

export const MOCK_FINANCIAL_SUMMARY = {
    totalRevenue: 45900.00,
    totalCosts: 18500.00,
    netProfit: 27400.00,
    pendingPix: 3, // Pessoas que falaram que pagaram mas precisamos verificar
    pendingInvoices: 5, // Notas fiscais a serem emitidas
}

export const MOCK_ACCOUNTS_PAYABLE = [
    { id: 1, description: 'Taxa ABENDI (Turma T1)', amount: 1500.00, dueDate: '2026-03-15', status: 'Pendente' },
    { id: 2, description: 'Professor RT (Rateio 50%)', amount: 13700.00, dueDate: '2026-03-20', status: 'Pendente' },
    { id: 3, description: 'Material Didático', amount: 850.00, dueDate: '2026-03-10', status: 'Pago' },
]

export const MOCK_PIX_VERIFICATION = [
    { id: 1, student: 'Maxwel Lima da Costa', amount: 1500.00, date: '2026-03-05', status: 'Aguardando Checagem' },
    { id: 2, student: 'Diego Goiozo Vieira', amount: 1500.00, date: '2026-03-08', status: 'Aguardando Checagem' },
]
