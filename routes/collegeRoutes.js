const express = require('express');
const { createCollege, updateCollege, deleteCollege, getAllColleges } = require('../controllers/collegeController');

const router = express.Router();

router.post('/', createCollege);
router.put('/:id', updateCollege);
router.delete('/:id', deleteCollege);
router.get('/', getAllColleges);

module.exports = router;
