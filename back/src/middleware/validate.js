const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: 'Error de validacion',
            details: errors,
          },
        });
      }

      req.validated = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = validate;
