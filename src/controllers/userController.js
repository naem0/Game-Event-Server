import User from "../models/User.js"
import multer from "multer"
import path from "path"
import fs from "fs"
import Transaction from "../models/Transaction.js"
import Prize from "../models/Prize.js"
import TopUp from "../models/TopUp.js"
import TournamentRegistration from "../models/TournamentRegistration.js"
import { successResponse } from "../utils/apiResponse.js"

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profile-images"
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `user-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Only image files are allowed"))
  },
}).single("profileImage")

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.status(200).json(users)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (user) {
      res.status(200).json(user)
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user detailed information (admin)
// @route   GET /api/users/:id/details
// @access  Admin
export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id
    console.log("User ID:", userId)
    // Check if user is an admin
    // Get user basic info
    const user = await User.findById(userId).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get user transactions
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 })

    // Get user tournament registrations
    const tournaments = await TournamentRegistration.find({ user: userId })
      .populate("tournament")
      .sort({ registrationDate: -1 })

    // Get user prizes
    const prizes = await Prize.find({ user: userId }).sort({ createdAt: -1 })

    // Get user top-ups
    const topUps = await TopUp.find({ user: userId }).sort({ createdAt: -1 })

    // Calculate total prize money
    const totalPrize = prizes.reduce((sum, prize) => {
      return prize.status === "completed" ? sum + (prize.amount || 0) : sum
    }, 0)

    // Calculate total top-up
    const totalTopUp = topUps.reduce((sum, topUp) => {
      return topUp.status === "completed" ? sum + (topUp.amount || 0) : sum
    }, 0)

    return successResponse(res, 200, "User details retrieved successfully", {
      user,
      transactions,
      tournaments,
      prizes,
      topUps,
      stats: {
        totalPrize,
        totalTopUp,
        tournamentCount: tournaments.length,
      },
    })
  } catch (error) {
    console.error("Get user details error:", error)
    return res.status(500).json({ message: "Failed to retrieve user details", error: error.message })
  }
}


// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Handle file upload using multer middleware
    upload(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err)
        return res.status(400).json({ message: err.message })
      }

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Update fields if provided
      user.name = req.body.name || user.name
      user.phone = req.body.phone || user.phone
      user.address = req.body.address || user.address

      // If a new profile image was uploaded
      if (req.file) {
        // Delete previous profile image if exists
        if (user.profileImage) {
          const oldImagePath = path.join(process.cwd(), user.profileImage)
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath)
            }
          } catch (error) {
            console.error("Error deleting old image:", error)
          }
        }

        // Set new profile image path
        user.profileImage = `/${req.file.path.replace(/\\/g, "/")}`
      }

      const updatedUser = await user.save()

      res.status(200).json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
      })
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Promote user to admin
// @route   PUT /api/users/:id/promote
// @access  Admin
export const promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (user) {
      if (user.role === "admin") {
        return res.status(400).json({ message: "User is already an admin" })
      }

      user.role = "admin"
      const updatedUser = await user.save()

      res.status(200).json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      })
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error("Promote user error:", error)
    res.status(500).json({ message: "Server error" })
  }
}


// @desc    Suspend or unsuspend a user
// @route   PUT /api/users/:id/suspend
// @access  Admin
export const toggleUserSuspension = async (req, res) => {
  try {
    const { suspend } = req.body

    if (suspend === undefined) {
      return errorResponse(res, 400, "Suspend status is required")
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return errorResponse(res, 404, "User not found")
    }

    user.isSuspended = suspend
    const updatedUser = await user.save()

    const message = suspend ? "User suspended successfully" : "User unsuspended successfully"

    return successResponse(res, 200, message, {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isSuspended: updatedUser.isSuspended,
    })
  } catch (error) {
    console.error("Toggle user suspension error:", error)
    return errorResponse(res, 500, "Failed to update user suspension status")
  }
}

// @desc    Get user prize history
// @route   GET /api/users/:id/prizes
// @access  Private
export const getUserPrizes = async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user is viewing their own prizes or is an admin
    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
      return errorResponse(res, 403, "Not authorized to view these prizes")
    }

    const prizes = await Prize.find({ user: userId }).sort({ createdAt: -1 })

    // Calculate total prize money
    const totalPrize = prizes.reduce((sum, prize) => {
      return prize.status === "completed" ? sum + prize.amount : sum
    }, 0)

    return successResponse(res, 200, "User prizes retrieved successfully", {
      prizes,
      totalPrize,
    })
  } catch (error) {
    console.error("Get user prizes error:", error)
    return errorResponse(res, 500, "Failed to retrieve user prizes")
  }
}
