const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      
      const authHeader = req.headers.authorization;
      console.log("Authorization Header:", authHeader);

      
      if (!authHeader) {
        console.log("❌ Unauthorized - No Authorization Header");
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
      }

      
      const token = authHeader.split(' ')[1].replace(/^"|"$/g, '');
      console.log("token received " , token);
      
      if (!token) {
        console.log("❌ Unauthorized - No Token Found");
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
      }

      console.log("Decoding.....");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log("❌ Unauthorized - User Not Found");
        return res.status(401).json({ message: "Unauthorized - User Not Found" });
      }

      
      req.user = user;
      req.userId=decoded.id;
      console.log(req.userId);
      
      if (requiredRole && user.role !== requiredRole) {
        console.log(`❌ Access Denied - Only ${requiredRole} can access this route.`);
        return res.status(403).json({
          message: `Access Denied - Only ${requiredRole} can access this route.`
        });
      }

      
      next();
    } catch (error) {
      console.error("❌ Error in Auth Middleware:", error);

      
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
