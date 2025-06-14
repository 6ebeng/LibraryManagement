const User = require('../models/user')
const passport = require("passport");
const { errorMessages } = require('../utils/errorMessages');

const registerUser = async (req, res) => {
  // Validate required fields
  if (!req.body.email) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.user.emailRequired
    });
  }
  
  if (!req.body.password) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.user.passwordRequired
    });
  }

  if (!req.body.name) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.user.nameRequired
    });
  }

  // Check if password is strong enough
  if (req.body.password.length < 8) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.user.weakPassword
    });
  }

  User.findOne({email: req.body.email}, (err, user) => {
    if (err) {
      console.error('Database error during user lookup:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.general.databaseError
      });
    }
    if (user) {
      return res.status(403).json({
        success: false, 
        message: errorMessages.auth.userAlreadyExists
      });
    } else {
      const newUser = new User(req.body);
      newUser.setPassword(req.body.password);
      newUser.save((err, user) => {
        if (err) {
          console.error('Error saving new user:', err);
          return res.status(400).json({
            success: false, 
            message: errorMessages.user.createFailed
          });
        }
        return res.status(201).json({
          success: true,
          user,
          message: 'User account created successfully'
        });
      })
    }
  })
}

const loginUser = async (req, res, next) => {
  // Validate required fields
  if (!req.body.email) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.auth.emailRequired
    });
  }
  
  if (!req.body.password) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.auth.passwordRequired
    });
  }

  User.findOne({email: req.body.email}, (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.general.databaseError
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: errorMessages.auth.userNotFound
      });
    }
    if (!user.isValidPassword(req.body.password)) {
      return res.status(401).json({
        success: false, 
        message: errorMessages.auth.incorrectPassword
      });
    }
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.status(500).json({
          success: false, 
          message: errorMessages.general.serverError
        });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login session error:', err);
          return res.status(500).json({
            success: false, 
            message: errorMessages.general.serverError
          });
        }
        return res.status(200).json({
          success: true,
          user,
          message: `Welcome back, ${user.name}!`
        });
      });
    },)(req, res, next);
  })
}

const logoutUser = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false, 
        message: 'Failed to logout. Please try again.'
      });
    }
  });
  return res.status(200).json({
    success: true, 
    message: "You have been successfully logged out"
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser
}
