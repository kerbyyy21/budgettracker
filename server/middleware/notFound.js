// JSON 404 catch-all, registered after all routes.
module.exports = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};
