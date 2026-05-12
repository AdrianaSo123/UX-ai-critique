module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;

  const apiBaseUrl = String(process.env.ANALYZER_API_BASE_URL || '').trim();
  res.end(JSON.stringify({ apiBaseUrl }));
};
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  res.status(200).json({
    apiBaseUrl: process.env.ANALYZER_API_BASE_URL || '',
  });
};
