import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showApiError } from '@/lib/errors';

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

export function usePresignUpload() {
  return useMutation({
    mutationFn: (body) => api.post('/api/uploads/presign', body).then((r) => r.data),
    onError: (error) => showApiError(error),
  });
}

export function useConfirmUpload() {
  return useMutation({
    mutationFn: (body) => api.post('/api/uploads/confirm', body).then((r) => r.data),
    onError: (error) => showApiError(error),
  });
}

/**
 * Sube un File completo: presign → PUT al storage → confirm.
 * Devuelve un attachment listo para usar en submissions: {url, filename, size, contentType}.
 *
 * El PUT al storage NO usa el `api` (sin Authorization, sin baseURL): es un fetch
 * directo a la URL firmada que devuelve el backend.
 */
export async function uploadFile(file, context, { onProgress } = {}) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB`);
  }
  const ct = (file.type || 'application/octet-stream').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(ct)) {
    throw new Error(`Tipo de archivo no permitido: ${ct}`);
  }

  const presigned = await api
    .post('/api/uploads/presign', {
      filename: file.name,
      contentType: ct,
      size: file.size,
      context,
    })
    .then((r) => r.data);

  await putBinary(presigned.uploadUrl, file, {
    method: presigned.uploadMethod || 'PUT',
    headers: presigned.uploadHeaders || { 'Content-Type': ct },
    onProgress,
  });

  await api
    .post('/api/uploads/confirm', {
      key: presigned.key,
      filename: file.name,
      contentType: ct,
      size: file.size,
    })
    .then((r) => r.data);

  return {
    url: presigned.publicUrl,
    filename: file.name,
    size: file.size,
    contentType: ct,
  };
}

/**
 * Returns a signed read URL for a local-storage attachment.
 * If the URL already has `token` param → returned as-is.
 * If URL doesn't match the local download pattern → returned as-is.
 */
export function useSignedUrl(rawUrl, contentType = '') {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rawUrl) { setUrl(null); return; }
    let cancelled = false;

    try {
      const parsed = new URL(rawUrl, window.location.origin);
      const needsSign =
        parsed.pathname.includes('/api/uploads/download') &&
        !parsed.searchParams.get('token');

      if (!needsSign) { setUrl(rawUrl); return; }

      const key = parsed.searchParams.get('key');
      if (!key) { setUrl(rawUrl); return; }

      setLoading(true);
      const qs = new URLSearchParams({ key });
      if (contentType) qs.set('ct', contentType);
      api.get(`/api/uploads/sign?${qs.toString()}`).then(({ data }) => {
        if (!cancelled) setUrl(data.url);
      }).catch(() => {
        if (!cancelled) setUrl(rawUrl);
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    } catch {
      setUrl(rawUrl);
    }

    return () => { cancelled = true; };
  }, [rawUrl, contentType]);

  return { url, loading };
}

function putBinary(url, file, { method, headers, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    for (const [k, v] of Object.entries(headers || {})) {
      xhr.setRequestHeader(k, v);
    }
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage upload failed: ${xhr.status} ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}
