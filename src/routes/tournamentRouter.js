import express from 'express';
import { addTournament, getTournaments, getTournamentById, deleteTournament, updateTournament } from '../controllers/tournamentController.js';
import { admin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define the routes for tournaments
router.post('/', protect, admin, addTournament); // Add a new tournament
router.get('/', getTournaments); // Get all tournaments
router.get('/:id', protect, admin, getTournamentById); // Get a tournament by ID
// router.delete('/:id', deleteTournament); // Delete a tournament by ID
// router.put('/:id', updateTournament); // Update a tournament by ID

export default router;
