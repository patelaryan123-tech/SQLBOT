const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const encodedPath = path.split('?')[0].split('/').map((seg, i) => i === 0 ? seg : encodeURIComponent(seg)).join('/') + (path.includes('?') ? '?' + path.split('?')[1] : '');
    const options = { hostname: 'localhost', port: 5000, path: encodedPath, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function debug() {
  console.log('=== DEBUG: Injection Response ===');
  const injRes = await request('GET', '/api/db/schema/users; DROP TABLE users--');
  console.log('Status:', injRes.status);
  console.log('Body:', JSON.stringify(injRes.body, null, 2));

  console.log('\n=== DEBUG: XSS Response ===');
  const xssRes = await request('POST', '/api/chat/message', { message: '<script>alert("xss")</script>' });
  console.log('Status:', xssRes.status);
  console.log('userMessage in response:', JSON.stringify(xssRes.body?.userMessage));
  const bodyStr = JSON.stringify(xssRes.body);
  console.log('Contains <script>alert:', bodyStr.includes('<script>alert'));
  console.log('Contains <script>:', bodyStr.includes('<script>'));
  console.log('Body snippet:', bodyStr.substring(0, 300));
}

debug().catch(console.error);
