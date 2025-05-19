import Prize from "../models/Prize.js"
import Tournament from "../models/Tournament.js"
import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import multer from "multer"
import path from "path"
import fs from "fs"

// Configure multer for proof image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/prize-proofs"
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `prize-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
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
}).single("proofImage")

// @desc    Get recently completed tournaments (last 3 days)
// @route   GET /api/prizes/recent-tournaments
// @access  Private
export const getRecentTournaments = async (req, res) => {
  try {
    // Get tournaments completed in the last 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const tournaments = await Tournament.find({
      isCompleted: true,
      matchSchedule: { $gte: threeDaysAgo },
    }).sort({ matchSchedule: -1 })

    res.status(200).json(tournaments)
  } catch (error) {
    console.error("Get recent tournaments error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Create a new prize request
// @route   POST /api/prizes
// @access  Private
export const createPrizeRequest = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err)
        return res.status(400).json({ message: err.message })
      }

      const { tournamentId, tournamentCode, prizeType, amount, kills, position, playerName, playerID, notes } = req.body

      if (!tournamentId || !tournamentCode || !prizeType || !amount || !playerName || !playerID || !req.file) {
        return res.status(400).json({ message: "Please provide all required fields and proof image" })
      }

      // Verify tournament exists and is completed
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" })
      }

      if (!tournament.isCompleted) {
        return res.status(400).json({ message: "Tournament is not completed yet" })
      }

      if (tournament.tournamentCode !== tournamentCode) {
        return res.status(400).json({ message: "Invalid tournament code" })
      }

      // Create prize request
      const prizeRequest = await Prize.create({
        user: req.user._id,
        tournament: tournamentId,
        tournamentCode,
        prizeType,
        amount: Number(amount),
        kills: kills ? Number(kills) : 0,
        position: position ? Number(position) : 0,
        playerName,
        playerID,
        accountNumber: "N/A",
        paymentMethod: "N/A",
        proofImage: `/${req.file.path.replace(/\\/g, "/")}`,
        notes: notes || "",
      })

      res.status(201).json({
        message: "Prize request submitted successfully",
        prizeRequest: {
          id: prizeRequest._id,
          tournamentCode: prizeRequest.tournamentCode,
          prizeType: prizeRequest.prizeType,
          amount: prizeRequest.amount,
          status: prizeRequest.status,
          createdAt: prizeRequest.createdAt,
        },
      })
    })
  } catch (error) {
    console.error("Create prize request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user's prize requests
// @route   GET /api/prizes
// @access  Private
export const getUserPrizeRequests = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null

    const query = { user: req.user._id }

    // Add status filter if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    const total = await Prize.countDocuments(query)
    const prizeRequests = await Prize.find(query)
      .populate("tournament", "title game")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      prizeRequests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get user prize requests error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get prize request details
// @route   GET /api/prizes/:id
// @access  Private/Admin
export const getPrizeRequestDetails = async (req, res) => {
  try {
    const prizeRequest = await Prize.findById(req.params.id)
      .populate("user", "name email")
      .populate("tournament", "title game type winningPrize perKillPrize")

    if (!prizeRequest) {
      return res.status(404).json({ message: "Prize request not found" })
    }

    // Check if the user is the owner or an admin
    if (prizeRequest.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    res.status(200).json(prizeRequest)
  } catch (error) {
    console.error("Get prize request details error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get all prize requests (admin)
// @route   GET /api/prizes/admin
// @access  Admin
export const getAllPrizeRequests = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null
    const search = req.query.search || ""

    const query = {}

    // Add status filter if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { playerName: { $regex: search, $options: "i" } },
        { playerID: { $regex: search, $options: "i" } },
        { tournamentCode: { $regex: search, $options: "i" } },
      ]
    }

    const total = await Prize.countDocuments(query)
    const prizeRequests = await Prize.find(query)
      .populate("user", "name email")
      .populate("tournament", "title game")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      prizeRequests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get all prize requests error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Process a prize request (admin)
// @route   PUT /api/prizes/:id/process
// @access  Admin
export const processPrizeRequest = async (req, res) => {
  try {
    const { status, amount, notes } = req.body

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const prizeRequest = await Prize.findById(req.params.id)
    if (!prizeRequest) {
      return res.status(404).json({ message: "Prize request not found" })
    }

    if (prizeRequest.status !== "pending") {
      return res.status(400).json({ message: `Prize request is already ${prizeRequest.status}` })
    }

    // Update prize request
    prizeRequest.status = status
    if (notes) prizeRequest.notes = notes

    // Admin can update amount
    if (status === "approved" && amount) {
      prizeRequest.amount = Number(amount)
    }

    await prizeRequest.save()

    // If approved, add the amount to user's balance
    if (status === "approved") {
      const user = await User.findById(prizeRequest.user)
      if (user) {
        // Add the prize amount to user's balance
        user.balance += prizeRequest.amount
        await user.save()

        // Create transaction record
        await Transaction.create({
          user: user._id,
          amount: prizeRequest.amount,
          type: "other",
          description: `Prize money for ${prizeRequest.prizeType.replace("_", " ")} in tournament ${prizeRequest.tournamentCode}`,
          reference: prizeRequest._id,
          referenceModel: "Prize",
        })
      }
    }

    res.status(200).json({
      message: `Prize request ${status} successfully`,
      prizeRequest: {
        id: prizeRequest._id,
        status: prizeRequest.status,
        amount: prizeRequest.amount,
        updatedAt: prizeRequest.updatedAt,
      },
    })
  } catch (error) {
    console.error("Process prize request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Admin distribute prize money directly
// @route   POST /api/prizes/distribute
// @access  Admin
export const distributePrizeMoney = async (req, res) => {
  try {
    const { tournamentId, userId, prizeType, amount, kills, position, playerName, playerID, notes } = req.body

    if (!tournamentId || !userId || !prizeType || !amount) {
      return res.status(400).json({ message: "Please provide all required fields" })
    }

    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId)
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" })
    }

    // Verify user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Create prize record (already approved)
    const prize = await Prize.create({
      user: userId,
      tournament: tournamentId,
      tournamentCode: tournament.tournamentCode,
      prizeType,
      amount: Number(amount),
      kills: kills ? Number(kills) : 0,
      position: position ? Number(position) : 0,
      playerName: playerName || "N/A",
      playerID: playerID || "N/A",
      accountNumber: "N/A",
      paymentMethod: "N/A",
      proofImage: "/uploads/prize-proofs/admin-distributed.jpg", // Default image for admin distribution
      notes: notes || "Prize distributed by admin",
      status: "approved",
    })

    // Add the amount to user's balance
    user.balance += Number(amount)
    await user.save()

    // Create transaction record
    await Transaction.create({
      user: userId,
      amount: Number(amount),
      type: "other",
      description: `Prize money for ${prizeType.replace("_", " ")} in tournament ${tournament.tournamentCode} (distributed by admin)`,
      reference: prize._id,
      referenceModel: "Prize",
    })

    res.status(201).json({
      message: "Prize money distributed successfully",
      prize: {
        id: prize._id,
        tournamentCode: prize.tournamentCode,
        prizeType: prize.prizeType,
        amount: prize.amount,
        status: prize.status,
      },
    })
  } catch (error) {
    console.error("Distribute prize money error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
