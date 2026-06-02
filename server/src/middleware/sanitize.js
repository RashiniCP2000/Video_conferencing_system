export function sanitizeInput(obj) {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        sanitizeInput(obj[key]);
      }
    }
  }
  return obj;
}

export function preventNoSqlInjection(req, res, next) {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
}
