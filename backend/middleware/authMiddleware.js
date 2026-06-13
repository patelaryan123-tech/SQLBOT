/**
 * authMiddleware — Localhost Only version.
 * Since this is an offline/local application, authentication is simulated.
 */
async function authMiddleware(req, res, next) {
  // Permanent bypass for local/offline use
  req.user = {
    uid: 'local-user',
    email: 'local@localhost',
    name: 'Local User',
    isAdmin: true // Grant admin by default for local console
  };
  return next();
}

/**
 * adminOnly — Guard for local admin access.
 */
function adminOnly(req, res, next) {
  next(); // Always allow on localhost
}

module.exports = { authMiddleware, adminOnly };
