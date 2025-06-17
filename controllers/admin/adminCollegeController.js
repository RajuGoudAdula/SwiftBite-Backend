const Canteen = require('../../models/Canteen');
const College = require('../../models/College');

exports.createCollege = async (req, res) => {
  try {
    const college = await College.create(req.body);
    res.status(201).json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.collegeId, req.body, { new: true });
    res.status(200).json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    // Check if the college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Delete all canteens linked to this college
    await Canteen.deleteMany({ collegeId });

    // Now delete the college itself
    await College.findByIdAndDelete(collegeId);

    res.status(200).json({ message: "College and linked canteens deleted successfully" });
  } catch (error) {
    console.error("Delete college error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().populate('canteens');
    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
