export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
 
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
 
  // Replace req.body with the parsed data - this is what makes validation
  // actually useful, not just a gatekeeper: result.data has been trimmed
  // and coerced by the schema, so the controller can trust it as-is.
  req.body = result.data;
  next();
};
 