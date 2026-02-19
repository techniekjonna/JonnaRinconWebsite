const API_BASE = 'https://api.upload-post.com/api';

export default async (request: Request) => {
  const url = new URL(request.url);
  const apiPath = url.pathname.replace('/api/upload-post', '');
  const apiUrl = `${API_BASE}${apiPath}${url.search}`;

  const apiKey = Deno.env.get('UPLOAD_POST_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ message: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers();
  headers.set('Authorization', `Apikey ${apiKey}`);

  // Forward content-type from original request (important for FormData)
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const response = await fetch(apiUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  // Forward the API response back to the client
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
};

export const config = {
  path: '/api/upload-post/*',
};
