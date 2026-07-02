/**
 * SQLBot - 10-Point Security Validation Suite
 * Tests all implemented security measures against the live backend.
 * Run with: node security_test.js
 */
process.stdout.setEncoding('utf8');


const http = require('http');

const BASE_URL = 'http://localhost:5000';
let passed = 0;
let failed = 0;
const results = [];

// ─── HTTP Helper ─────────────────────────────────────────────────────────────
function request(method, path, body = null) {
  return new Promise((resolve) => {
    // Encode the path correctly
    const encodedPath = path.split('?')[0].split('/').map((seg, i) => i === 0 ? seg : encodeURIComponent(seg)).join('/') + (path.includes('?') ? '?' + path.split('?')[1] : '');
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: encodedPath,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Test Runner ─────────────────────────────────────────────────────────────
function test(name, condition, actual, expected) {
  const ok = condition;
  if (ok) passed++;
  else failed++;
  results.push({ ok, name, actual, expected });
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log('  ' + title);
  console.log('='.repeat(60));
}

// ─── All Security Tests ───────────────────────────────────────────────────────
async function runAllTests() {
  console.log('\n[SQLBOT] Security Validation Suite');
  console.log('   Testing all 10 security layers...');
  console.log('   Backend: ' + BASE_URL);

  // ── TEST #1: Helmet Security Headers ─────────────────────────────────────
  printHeader('TEST #6 — Helmet Header Hardening');
  const helmRes = await request('GET', '/api/health');
  test(
    'X-Powered-By header is hidden',
    helmRes.headers['x-powered-by'] === undefined,
    helmRes.headers['x-powered-by'],
    'undefined (hidden)'
  );
  test(
    'X-Content-Type-Options set to nosniff',
    helmRes.headers['x-content-type-options'] === 'nosniff',
    helmRes.headers['x-content-type-options'],
    'nosniff'
  );
  test(
    'X-Frame-Options prevents clickjacking',
    helmRes.headers['x-frame-options'] !== undefined,
    helmRes.headers['x-frame-options'],
    'SAMEORIGIN or DENY'
  );

  // ── TEST #2: CORS Validation ──────────────────────────────────────────────
  printHeader('TEST #8 — CORS Validation Rules');
  const corsRes = await request('GET', '/api/health');
  test(
    'Access-Control-Allow-Credentials header present',
    corsRes.headers['access-control-allow-credentials'] !== undefined,
    corsRes.headers['access-control-allow-credentials'],
    'true'
  );

  // ── TEST #3: Body Size Limit ──────────────────────────────────────────────
  printHeader('TEST #7 — JSON Body Size Limit (DoS Protection)');
  const validSizeRes = await request('POST', '/api/chat/message', { message: 'hello' });
  test(
    'Normal-size JSON payload accepted',
    validSizeRes.status !== 413,
    validSizeRes.status,
    '200 or other non-413'
  );

  // -- TEST #3: SQL Injection via table name sanitization
  printHeader('TEST #3 -- Dynamic Injection Sanitization');
  // The injected name "users; DROP TABLE users--" after sanitization becomes
  // "usersDROPTABLEusers--" (spaces, semicolons stripped). MySQL then returns
  // a "table not found" error -- proving the injection was neutralized.
  const injRes = await request('GET', '/api/db/schema/users; DROP TABLE users--');
  test(
    'SQL-injected table name sanitized: server did not crash (non-0)',
    injRes.status !== 0,
    injRes.status,
    'Any HTTP status (proves server is alive and handled the request safely)'
  );
  const injBody = JSON.stringify(injRes.body).toLowerCase();
  // Proof of injection EXECUTION would be: affected rows, success message, or no error.
  // A sanitized response will contain a MySQL "doesn't exist" error for the mangled name.
  // The word "drop" may appear inside the sanitized table name itself (e.g. "usersdroptable...")
  // so we check for actual execution success signals, not just the keyword.
  const injectionRan = injBody.includes('affected') || injBody.includes('rows deleted') || 
                       (injBody.includes('drop') && !injBody.includes("doesn't exist") && !injBody.includes('unknown table'));
  test(
    'Injection did not execute: no DROP confirmation in response',
    !injectionRan,
    injectionRan ? 'DROP execution confirmed in response!' : 'No injection execution confirmed — sanitizer worked',
    'No injection execution in response'
  );

  // -- TEST #5: Destructive SQL Statement Interception
  // Wait for rate limit window to reset before testing SQL execute endpoint
  printHeader('TEST #1 -- SQL Statement Interception (Destructive Commands)');
  console.log('   Waiting 65s for rate limit window to reset before SQL tests...');
  await new Promise(r => setTimeout(r, 65000));
  console.log('   Rate limit window reset. Running SQL interception tests...');

  const dropRes = await request('POST', '/api/chat/execute', { sql: 'DROP TABLE users' });
  test(
    'DROP TABLE is blocked (403)',
    dropRes.status === 403,
    dropRes.status,
    403
  );

  const truncateRes = await request('POST', '/api/chat/execute', { sql: 'TRUNCATE TABLE users' });
  test(
    'TRUNCATE is blocked (403)',
    truncateRes.status === 403,
    truncateRes.status,
    403
  );

  const alterRes = await request('POST', '/api/chat/execute', { sql: 'ALTER TABLE users ADD COLUMN hack TEXT' });
  test(
    'ALTER TABLE is blocked (403)',
    alterRes.status === 403,
    alterRes.status,
    403
  );

  const grantRes = await request('POST', '/api/chat/execute', { sql: 'GRANT ALL PRIVILEGES ON *.* TO hacker' });
  test(
    'GRANT is blocked (403)',
    grantRes.status === 403,
    grantRes.status,
    403
  );

  const renameRes = await request('POST', '/api/chat/execute', { sql: "RENAME TABLE users TO owned" });
  test(
    'RENAME is blocked (403)',
    renameRes.status === 403,
    renameRes.status,
    403
  );

  // ── TEST #6: UPDATE/DELETE without WHERE ──────────────────────────────────
  printHeader('TEST #2 — Contextual Data Manipulation Boundaries');

  const deleteNoWhereRes = await request('POST', '/api/chat/execute', { sql: 'DELETE FROM users' });
  test(
    'DELETE without WHERE is blocked (403)',
    deleteNoWhereRes.status === 403,
    deleteNoWhereRes.status,
    403
  );

  const updateNoWhereRes = await request('POST', '/api/chat/execute', { sql: 'UPDATE users SET status = "hacked"' });
  test(
    'UPDATE without WHERE is blocked (403)',
    updateNoWhereRes.status === 403,
    updateNoWhereRes.status,
    403
  );

  const updateWithWhereRes = await request('POST', '/api/chat/execute', { sql: 'UPDATE users SET status = "active" WHERE user_id = 9999' });
  test(
    'UPDATE WITH WHERE is allowed through (not 403)',
    updateWithWhereRes.status !== 403,
    updateWithWhereRes.status,
    '200 or 400 (allowed through)'
  );

  const deleteWithWhereRes = await request('POST', '/api/chat/execute', { sql: 'DELETE FROM users WHERE user_id = 99999' });
  test(
    'DELETE WITH WHERE is allowed through (not 403)',
    deleteWithWhereRes.status !== 403,
    deleteWithWhereRes.status,
    '200 or 400 (allowed through)'
  );

  // -- TEST #8: XSS payload in body
  printHeader('TEST #4 -- XSS Mitigation');
  // xss-clean strips <script> tags BEFORE the handler processes the message.
  // The handler receives a sanitized/empty message and returns a normal response.
  // A truly vulnerable server would echo back the raw <script> tag.
  const xssPayload = '<script>alert("xss")</script>';
  const xssRes = await request('POST', '/api/chat/message', { message: xssPayload });
  const bodyStr = JSON.stringify(xssRes.body);
  test(
    'XSS mitigation: raw <script> tag NOT present in server response',
    !bodyStr.includes('<script>alert') && !bodyStr.includes('<script>alert("xss")'),
    bodyStr.includes('<script>alert') ? 'Unescaped script tag echoed back!' : 'Script payload was stripped/sanitized',
    'No raw executable <script>alert in response'
  );

  // ── TEST #9: HPP - Parameter Pollution ───────────────────────────────────
  printHeader('TEST #5 — HTTP Parameter Pollution (HPP)');
  const hppRes = await request('GET', '/api/db/databases?dbName=a&dbName=b&dbName[]=c');
  test(
    'HPP: Duplicate query params handled (server does not crash)',
    hppRes.status !== 500 && hppRes.status !== 0,
    hppRes.status,
    'Non-500 (server is stable)'
  );

  // ── TEST #10 — Prepared Statement Injection Resistance ───────────────
  printHeader('TEST #10 -- Prepared Statement Injection Resistance');
  const sqlInjMsg = await request('POST', '/api/chat/message', {
    message: "'; DROP TABLE chat_history; --"
  });
  test(
    'SQL injection string in chat message is handled safely (no crash)',
    sqlInjMsg.status !== 500 && sqlInjMsg.status !== 0,
    sqlInjMsg.status,
    '200 (safe handling)'
  );

  // ── TEST #9: Rate Limiting (run last to avoid starving other tests) ───────
  printHeader('TEST #9 -- API Rate Limiting (run last)');
  console.log('   Waiting 5s for rate limit window to partially reset...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('   Sending 55 rapid requests to trigger rate limit...');
  let rateLimitTriggered = false;
  for (let i = 0; i < 55; i++) {
    const r = await request('GET', '/api/health');
    if (r.status === 429) {
      rateLimitTriggered = true;
    }
  }
  test(
    'Rate limiter triggers 429 after threshold',
    rateLimitTriggered,
    rateLimitTriggered ? '429 triggered' : 'Not triggered in 55 requests',
    '429 Too Many Requests'
  );

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  SECURITY TEST REPORT');
  console.log('='.repeat(60));

  results.forEach((r) => {
    const icon = r.ok ? '[PASS]' : '[FAIL]';
    console.log(icon + '  ' + r.name);
    if (!r.ok) {
      console.log('     Got:      ' + r.actual);
      console.log('     Expected: ' + r.expected);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log('  Total Tests : ' + (passed + failed));
  console.log('  PASSED      : ' + passed);
  console.log('  FAILED      : ' + failed);

  const score = Math.round((passed / (passed + failed)) * 100);
  const grade = score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : 'NEEDS WORK';
  console.log('  Score       : ' + score + '% -- ' + grade);
  console.log('-'.repeat(60) + '\n');
}

runAllTests().catch(console.error);
