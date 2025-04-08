import User from "../models/User.js"
import multer from "multer"
import path from "path"
import fs from "fs"

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
