import User from "../models/User.js"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, referrerId } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      role: "user",
    }

    // If referred by someone, add reference
    if (referrerId) {
      userData.referredBy = referrerId
    }

    // Create new user
    const user = await User.create(userData)

    if (user) {
      // If user was referred, update referrer's stats and add bonus
      if (referrerId) {
        const referrer = await User.findById(referrerId)
        if (referrer) {
          referrer.referralCount += 1
          referrer.balance += 20 // Add 20 taka bonus
          await referrer.save()
        }
      }

      res.status(201).json({
        message: "User registered successfully",
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
      })
    } else {
      res.status(400).json({ message: "Invalid user data" })
    }
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Return user data
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
