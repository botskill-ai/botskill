const express = require('express');
const { getAllUsers, getUserById, updateUser, deleteUser, getUserStats, getMyFavorites, addFavorite, removeFavorite } = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeAdmin, getAllUsers);
router.get('/stats', authenticateToken, getUserStats);
router.get('/me/favorites', authenticateToken, getMyFavorites);
router.post('/me/favorites/:skillId', authenticateToken, addFavorite);
router.delete('/me/favorites/:skillId', authenticateToken, removeFavorite);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteUser);

module.exports = router;