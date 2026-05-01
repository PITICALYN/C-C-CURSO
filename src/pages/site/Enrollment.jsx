import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Send, Phone, User, Mail, BookOpen, CreditCard, MapPin, Hash } from 'lucide-react';
import { useEdit } from '../../context/EditContext';
import { supabase } from '../../lib/supabase';
import EditableText from '../../components/site/EditableText';
import Navbar from '../../components/site/Navbar';
import Footer from '../../components/site/Footer';
import AdminToolbar from '../../components/site/AdminToolbar';

const Enrollment = () => {
  const { content } = useEdit();
  const { courses_section } = content;
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    cep: '',
    addressNumber: '',
    course: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null); // Will hold Asaas response
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Salvar intenção de matrícula no Supabase
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          course_name: formData.course,
          status: 'pending_payment'
        }])
        .select()
        .single();

      if (error && error.code !== '42P01') { 
        // Ignore table not found error if enrollments table doesn't exist yet, 
        // as the main flow is the Webhook.
        console.error("Supabase insert error:", error);
      }

      // 2. Enviar para o Webhook do n8n para gerar cobrança no Asaas
      const webhookUrl = 'https://webhook.carvaominasrio.shop/webhook/asaas-matricula';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          enrollmentId: enrollment?.id || 'WAITING_DB',
          source: 'site_matricula'
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o servidor de pagamentos.');
      }

      const result = await response.json();
      
      // O Webhook do n8n deve retornar a URL de pagamento do Asaas (invoiceUrl) ou dados do Pix
      if (result && result.invoiceUrl) {
        setPaymentInfo(result);
      } else {
        // Fallback caso o webhook não retorne a URL diretamente (modo de teste ou erro silencioso)
        setPaymentInfo({
          success: true,
          message: "Sua solicitação foi recebida! A equipe enviará o link de pagamento em instantes via WhatsApp."
        });
      }

    } catch (err) {
      console.error('Error submitting enrollment:', err);
      // Fallback para envio manual caso o Webhook falhe
      const message = `*NOVA MATRÍCULA - CEC ENGENHARIA*%0A%0A*Nome:* ${formData.name}%0A*CPF:* ${formData.cpf}%0A*Telefone:* ${formData.phone}%0A*Curso:* ${formData.course}`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5521965554180&text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      setPaymentInfo({
        success: true,
        message: "Redirecionando para o WhatsApp para finalizar a matrícula manualmente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enroll-page-wrapper">
      <AdminToolbar />
      <Navbar />
      
      <main className="enroll-main section-padding">
        <div className="container enroll-grid">
          {/* Coluna de Texto */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="enroll-content"
          >
            <div className="badge-status">MATRÍCULAS ABERTAS 2026</div>
            <h1 className="enroll-title">Comece sua jornada de <span className="text-primary">Especialização.</span></h1>
            <p className="enroll-desc">Preencha o formulário abaixo para gerar o link de pagamento da sua matrícula. Após o pagamento, seu acesso será liberado automaticamente e enviado para o seu e-mail!</p>
            
            <div className="enroll-benefits">
              <div className="benefit-item">
                <CheckCircle size={20} className="text-secondary" />
                <span>Liberação Imediata Pós-Pagamento</span>
              </div>
              <div className="benefit-item">
                <CheckCircle size={20} className="text-secondary" />
                <span>Pagamento 100% Seguro via Asaas</span>
              </div>
              <div className="benefit-item">
                <CheckCircle size={20} className="text-secondary" />
                <span>Acesso ao Portal do Aluno com seu CPF</span>
              </div>
            </div>
          </motion.div>

          {/* Coluna do Formulário */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="enroll-form-card shadow-lg"
          >
            {!paymentInfo ? (
              <form onSubmit={handleSubmit} className="enroll-form">
                <div className="form-head">
                  <h3>Dados para Matrícula</h3>
                  <p>Informe seus dados completos para faturamento.</p>
                </div>

                <div className="input-group">
                  <label><User size={16} /> Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Como no certificado"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label><CreditCard size={16} /> CPF</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label><Phone size={16} /> WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="(00) 90000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label><Mail size={16} /> E-mail (Será seu login)</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label><MapPin size={16} /> CEP</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label><Hash size={16} /> Número Residência</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: 123"
                      value={formData.addressNumber}
                      onChange={(e) => setFormData({...formData, addressNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label><BookOpen size={16} /> Escolha a Formação</label>
                  <select 
                    required 
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                  >
                    <option value="">Selecione um curso...</option>
                    {courses_section.courses.map(course => (
                      <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', margin: 0, fontWeight: 'normal' }}>
                    <input 
                      type="checkbox" 
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                    />
                    <span style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                      Li e concordo com o <a href="/termos" target="_blank" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Manual do Aluno e Termos de Uso</a>, incluindo as políticas de cancelamento e ressarcimento.
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn-site-primary w-full btn-large" disabled={isSubmitting || !acceptedTerms}>
                  {isSubmitting ? 'Gerando Pagamento...' : 'Gerar Pagamento Seguro'}
                  <Send size={18} />
                </button>
                <div className="asaas-badge text-center mt-3">
                  <small className="text-muted">Processamento seguro por Asaas Instituição de Pagamento S.A.</small>
                </div>
              </form>
            ) : (
              <div className="success-state text-center">
                <div className="success-icon"><CheckCircle size={60} /></div>
                <h2>Matrícula Iniciada!</h2>
                
                {paymentInfo.invoiceUrl ? (
                  <div className="payment-action-box">
                    <p>Sua cobrança foi gerada com sucesso. Clique no botão abaixo para pagar via Pix, Cartão ou Boleto.</p>
                    <a href={paymentInfo.invoiceUrl} target="_blank" rel="noopener noreferrer" className="btn-site-primary btn-large w-full mt-4" style={{display: 'inline-flex', justifyContent: 'center', color: 'white'}}>
                      Pagar Matrícula Agora
                    </a>
                    <p className="mt-4 text-sm text-muted">Após o pagamento, você receberá um e-mail com seus dados de acesso ao Portal do Aluno.</p>
                  </div>
                ) : (
                  <div className="payment-action-box">
                    <p>{paymentInfo.message}</p>
                  </div>
                )}
                
                <button onClick={() => setPaymentInfo(null)} className="btn-site-outline mt-4">Fazer outra matrícula</button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .enroll-main {
          background: #fdfdfd;
          padding-top: 10rem;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        .enroll-grid {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 6rem;
          align-items: center;
        }
        .badge-status {
          background: #eef2ff;
          color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-weight: 800;
          font-size: 0.75rem;
          display: inline-block;
          margin-bottom: 2rem;
        }
        .enroll-title {
          font-size: 3.5rem;
          line-height: 1.1;
          margin-bottom: 2rem;
          font-weight: 800;
          color: var(--primary-dark);
        }
        .enroll-desc {
          font-size: 1.25rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 3rem;
        }
        .enroll-benefits {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .benefit-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          color: var(--primary-dark);
        }
        .enroll-form-card {
          background: white;
          border-radius: 2rem;
          padding: 3rem;
          border: 1px solid #f1f5f9;
        }
        .form-head {
          margin-bottom: 2.5rem;
          text-align: center;
        }
        .form-head h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--primary-dark);
        }
        .form-head p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--primary);
        }
        .input-group input, .input-group select {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          outline: none;
          transition: all 0.3s;
          background: #f8fafc;
        }
        .input-group input:focus, .input-group select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(0, 75, 73, 0.1);
          background: white;
        }
        .w-full { width: 100%; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1.5rem; }
        .text-sm { font-size: 0.875rem; }
        .btn-large {
          padding: 1rem;
          font-size: 1rem;
          justify-content: center;
        }
        .success-state {
          padding: 2rem 0;
        }
        .success-icon {
          color: #10b981;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        .success-state h2 {
          margin-bottom: 1rem;
          font-size: 1.8rem;
          color: var(--primary-dark);
        }
        .payment-action-box {
          background: #f8fafc;
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          margin-top: 2rem;
        }
        
        @media (max-width: 1100px) {
          .enroll-grid { grid-template-columns: 1fr; gap: 4rem; text-align: center; }
          .enroll-content { display: flex; flex-direction: column; align-items: center; }
          .enroll-title { font-size: 2.8rem; }
          .enroll-form-card { max-width: 600px; margin-inline: auto; width: 100%; }
        }
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .enroll-form-card { padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Enrollment;
