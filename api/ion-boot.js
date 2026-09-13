const crypto = require('crypto');

function hmacHex(secret, msg) {
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  var deny = function () { res.statusCode = 200; return res.end('/* denied */\n'); };
  var token = process.env.CESIUM_ION_TOKEN || '';
  if (!token) return deny();
  if ((req.method || 'GET').toUpperCase() !== 'GET') return deny();
  var dest = req.headers['sec-fetch-dest'] || '';
  var site = req.headers['sec-fetch-site'] || '';
  var accept = req.headers.accept || '';
  var referer = req.headers.referer || '';
  var host = req.headers.host || '';
  var cookie = req.headers.cookie || '';
  if (dest !== 'script') return deny();
  if (site && site !== 'same-origin' && site !== 'same-site') return deny();
  if (/application\/json/i.test(accept)) return deny();
  var okRef = false;
  try {
    if (referer) {
      var rh = new URL(referer).host;
      okRef = rh === host || /\.vercel\.app$/i.test(rh) || rh === 'aumara.me' || rh === 'www.aumara.me' || rh === 'elcidspain.github.io';
    }
  } catch (e) { okRef = false; }
  if (!okRef) return deny();
  // Require short-lived httpOnly gate cookie set on document navigation
  var m = /(?:^|;\s*)aumara_gate=([^;]+)/.exec(cookie);
  if (!m) return deny();
  var parts = decodeURIComponent(m[1]).split('.');
  if (parts.length !== 2) return deny();
  var window = parts[0];
  var sig = parts[1];
  var wnum = parseInt(window, 10);
  if (!isFinite(wnum)) return deny();
  var cur = Math.floor(Date.now() / 45000);
  var okGate = false;
  for (var w = cur - 1; w <= cur + 1; w++) {
    if (String(w) === window && hmacHex(token, 'aumara-gate:' + w) === sig) okGate = true;
  }
  if (!okGate) return deny();
  var safe = JSON.stringify(token);
  res.statusCode = 200;
  return res.end(
    '(function(){try{var t=' + safe + ';if(!t)return;' +
    'if(window.AUMARA_ION&&window.AUMARA_ION.apply){window.AUMARA_ION.apply(window.Cesium||{},t);}' +
    'else{try{localStorage.setItem("CESIUM_ION_TOKEN",t);}catch(e){}}' +
    '}catch(e){}})();\n'
  );
};
