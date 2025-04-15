const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
      }
      const token = authHeader.split(' ')[1].replace(/^"|"$/g, '');
      if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized - User Not Found" });
      }

      
      req.user = user;
      req.userId=decoded.id;
     
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({
          message: `Access Denied - Only ${requiredRole} can access this route.`
        });
      }

      
      next();
    } catch (error) {
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Unauthorized JsonWebTokenError- Invalid Token" });
      }

      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token Expired - Please Login Again" });
      }

      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
  };
};

module.exports = authMiddleware;
