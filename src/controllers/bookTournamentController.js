import BookTournament from "../models/BookTournament";



// show all Booked tournaments
export const getBookedTournaments = async (req, res) => {
    try {
        const bookedTournaments = await BookTournament.find().populate('tournament_id');
        res.json(bookedTournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// show a user booked tournaments by id
export const getUserBookedTournaments = async (req, res) => {
    try {
        const bookedTournaments = await BookTournament.find({ participants: req.params.id }).populate('tournament_id');
        res.json(bookedTournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// show a booked tournament by id
export const getBookedTournamentById = async (req, res) => {
    try {
        const bookedTournament = await BookTournament.findById(req.params.id).populate('tournament_id');
        if (bookedTournament) {
            res.json(bookedTournament);
        } else {
            res.status(404).json({ message: 'Booked tournament not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}