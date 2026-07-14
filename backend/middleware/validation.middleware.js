export function validateBody(schema) {
  return function (req, res, next) {
    try {
      req.body = schema.parse(req.body);

      next();
    } catch (error) {
      next(error);
    }
  };
}
