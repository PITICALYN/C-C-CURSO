import React from 'react';
import { Clock, Monitor, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEdit } from '../../context/EditContext';
import EditableText from './EditableText';
import EditableSlot from './EditableSlot';
import DraggableInEdit from './DraggableInEdit';

const Courses = () => {
  const { content, isEditing, addItemToList, removeItemFromList } = useEdit();
  const { courses_section } = content;

  const handleAddCourse = () => {
    const newCourse = {
      title: "Novo Treinamento",
      description: "Descrição do novo treinamento teórico ou prático.",
      duration: "00 Horas",
      type: "Presencial/Híbrido",
      category: "NOVO",
      image: "https://images.unsplash.com/photo-1504384308090-c89eececbf8e?q=80&w=2000&auto=format&fit=crop"
    };
    addItemToList('courses_section.courses', newCourse);
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
                    <button className="btn-primary btn-sm">Matrícula</button>
                    <button className="btn-text">Detalhes <ChevronRight size={16} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

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
        .btn-text { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem; }

        @media (max-width: 768px) {
          .courses-grid { grid-template-columns: 1fr; }
          .header-with-actions { flex-direction: column; align-items: flex-start; }
          .section-title { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .card-content { padding: 1rem; }
        }
      `}</style>
    </section>
  );
};

export default Courses;
