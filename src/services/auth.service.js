const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

function getTokenSecrets() {
  const { secret: accessTokenSecret, refreshSecret: refreshTokenSecret } = config.jwt;
  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error('JWT secrets are not configured');
  }
  return { accessTokenSecret, refreshTokenSecret };
}

function createTokens(user) {
    const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets();
    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = jwt.sign(payload, accessTokenSecret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
}

async function signup(body) {
    try {
        const { name, email, password } = body;

        if (!name || !email || !password) {
            throw new Error('All fields are required');
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const userObj = user.toObject();
        delete userObj.password;
        const { accessToken, refreshToken } = createTokens(user);
        return { user: userObj, accessToken, refreshToken };

    } catch (error) {
        if (error.message && ['All fields are required', 'Email already registered', 'Password must be at least 6 characters', 'JWT secrets are not configured'].includes(error.message)) {
            throw error;
        }
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(e => e.message).join(', ');
            throw new Error(message);
        }
        if (error.code === 11000) {
            throw new Error('Email already registered');
        }
        throw error;
    }
    
}
async function login(body) {
    try{
        console.log('login body', body);
        const { email, password } = body;
        if(!email || !password) {
            throw new Error('All fields are required');
        }
      const loggedinUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (!loggedinUser) {
          throw new Error('Invalid email or password');
      }
      const isPasswordValid = await bcrypt.compare(password, loggedinUser.password);
      if (!isPasswordValid) {
          throw new Error('Invalid email or password');
      }
      const userObj = {
          name: loggedinUser.name,
          role: loggedinUser.role,
          email: loggedinUser.email
      };
      const { accessToken, refreshToken } = createTokens(loggedinUser);
      return { user: userObj, accessToken, refreshToken };
    } catch (error) {
        if(error.message && ['All fields are required', 'Invalid email or password', 'JWT secrets are not configured'].includes(error.message)) {
            throw error;
        }
        throw error;
    }
}
async function refreshAccessToken(refreshUser) {
    try {
        const userId = refreshUser?.id;
        if (!userId) {
            throw new Error('Invalid refresh token');
        }
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Invalid refresh token');
        }
        const tokens = createTokens(user);
        return tokens;
    } catch (error) {
        if (error.message && ['Invalid refresh token', 'JWT secrets are not configured'].includes(error.message)) {
            throw error;
        }
        throw error;
    }
}

async function logout(userId) {
    if (!userId) {
        throw new Error('User not found');
    }
    return { message: 'Logged out successfully' };
}

module.exports = { signup, login, refreshAccessToken, logout };
