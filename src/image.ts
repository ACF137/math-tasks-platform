const MAX_WIDTH = 1000;

export function readImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Нужен файл-картинка (PNG).'));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.naturalWidth) return reject(new Error('Не удалось прочитать картинку.'));
      const k = Math.min(1, MAX_WIDTH / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * k);
      canvas.height = Math.round(img.naturalHeight * k);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Не удалось обработать картинку.'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать картинку.'));
    };
    img.src = url;
  });
}
