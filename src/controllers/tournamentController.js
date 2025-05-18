import Tournament from "../models/Tournament.js"
import TournamentRegistration from "../models/TournamentRegistration.js"
import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import multer from "multer"
import path from "path"
import fs from "fs"

// Configure multer for tournament image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/tournament-images"
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, `tournament-${uniqueSuffix}${path.extname(file.originalname)}`)
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
}).fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
])

// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Admin
export const createTournament = async (req, res) => {
    // First handle the upload middleware separately
    upload(req, res, async (err) => {
        try {
            if (err) {
                console.error("Upload error:", err)
                return res.status(400).json({ message: err.message })
            }

            // Now check for files after upload middleware has processed
            if (!req.files || !req.files.logo || !req.files.coverImage) {
                return res.status(400).json({ message: "Please upload both logo and cover image" })
            }

            const {
                title,
                device,
                mood,
                tournamentCode,
                game,
                description,
                type,
                version,
                map,
                matchType,
                entryFee,
                matchSchedule,
                winningPrize,
                perKillPrize,
                rules,
                maxPlayers,
            } = req.body

            // Create tournament
            const tournament = await Tournament.create({
                title,
                device,
                mood,
                tournamentCode: tournamentCode || Math.floor(10000 + Math.random() * 90000).toString(),
                logo: `/${req.files.logo[0].path.replace(/\\/g, "/")}`,
                coverImage: `/${req.files.coverImage[0].path.replace(/\\/g, "/")}`,
                game,
                description,
                type,
                version,
                map,
                matchType,
                entryFee: Number(entryFee),
                matchSchedule: new Date(matchSchedule),
                winningPrize: Number(winningPrize),
                perKillPrize: Number(perKillPrize),
                rules,
                maxPlayers: Number(maxPlayers),
            })

            res.status(201).json({
                message: "Tournament created successfully",
                tournament,
            })
        } catch (error) {
            console.error("Create tournament error:", error)
            res.status(500).json({ message: "Server error", error: error.message })
        }
    })
}

// @desc    Update a tournament
// @route   PUT /api/tournaments/:id
// @access  Admin
export const updateTournament = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                console.error("Upload error:", err)
                return res.status(400).json({ message: err.message })
            }

            const tournament = await Tournament.findById(req.params.id)

            if (!tournament) {
                return res.status(404).json({ message: "Tournament not found" })
            }

            // Update fields
            const {
                title,
                device,
                mood,
                tournamentCode,
                game,
                description,
                type,
                version,
                map,
                matchType,
                entryFee,
                matchSchedule,
                winningPrize,
                perKillPrize,
                rules,
                maxPlayers,
                isActive,
                isCompleted,
            } = req.body

            if (title) tournament.title = title
            if (device) tournament.device = device
            if (mood) tournament.mood = mood
            if (tournamentCode) tournament.tournamentCode = tournamentCode
            if (game) tournament.game = game
            if (description) tournament.description = description
            if (type) tournament.type = type
            if (version) tournament.version = version
            if (map) tournament.map = map
            if (matchType) tournament.matchType = matchType
            if (entryFee) tournament.entryFee = Number(entryFee)
            if (matchSchedule) tournament.matchSchedule = new Date(matchSchedule)
            if (winningPrize) tournament.winningPrize = Number(winningPrize)
            if (perKillPrize) tournament.perKillPrize = Number(perKillPrize)
            if (rules) tournament.rules = rules
            if (maxPlayers) tournament.maxPlayers = Number(maxPlayers)
            if (isActive !== undefined) tournament.isActive = isActive === "true" || isActive === true
            if (isCompleted !== undefined) tournament.isCompleted = isCompleted === "true" || isCompleted === true

            // Update images if provided
            if (req.files) {
                if (req.files.logo) {
                    // Delete old logo if exists
                    if (tournament.logo) {
                        const oldLogoPath = path.join(process.cwd(), tournament.logo.replace(/^\//, ""))
                        try {
                            if (fs.existsSync(oldLogoPath)) {
                                fs.unlinkSync(oldLogoPath)
                            }
                        } catch (error) {
                            console.error("Error deleting old logo:", error)
                        }
                    }
                    tournament.logo = `/${req.files.logo[0].path.replace(/\\/g, "/")}`
                }

                if (req.files.coverImage) {
                    // Delete old cover image if exists
                    if (tournament.coverImage) {
                        const oldCoverPath = path.join(process.cwd(), tournament.coverImage.replace(/^\//, ""))
                        try {
                            if (fs.existsSync(oldCoverPath)) {
                                fs.unlinkSync(oldCoverPath)
                            }
                        } catch (error) {
                            console.error("Error deleting old cover image:", error)
                        }
                    }
                    tournament.coverImage = `/${req.files.coverImage[0].path.replace(/\\/g, "/")}`
                }
            }

            const updatedTournament = await tournament.save()

            res.status(200).json({
                message: "Tournament updated successfully",
                tournament: updatedTournament,
            })
        })
    } catch (error) {
        console.error("Update tournament error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = async (req, res) => {
    try {
        const { mood, isActive, isCompleted, search } = req.query
        const page = Number.parseInt(req.query.page) || 1
        const limit = Number.parseInt(req.query.limit) || 10

        const query = {}

        // Add filters if provided
        if (mood) query.mood = mood
        if (isActive !== undefined) query.isActive = isActive === "true"
        if (isCompleted !== undefined) query.isCompleted = isCompleted === "true"

        // Add search filter if provided
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { game: { $regex: search, $options: "i" } },
                { type: { $regex: search, $options: "i" } },
            ]
        }

        const total = await Tournament.countDocuments(query)
        const tournaments = await Tournament.find(query)
            .sort({ matchSchedule: 1 })
            .skip((page - 1) * limit)
            .limit(limit)

        res.status(200).json({
            tournaments,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        })
    } catch (error) {
        console.error("Get tournaments error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found" })
        }

        res.status(200).json(tournament)
    } catch (error) {
        console.error("Get tournament error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Register for a tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
export const registerForTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found" })
        }

        if (!tournament.isActive) {
            return res.status(400).json({ message: "This tournament is not active" })
        }

        if (tournament.isCompleted) {
            return res.status(400).json({ message: "This tournament is already completed" })
        }

        if (tournament.playersRegistered >= tournament.maxPlayers) {
            return res.status(400).json({ message: "Tournament is already full" })
        }

        // Check if user is already registered
        const existingRegistration = await TournamentRegistration.findOne({
            tournament: tournament._id,
            user: req.user._id,
        })

        if (existingRegistration) {
            return res.status(400).json({ message: "You are already registered for this tournament" })
        }

        const { playerName, playerID } = req.body

        if (!playerName || !playerID) {
            return res.status(400).json({ message: "Player name and ID are required" })
        }

        // Check if user has enough balance
        const user = await User.findById(req.user._id)
        if (user.balance < tournament.entryFee) {
            return res.status(400).json({ message: "Insufficient balance" })
        }

        // Deduct entry fee from user balance
        user.balance -= tournament.entryFee
        await user.save()

        // Create transaction record
        await Transaction.create({
            user: user._id,
            amount: -tournament.entryFee,
            type: "other",
            description: `Tournament registration fee for ${tournament.title}`,
            reference: tournament._id,
            referenceModel: "Tournament",
        })

        // Create registration
        const registration = await TournamentRegistration.create({
            tournament: tournament._id,
            user: req.user._id,
            playerName,
            playerID,
            paymentStatus: "completed",
        })

        // Increment players registered count
        tournament.playersRegistered += 1
        await tournament.save()

        res.status(201).json({
            message: "Successfully registered for the tournament",
            registration,
        })
    } catch (error) {
        console.error("Tournament registration error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get user's registered tournaments
// @route   GET /api/tournaments/user/registrations
// @access  Private
export const getUserRegistrations = async (req, res) => {
    try {
        const registrations = await TournamentRegistration.find({ user: req.user._id })
            .populate("tournament")
            .sort({ registrationDate: -1 })

        res.status(200).json(registrations)
    } catch (error) {
        console.error("Get user registrations error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get tournament registrations (admin)
// @route   GET /api/tournaments/:id/registrations
// @access  Admin
export const getTournamentRegistrations = async (req, res) => {
    try {
        const registrations = await TournamentRegistration.find({ tournament: req.params.id })
            .populate("user", "name email")
            .sort({ registrationDate: 1 })

        res.status(200).json(registrations)
    } catch (error) {
        console.error("Get tournament registrations error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Change tournament status
// @route   PUT /api/tournaments/:id/status
// @access  Admin
export const changeTournamentStatus = async (req, res) => {
    try {
        const { isActive, isCompleted } = req.body

        if (isActive === undefined && isCompleted === undefined) {
            return res.status(400).json({ message: "No status changes provided" })
        }

        const tournament = await Tournament.findById(req.params.id)

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found" })
        }

        if (isActive !== undefined) {
            tournament.isActive = isActive
        }

        if (isCompleted !== undefined) {
            tournament.isCompleted = isCompleted
        }

        const updatedTournament = await tournament.save()

        res.status(200).json({
            message: "Tournament status updated successfully",
            tournament: updatedTournament,
        })
    } catch (error) {
        console.error("Change tournament status error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get tournament moods (for filtering)
// @route   GET /api/tournaments/moods
// @access  Public
export const getTournamentMoods = async (req, res) => {
    try {
        const moods = await Tournament.distinct("mood")
        res.status(200).json(moods)
    } catch (error) {
        console.error("Get tournament moods error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get featured tournaments for homepage
// @route   GET /api/tournaments/featured
// @access  Public
export const getFeaturedTournaments = async (req, res) => {
    try {
        // Get upcoming active tournaments
        const upcomingTournaments = await Tournament.find({
            isActive: true,
            isCompleted: false,
            matchSchedule: { $gt: new Date() },
        })
            .sort({ matchSchedule: 1 })
            .limit(6)

        res.status(200).json(upcomingTournaments)
    } catch (error) {
        console.error("Get featured tournaments error:", error)
        res.status(500).json({ message: "Server error" })
    }
}

// @desc    Get historical tournaments
// @route   GET /api/tournaments/historical
// @access  Public
export const getHistoricalTournaments = async (req, res) => {
    try {
        // Get completed tournaments
        const historicalTournaments = await Tournament.find({
            isCompleted: true,
        })
            .sort({ matchSchedule: -1 })
            .limit(6)

        res.status(200).json(historicalTournaments)
    } catch (error) {
        console.error("Get historical tournaments error:", error)
        res.status(500).json({ message: "Server error" })
    }
}
