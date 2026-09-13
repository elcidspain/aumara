module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  res.statusCode = 200;
  return res.end(JSON.stringify({ ok: !!(process.env.CESIUM_ION_TOKEN) }));
};
