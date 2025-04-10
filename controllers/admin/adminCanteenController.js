const bcrypt = require("bcryptjs");
const Canteen = require('../../models/Canteen');
const User = require('../../models/User');

exports.createCanteen = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { name, email, password, phone, bankDetails } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const canteenData = { name,email,password:hashedPassword,phone,bankDetails, collegeId }; // Ensure the canteen is linked to the college
    const canteen = await Canteen.create(canteenData);
    const userData={
      name,email,password:hashedPassword,phone, role: "canteen",
      isVerified: true,
      college: collegeId,
      canteen: canteen._id,
    };
    const user = await User.create(userData);
    res.status(201).json(canteen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCanteen = async (req, res) => {
  try {
    const { collegeId, canteenId } = req.params;
    const updatedCanteen = await Canteen.findOneAndUpdate(
      { _id: canteenId, collegeId }, // Ensure the canteen belongs to the given college
      req.body,
      { new: true }
    );

    const { name, email, phone, } = req.body;
    const updatedUser = await User.findOneAndUpdate({email},{name,email,phone},{new : true});

    if (!updatedCanteen) {
      return res.status(404).json({ error: 'Canteen not found for this college' });
    }
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found for this canteen' });
    }

    res.status(200).json(updatedCanteen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCanteen = async (req, res) => {
  try {
    const { collegeId, canteenId } = req.params;
    const canteen = await Canteen.findOneAndDelete({ _id: canteenId, collegeId });

    if (!canteen) {
      return res.status(404).json({ error: 'Canteen not found for this college' });
    }

    res.status(200).json({ message: 'Canteen deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCanteensByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const canteens = await Canteen.find({ collegeId });

    if (!canteens) {
      return res.status(404).json({ error: 'No canteens found for this college' });
    }

    res.status(200).json(canteens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
