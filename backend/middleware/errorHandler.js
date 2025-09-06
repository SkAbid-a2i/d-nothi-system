// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ 
      message: 'Duplicate entry exists',
      field: err.sqlMessage.split("'")[1] 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({ message: 'CORS policy error', details: err.message });
  }

  // Default error
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message 
  });
};

module.exports = { errorHandler };