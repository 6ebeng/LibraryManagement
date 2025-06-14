// Import required modules
const express = require('express');
const router = express.Router();

// Import functions from controller
const { getBorrowal, getAllBorrowals, addBorrowal, updateBorrowal, deleteBorrowal } = require('../controllers/borrowalController');

// FIX: Pass controller functions directly as callbacks for cleaner code
router.get('/getAll', getAllBorrowals);

router.get('/get/:id', getBorrowal);

router.post('/add', addBorrowal);

router.put('/update/:id', updateBorrowal);

router.delete('/delete/:id', deleteBorrowal);

module.exports = router;
