import React, { useState } from 'react';
import { Clock, Monitor, ChevronRight, Plus, Trash2, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEdit } from '../../context/EditContext';
import EditableText from './EditableText';
import EditableSlot from './EditableSlot';
import DraggableInEdit from './DraggableInEdit';

const Courses = () => {
  const { content, isEditing, addItemToList, removeItemFromList } = useEdit();
  const { courses_section } = content;
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleAddCourse = () => {
    const newCourse = {
      title: "Novo Treinamento",
      description: "Descrição do novo treinamento teórico ou prático.",
      duration: "00 Horas",
      type: "Presencial/Híbrido",
      category: "NOVO",
      image: "https://images.unsplash.com/photo-1504384308090-c89eececbf8e?q=80&w=2000&auto=format&fit=crop",
      whatsapp_link: "https://chat.whatsapp.com/Exemplo"
    };
    addItemToList('courses_section.courses', newCourse);
  };

  const handleOpenDetails = (course) => {
    setSelectedCourse(course);
  };

  const closeModal = () => {
    setSelectedCourse(null);
  };

  return (
    <section className="courses-section section-padding bg-soft" id="cursos">
      <div className="container">
        <div className="section-header">
          <div className="header-with-actions">
            <div>
              <h2 className="section-title">
                <EditableText path="courses_section.title" initialValue={courses_section.title} tagName="div" />
              </h2>
              <div className="section-subtitle">
                <EditableText path="courses_section.subtitle" initialValue={courses_section.subtitle} tagName="p" />
              </div>
            </div>
            {isEditing && (
              <button className="btn-add-course" onClick={handleAddCourse}>
                <Plus size={20} /> Adicionar Curso
              </button>
            )}
          </div>
        </div>

        <div className="courses-grid">
          <AnimatePresence>
            {courses_section.courses.map((course, index) => (
              <motion.div
                key={course.id || index}
                className="course-card"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card-image-box">
                  {isEditing && (
                    <button
                      className="btn-remove-course"
                      onClick={() => removeItemFromList('courses_section.courses', index)}
                      title="Excluir este curso"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <DraggableInEdit
                    path={`courses_section.courses.${index}.badge_pos`}
                    initialPos={{ top: '12px', left: '12px' }}
                  >
                    <span className="card-badge">
                      <EditableText path={`courses_section.courses.${index}.category`} initialValue={course.category} />
                    </span>
                  </DraggableInEdit>

                  {/* Imagem editável por curso */}
                  <EditableSlot
                    path={`courses_section.courses.${index}.image`}
                    initialValue={course.image || `https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=2000&auto=format&fit=crop`}
                    className="card-img"
                    tagName="div"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div className="card-content">
                  <h3 className="card-title">
                    <EditableText path={`courses_section.courses.${index}.title`} initialValue={course.title} tagName="div" />
                  </h3>
                  <div className="card-desc">
                    <EditableText path={`courses_section.courses.${index}.description`} initialValue={course.description} tagName="p" />
                  </div>

                  <div className="card-meta">
                    <div className="meta-item">
                      <Clock size={16} />
                      <EditableText path={`courses_section.courses.${index}.duration`} initialValue={course.duration} />
                    </div>
                    <div className="meta-item">
                      <Monitor size={16} />
                      <EditableText path={`courses_section.courses.${index}.type`} initialValue={course.type} />
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="btn-site-primary btn-sm">Matrícula</button>
                    <button className="btn-text" onClick={() => handleOpenDetails(course)}>Detalhes <ChevronRight size={16} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Detalhes do Curso com WhatsApp */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="course-modal"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
              
              <div className="modal-header">
                <h3>{selectedCourse.title}</h3>
                <span className="modal-badge">{selectedCourse.category}</span>
              </div>
              
              <div className="modal-body">
                <p className="modal-desc">{selectedCourse.description}</p>
                
                <div className="modal-whatsapp-section">
                  <div className="whatsapp-icon-bg">
                    <MessageCircle size={32} color="#25D366" />
                  </div>
                  <h4>Grupo Exclusivo do Curso</h4>
                  <p>Acesse nosso grupo do WhatsApp para receber materiais, tirar dúvidas e fazer sua pré-matrícula com condições especiais.</p>
                  
                  <div className="qr-code-box">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedCourse.whatsapp_link || 'https://chat.whatsapp.com/')}`} 
                      alt="QR Code WhatsApp" 
                    />
                    <small>Escaneie o QR Code ou clique no botão abaixo</small>
                  </div>

                  <a 
                    href={selectedCourse.whatsapp_link || 'https://chat.whatsapp.com/'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-whatsapp"
                  >
                    Entrar no Grupo
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .header-with-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 2rem;
          margin-bottom: 4rem;
        }
        .section-title { font-size: 2.5rem; margin-bottom: 1rem; }
        .btn-add-course {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 10px 15px -3px rgba(0, 75, 73, 0.2);
          transition: all 0.3s;
        }
        .btn-add-course:hover { transform: translateY(-2px); }
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }
        .course-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          transition: var(--transition);
        }
        .course-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .card-image-box { position: relative; height: 200px; overflow: hidden; }
        .btn-remove-course {
          position: absolute; top: 0.75rem; right: 0.75rem;
          background: #ef4444; color: white; border: none;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 10;
        }
        .card-badge {
          position: absolute; top: 0.75rem; left: 0.75rem;
          background: var(--primary); color: white;
          padding: 0.3rem 0.6rem; border-radius: 4px;
          font-size: 0.65rem; font-weight: 700; z-index: 2;
        }
        .card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .card-content { padding: 1.5rem; }
        .card-title { font-size: 1.1rem; margin-bottom: 0.75rem; line-height: 1.4; min-height: 3rem; }
        .card-meta {
          display: flex; gap: 1rem; margin-bottom: 1.5rem;
          padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap;
        }
        .meta-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--primary); font-weight: 600; }
        .card-actions { display: flex; justify-content: space-between; align-items: center; }
        .btn-sm { padding: 0.6rem 1.25rem; font-size: 0.85rem; }
        .btn-text { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; background: transparent; border: none; }
        .btn-text:hover { color: var(--primary); }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .course-modal {
          background: white;
          border-radius: 1.5rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-close {
          position: absolute;
          top: 1rem; right: 1rem;
          background: rgba(0,0,0,0.05);
          border: none;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .modal-close:hover { background: #f1f5f9; color: #0f172a; }
        
        .modal-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .modal-header h3 {
          font-size: 1.5rem;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
          padding-right: 2rem;
        }
        .modal-badge {
          display: inline-block;
          background: #e6f1f1;
          color: var(--primary);
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        
        .modal-body {
          padding: 1.5rem 2rem 2rem;
        }
        .modal-desc {
          color: #475569;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .modal-whatsapp-section {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .whatsapp-icon-bg {
          width: 64px; height: 64px;
          background: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2);
        }
        .modal-whatsapp-section h4 {
          color: #1e293b;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }
        .modal-whatsapp-section p {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .qr-code-box {
          background: white;
          padding: 1rem;
          border-radius: 0.75rem;
          display: inline-block;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .qr-code-box img {
          width: 150px; height: 150px;
          margin-bottom: 0.5rem;
        }
        .qr-code-box small {
          display: block;
          color: #94a3b8;
          font-size: 0.75rem;
        }
        .btn-whatsapp {
          display: block;
          width: 100%;
          background: #25D366;
          color: white;
          padding: 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          text-align: center;
          transition: all 0.2s;
        }
        .btn-whatsapp:hover {
          background: #20BD5A;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }

        @media (max-width: 768px) {
          .courses-grid { grid-template-columns: 1fr; }
          .header-with-actions { flex-direction: column; align-items: flex-start; }
          .section-title { font-size: 1.8rem; }
          .modal-header, .modal-body { padding: 1.5rem; }
          .modal-whatsapp-section { padding: 1.5rem; }
        }
        @media (max-width: 480px) {
          .card-content { padding: 1rem; }
        }
      `}</style>
    </section>
  );
};

export default Courses;
