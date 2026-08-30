const BUCKET = 'saba-ganim-arava.firebasestorage.app';

function allowedTarget(target) {
  try {
    const u = new URL(target);
    if (u.protocol !== 'https:') return false;
    if (u.hostname === 'firebasestorage.googleapis.com') {
      return u.pathname.includes(`/v0/b/${BUCKET}/o/`);
    }
    if (u.hostname === 'storage.googleapis.com') {
      return u.pathname.includes(`/${BUCKET}/`);
    }
    return false;
  } catch (_) {
    return false;
  }
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
        'Access-Control-Allow-Headers': 'Range,Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get('url');
  if (!target || !allowedTarget(target)) {
    return new Response('Invalid Firebase media URL', { status: 400 });
  }

  const forwardHeaders = new Headers();
  const range = request.headers.get('range');
  if (range) forwardHeaders.set('Range', range);

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: forwardHeaders,
      redirect: 'follow'
    });
  } catch (err) {
    return new Response(`Firebase media fetch failed: ${err?.message || err}`, { status: 502 });
  }

  const headers = new Headers();
  for (const name of ['content-type','content-length','content-range','accept-ranges','etag','last-modified','cache-control']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/octet-stream');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  headers.set('Cache-Control', headers.get('cache-control') || 'private, max-age=300');

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
};
