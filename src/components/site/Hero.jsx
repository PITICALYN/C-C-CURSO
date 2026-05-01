import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEdit } from '../../context/EditContext';
import EditableText from './EditableText';
import EditableSlot from './EditableSlot';
import DraggableInEdit from './DraggableInEdit';

const Hero = () => {
  const { content } = useEdit();
  const { hero } = content;

  return (
    <section className="hero-section container" id="home">
      <div className="hero-grid">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <EditableText 
            path="hero.badge" 
            initialValue={hero.badge} 
            className="badge" 
          />
          
          <h1 className="hero-title">
            <EditableText 
              path="hero.title" 
              initialValue={hero.title} 
              tagName="div"
              style={{ whiteSpace: 'pre-line' }}
            />
          </h1>

          <EditableText 
            path="hero.description" 
            initialValue={hero.description} 
            tagName="p"
            className="hero-description" 
          />

          <div className="hero-btns">
            <button className="btn-primary">
              <EditableText 
                path="hero.cta" 
                initialValue={hero.cta} 
              />
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="hero-features">
            {hero.features.map((feature, index) => (
              <div key={index} className="feature-item">
                <CheckCircle size={20} className="text-secondary" />
                <EditableText 
                  path={`hero.features.${index}`} 
                  initialValue={feature} 
                />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="hero-media"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="media-wrapper">
            <div className="glow-ring"></div>
            <EditableSlot 
              path="hero.image" 
              initialValue={hero.image} 
              className="hero-img" 
              tagName="div"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '1.5rem',
                overflow: 'hidden'
              }}
            />
            <div className="floating-card">
              <CheckCircle className="icon-success" />
              <div>
                <EditableText 
                  path="hero.cert_card.title" 
                  initialValue={hero.cert_card.title} 
                  tagName="h4" 
                />
                <EditableText 
                  path="hero.cert_card.text" 
                  initialValue={hero.cert_card.text} 
                  tagName="p" 
                />
              </div>
            </div>

            {/* Selo Abendi - Arrastável no modo edição */}
            <DraggableInEdit
              path="hero.cert_badge_pos"
              initialPos={{ top: '20px', left: '60%' }}
            >
              <div className="cert-badge-floating">
                <EditableSlot
                  path="hero.cert_badge"
                  initialValue={hero.cert_badge}
                  className="cert-badge-img"
                  tagName="span"
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    textAlign: 'center',
                    display: 'block'
                  }}
                />
              </div>
            </DraggableInEdit>
          </div>
        </motion.div>
      </div>

      <style>{`
        .hero-section {
          padding-top: 5rem;
          padding-bottom: 5rem;
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 4rem;
          align-items: center;
        }
        :global(.badge) {
          background: #e6f1f1;
          color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 1px;
          margin-bottom: 2rem;
          display: inline-block;
        }
        .hero-title {
          font-size: 4.5rem;
          line-height: 1.1;
          margin-bottom: 2rem;
          color: var(--primary-dark);
          font-weight: 800;
        }
        :global(.hero-description) {
          font-size: 1.25rem;
          color: var(--text-muted);
          max-width: 500px;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }
        .hero-features {
          display: flex;
          gap: 2rem;
          margin-top: 3rem;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--primary);
        }
        .hero-media {
          position: relative;
        }
        .media-wrapper {
          position: relative;
          z-index: 1;
        }
        .glow-ring {
          position: absolute;
          inset: -20px;
          border: 1px solid rgba(0, 75, 73, 0.2);
          border-radius: 50%;
          z-index: -1;
          animation: pulse 4s infinite;
        }
        :global(.hero-img) {
          width: 100%;
          height: auto;
          aspect-ratio: 4/5;
          max-height: 650px;
          border-radius: 1.5rem;
          box-shadow: var(--shadow-lg);
          object-fit: cover;
          display: block;
        }
        .floating-card {
          position: absolute;
          bottom: 15px;
          left: -30px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          display: flex;
          gap: 0.85rem;
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
          border: 1px solid rgba(255, 255, 255, 0.4);
          max-width: 260px;
          z-index: 10;
        }
        .cert-badge-floating {
          position: absolute;
          top: 25px;
          right: 25px;
          width: 120px;
          background: rgba(255, 255, 255, 0.8);
          padding: 0.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          z-index: 10;
          transition: transform 0.3s ease;
        }
        .cert-badge-floating:hover {
          transform: scale(1.05);
        }
        .icon-success {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
          width: 18px;
        }
        .floating-card h4 {
          font-size: 0.75rem;
          font-weight: 800;
          margin-bottom: 0.2rem;
          color: var(--primary-dark);
          text-transform: uppercase;
        }
        .floating-card p {
          font-size: 0.65rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        :global(.cert-badge-img) {
          width: 100%;
          height: auto;
          border-radius: 4px;
          mix-blend-mode: multiply; /* Mescla com fundo branco do selo */
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        @media (max-width: 1100px) {
          .hero-title { font-size: 3.5rem; }
          .hero-grid { gap: 2rem; }
          .floating-card { left: -20px; max-width: 280px; }
        }

        @media (max-width: 992px) {
          .hero-section { padding-top: 8rem; }
          .hero-grid { grid-template-columns: 1fr; gap: 4rem; text-align: center; }
          .hero-content { display: flex; flex-direction: column; align-items: center; }
          .hero-title { font-size: 3.2rem; }
          :global(.hero-description) { margin-inline: auto; }
          .hero-features { justify-content: center; }
          .hero-media { max-width: 500px; margin-inline: auto; order: -1; }
          .floating-card { bottom: -30px; left: 50%; transform: translateX(-50%); }
          .glow-ring { display: none; }
        }

        @media (max-width: 640px) {
          .hero-title { font-size: 2.5rem; }
          .hero-features { flex-direction: column; gap: 1rem; }
          .floating-card { 
            position: relative; 
            bottom: 0; 
            left: 0; 
            transform: none; 
            margin: 2rem auto 0;
            max-width: 100%;
            background: white; /* No mobile, fundo sólido é melhor para leitura */
          }
          :global(.hero-img) { height: 400px; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
