module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  res.status(200).json({
    apiBaseUrl: process.env.ANALYZER_API_BASE_URL || '',
  });
};
