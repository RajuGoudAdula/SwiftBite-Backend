const mongoose = require('mongoose');
const College = require('../../models/College');
const Canteen = require('../../models/Canteen');
const User = require('../../models/User');
const CanteenMenuItem = require("../../models/CanteenMenuItem");

exports.getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().populate('canteens');
    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCanteensByCollege = async (req, res) => {
  try {
    const canteens = await Canteen.find({ collegeId: req.params.collegeId });
    res.status(200).json(canteens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getMenuOfCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ error: "Invalid canteenId format" });
    }

    const menu = await CanteenMenuItem.find({ canteenId: new mongoose.Types.ObjectId(canteenId) })
      .populate("productId");

    if (!menu || menu.length === 0) {
      return res.status(404).json({ message: "No menu items found for this canteen" });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCollegeCanteen = async (req, res) => {
  try {
    const { userId } = req.params;
    const { collegeId, canteenId } = req.body;

    // Check for missing fields
    if (!collegeId || !canteenId) {
      return res.status(400).json({ success: false, message: 'collegeId and canteenId are required' });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(collegeId) ||
      !mongoose.Types.ObjectId.isValid(canteenId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ success: false, message: 'Invalid college, canteen or user ID' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if college and canteen exist
    const college = await College.findById(collegeId);
    const canteen = await Canteen.findById(canteenId);
    if (!college || !canteen) {
      return res.status(404).json({ success: false, message: 'College or Canteen not found' });
    }

    // Update user details
    user.college = collegeId;
    user.canteen = canteenId;
    await user.save();

    
    return res.json({
      success: true,
      message: 'College & Canteen updated successfully.',
      college: { _id: college._id, name: college.name },
      canteen: { _id: canteen._id, name: canteen.name , status: canteen.status }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong while updating college and canteen.',
      error: error.message
    });
  }
};


