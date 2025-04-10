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
    await College.findByIdAndDelete(req.params.collegeId);
    res.status(200).json({ message: 'College deleted successfully' });
  } catch (error) {
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
