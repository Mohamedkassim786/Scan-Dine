/**
 * Helper to resolve and format image URLs across Localhost, LAN IP, and Production APIs.
 * Automatically rewrites localhost/127.0.0.1 URLs to the client's active LAN IP (e.g. 192.168.1.4:3001)
 * so uploaded food images render on mobile phones over Wi-Fi.
 */
export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';
  }

  let trimmed = url.trim();
  const currentHost = window.location.hostname || 'localhost';

  // If it's a full http/https URL containing localhost or 127.0.0.1
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      trimmed = trimmed
        .replace('localhost:3001', `${currentHost}:3001`)
        .replace('127.0.0.1:3001', `${currentHost}:3001`)
        .replace('localhost', currentHost)
        .replace('127.0.0.1', currentHost);
    }
    return trimmed;
  }

  // Prepend current active host for relative paths like /uploads/img_xxx.jpg
  const apiBaseHost = `http://${currentHost}:3001`;
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBaseHost}${cleanPath}`;
};
