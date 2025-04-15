import express from "express"
import {
    createTournament,
    updateTournament,
    getTournaments,
    getTournamentById,
    registerForTournament,
    getUserRegistrations,
    getTournamentRegistrations,
    changeTournamentStatus,
    getTournamentMoods,
    getFeaturedTournaments,
    getHistoricalTournaments,
} from "../controllers/tournamentController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public routes
router.get("/", getTournaments)
router.get("/moods", getTournamentMoods)
router.get("/featured", getFeaturedTournaments)
router.get("/historical", getHistoricalTournaments)
router.get("/:id", getTournamentById)

// Private routes
router.get("/user/registrations", protect, getUserRegistrations)
router.post("/:id/register", protect, registerForTournament)

// Admin routes
router.post("/", protect, admin, createTournament)
router.put("/:id", protect, admin, updateTournament)
router.put("/:id/status", protect, admin, changeTournamentStatus)
router.get("/:id/registrations", protect, admin, getTournamentRegistrations)

export default router
