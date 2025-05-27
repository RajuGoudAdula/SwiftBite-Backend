const User = require("../../models/User");

// GET all users for admin
const getAllUsersForAdmin = async (req, res) => {
    try {
      const users = await User.find({})
        .select("-password -otp")
        .populate("college", "name location")        
        .populate("canteen", "name location")
        .populate("orders")                          
        .populate("cart");                           
  
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  };

// DELETE user by admin
const deleteUserByAdmin = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

module.exports = {
    getAllUsersForAdmin,
  deleteUserByAdmin,
};
