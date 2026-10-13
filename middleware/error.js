const AppError = require('../utils/AppError');

const notFound = (req, res, next) => next(new AppError(`Marshrut topilmadi: ${req.method} ${req.originalUrl}`, 404));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server xatosi';
  let errors;

  if (err.name === 'ValidationError') {
    status = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors[0];
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Noto'g'ri qiymat: ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'maydon';
    message = `Bu ${field} allaqachon mavjud`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Rasm hajmi 2MB dan oshmasligi kerak' : err.message;
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Ichki server xatosi';
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV !== 'production' && status >= 500 && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
