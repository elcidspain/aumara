const crypto = require('crypto');
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  var token = process.env.CESIUM_ION_TOKEN || '';
  if (!token) { res.statusCode = 200; return res.end('/* no token */\n'); }
  var window = Math.floor(Date.now() / 45000);
  var sig = crypto.createHmac('sha256', token).update('aumara-gate:' + window).digest('hex');
  var val = encodeURIComponent(window + '.' + sig);
  res.setHeader('Set-Cookie', 'aumara_gate=' + val + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=120');
  res.statusCode = 200;
  return res.end('/* gated */\n');
};
