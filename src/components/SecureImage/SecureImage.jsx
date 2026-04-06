import React, { useState, useEffect } from 'react';
import placeholderImg from '../../assets/placeholder.png';

const SecureImage = ({ src, alt, className }) => {
  const [imageUrl, setImageUrl] = useState(null);

useEffect(() => {
  if (!src) return setImageUrl(placeholderImg);

  let objectUrl;
  let active = true;

  fetch(src, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'X-User-Id': localStorage.getItem('userId')
    }
  })
    .then(res => res.blob())
    .then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    })
    .catch(() => {
      if (active) setImageUrl(placeholderImg);
    });

  return () => {
    active = false;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [src]);

return <img src={imageUrl || placeholderImg} alt={alt} className={className} />;
};

export default SecureImage;