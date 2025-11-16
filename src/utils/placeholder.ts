/**
 * Генерирует SVG placeholder изображение локально через data URI
 *
 * @param width - ширина изображения
 * @param height - высота изображения
 * @param text - текст для отображения на placeholder
 * @param bgColor - цвет фона (по умолчанию #f0f0f0)
 * @param textColor - цвет текста (по умолчанию #999999)
 * @returns data URI строку с SVG изображением
 */
export const generatePlaceholder = (
  width: number,
  height: number,
  text: string,
  bgColor: string = '#f0f0f0',
  textColor: string = '#999999'
): string => {
  // Обрезаем текст если он слишком длинный
  const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;

  // Экранируем специальные символы для XML
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Создаём SVG как строку
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(displayText)}</text>
</svg>`;

  // Конвертируем в data URI (используем encodeURIComponent для надежности)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
