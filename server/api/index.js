// CommonJS wrapper - Vercel/ncc compatible
// Dynamically imports the ESM Express app
module.exports = async (req, res) => {
  const { default: app } = await import('./app.mjs');
  return app(req, res);
};
