const User = require('../models/User');
const Skill = require('../models/Skill');

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users',
      message: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user',
      message: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    // 仅允许用户更新自己的资料，或管理员更新任意用户
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this user'
      });
    }

    const { fullName, bio, avatar } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating user',
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user',
      message: error.message
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const publisherUsers = await User.countDocuments({ role: 'publisher' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        publisherUsers,
        adminUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user stats',
      message: error.message
    });
  }
};

function normalizeAuthor(skill) {
  if (skill && (!skill.author || (!skill.author.username && !skill.author.fullName))) {
    skill.author = { username: 'unknown', fullName: '未知' };
  }
  return skill;
}

const getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('favorites').populate({
      path: 'favorites',
      match: { status: 'published' },
      select: 'name description version category tags downloads rating author'
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const skills = (user.favorites || []).filter(Boolean).map(normalizeAuthor);
    res.json({ success: true, data: { skills } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching favorites',
      message: error.message
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { skillId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const skill = await Skill.findById(skillId);
    if (!skill || skill.status !== 'published') {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    const favs = user.favorites || [];
    if (favs.some((id) => id.toString() === skillId)) {
      const skills = await getFavoritesSkills(req.user.userId);
      return res.json({ success: true, message: 'Already in favorites', data: { skills } });
    }
    favs.push(skillId);
    user.favorites = favs;
    await user.save();
    const skills = await getFavoritesSkills(req.user.userId);
    res.json({ success: true, message: 'Added to favorites', data: { skills } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { skillId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const favs = (user.favorites || []).filter((id) => id.toString() !== skillId);
    user.favorites = favs;
    await user.save();
    const skills = await getFavoritesSkills(req.user.userId);
    res.json({ success: true, message: 'Removed from favorites', data: { skills } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

async function getFavoritesSkills(userId) {
  const u = await User.findById(userId).populate({
    path: 'favorites',
    match: { status: 'published' },
    select: 'name description version category tags downloads rating author'
  });
  return (u?.favorites || []).filter(Boolean).map(normalizeAuthor);
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getMyFavorites,
  addFavorite,
  removeFavorite
};