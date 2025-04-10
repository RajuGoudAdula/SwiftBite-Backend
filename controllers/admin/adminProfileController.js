const User = require('../../models/User');

// ✅ Get All Users
exports.getAllUsers = async (req, res) => {
  const users = await User.find({ role: 'user' });
  res.status(200).json({ users });
};

// ✅ Get All Canteens
exports.getAllCanteens = async (req, res) => {
  const canteens = await User.find({ role: 'canteen' });
  res.status(200).json({ canteens });
};

// ✅ Delete User
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'User deleted successfully' });
};
