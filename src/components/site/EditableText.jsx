import React, { useRef, useEffect } from 'react';
import { useEdit } from '../../context/EditContext';

const EditableText = ({ path, initialValue, tagName: Tag = 'span', className = '' }) => {
  const { isEditing, updateContent } = useEdit();
  const elementRef = useRef(null);

  // Sincroniza o valor do elemento com o estado se não estiver editando
  useEffect(() => {
    if (elementRef.current && !isEditing) {
      elementRef.current.innerText = initialValue;
    }
  }, [initialValue, isEditing]);

  const handleBlur = () => {
    if (elementRef.current) {
      const newValue = elementRef.current.innerText;
      updateContent(path, newValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && Tag !== 'p' && Tag !== 'div') {
      e.preventDefault();
      elementRef.current.blur();
    }
  };

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      className={`${className} ${isEditing ? 'editable-active' : ''}`}
      suppressContentEditableWarning={true}
      style={{
        outline: isEditing ? '2px dashed var(--accent)' : 'none',
        padding: isEditing ? '2px 4px' : '0',
        borderRadius: isEditing ? '4px' : '0',
        backgroundColor: isEditing ? 'rgba(0, 209, 178, 0.05)' : 'transparent',
        cursor: isEditing ? 'text' : 'inherit',
        display: Tag === 'span' ? 'inline-block' : 'block'
      }}
    >
      {initialValue}
    </Tag>
  );
};

export default EditableText;
