import TopUp from "../models/TopUp.js"
import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import multer from "multer"
import path from "path"
import fs from "fs"

// Configure multer for slip image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/slip-images"
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `slip-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Only image or PDF files are allowed"))
  },
}).single("slipImage")

// @desc    Create a new top-up request
// @route   POST /api/topup
// @access  Private
export const createTopUp = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err)
        return res.status(400).json({ message: err.message })
      }

      const { amount, transactionId } = req.body

      if (!amount || !req.file) {
        return res.status(400).json({ message: "Please provide amount and slip image" })
      }

      // Create top-up request
      const topUp = await TopUp.create({
        user: req.user._id,
        amount: Number.parseFloat(amount),
        transactionId,
        slipImage: `/${req.file.path.replace(/\\/g, "/")}`,
      })

      res.status(201).json({
        message: "Top-up request submitted successfully",
        topUp: {
          id: topUp._id,
          amount: topUp.amount,
          transactionId: topUp.transactionId,
          status: topUp.status,
          createdAt: topUp.createdAt,
        },
      })
    })
  } catch (error) {
    console.error("Create top-up error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user's top-up requests
// @route   GET /api/topup
// @access  Private
export const getUserTopUps = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null
    const search = req.query.search || ""

    const query = { user: req.user._id }

    // Add status filter if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    // Add search filter if provided
    if (search) {
      query.transactionId = { $regex: search, $options: "i" }
    }

    const total = await TopUp.countDocuments(query)
    const topUps = await TopUp.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      topUps,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get user top-ups error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get all top-up requests (admin)
// @route   GET /api/topup/admin
// @access  Admin
export const getAllTopUps = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null
    const search = req.query.search || ""
    const userId = req.query.userId || null

    const query = {}

    // Add status filter if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    // Add user filter if provided
    if (userId) {
      query.user = userId
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        // Add more fields to search if needed
      ]
    }

    const total = await TopUp.countDocuments(query)
    const topUps = await TopUp.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      topUps,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get all top-ups error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Approve a top-up request
// @route   PUT /api/topup/:id/approve
// @access  Admin
export const approveTopUp = async (req, res) => {
  try {
    const topUp = await TopUp.findById(req.params.id)

    if (!topUp) {
      return res.status(404).json({ message: "Top-up request not found" })
    }

    if (topUp.status !== "pending") {
      return res.status(400).json({ message: `Top-up request is already ${topUp.status}` })
    }

    // Update top-up status
    topUp.status = "approved"
    topUp.notes = req.body.notes || ""
    await topUp.save()

    // Update user balance
    const user = await User.findById(topUp.user)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.balance += topUp.amount
    await user.save()

    // Create transaction record
    await Transaction.create({
      user: user._id,
      amount: topUp.amount,
      type: "top-up",
      description: `Top-up of ${topUp.amount} taka approved`,
      reference: topUp._id,
      referenceModel: "TopUp",
    })

    res.status(200).json({
      message: "Top-up request approved successfully",
      topUp: {
        id: topUp._id,
        amount: topUp.amount,
        status: topUp.status,
        updatedAt: topUp.updatedAt,
      },
    })
  } catch (error) {
    console.error("Approve top-up error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Reject a top-up request
// @route   PUT /api/topup/:id/reject
// @access  Admin
export const rejectTopUp = async (req, res) => {
  try {
    const topUp = await TopUp.findById(req.params.id)

    if (!topUp) {
      return res.status(404).json({ message: "Top-up request not found" })
    }

    if (topUp.status !== "pending") {
      return res.status(400).json({ message: `Top-up request is already ${topUp.status}` })
    }

    // Update top-up status
    topUp.status = "rejected"
    topUp.notes = req.body.notes || ""
    await topUp.save()

    res.status(200).json({
      message: "Top-up request rejected successfully",
      topUp: {
        id: topUp._id,
        amount: topUp.amount,
        status: topUp.status,
        updatedAt: topUp.updatedAt,
      },
    })
  } catch (error) {
    console.error("Reject top-up error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get top-up details
// @route   GET /api/topup/:id
// @access  Private
import mongoose from "mongoose"; // Make sure this is imported

export const getTopUpDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid top-up ID" });
      }

    const topUp = await TopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({ message: "Top-up request not found" });
    }

    // Check if the user is the owner or an admin
    if (topUp.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(topUp);
  } catch (error) {
    console.error("Get top-up details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
