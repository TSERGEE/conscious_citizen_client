// SecureImage.jsx
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api'; // путь к api.js
import placeholderImg from '../../assets/placeholder.png';

const SecureImage = ({ src, alt, className }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!src) {
      setImageUrl(placeholderImg);
      return;
    }

    let objectUrl = null;
    let isActive = true;

    const loadImage = async () => {
      try {
        const response = await fetchWithAuth(src, {
          headers: { Accept: 'image/*' }
        });
        const blob = await response.blob();
        if (!isActive) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        console.error('Ошибка загрузки защищённого изображения:', err);
        if (isActive) setImageUrl(placeholderImg);
      }
    };

    loadImage();

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return <img src={imageUrl || placeholderImg} alt={alt} className={className} />;
};

export default SecureImage;