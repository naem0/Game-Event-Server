import Tournament from '../models/Tournament.js';

// show all tournaments
export const getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find();
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// show a tournament by id
export const getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (tournament) {
            res.json(tournament);
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// add tournament
export const addTournament = async (req, res) => {
    const {
        title,
        device,
        tournamentCode,
        logo,
        coverImage,
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
        maxPlayers
    } = req.body;

    try {
        const tournament = new Tournament({
            title,
            device,
            tournamentCode,
            logo,
            coverImage,
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
            playersRegistered: 0,
            isActive: true,
            isCompleted: false
        });

        const newTournament = await tournament.save();
        res.status(201).json(newTournament);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// update tournament
export const updateTournament = async (req, res) => {
    const { title, device, tournamentCode, logo, coverImage, game, description, type, version, map, matchType, entryFee, matchSchedule, winningPrize, perKillPrize, rules, maxPlayers } = req.body;
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (tournament) {
            tournament.title = title;
            tournament.device = device;
            tournament.tournamentCode = tournamentCode;
            tournament.logo = logo;
            tournament.coverImage = coverImage;
            tournament.game = game;
            tournament.description = description;
            tournament.type = type;
            tournament.version = version;
            tournament.map = map;
            tournament.matchType = matchType;
            tournament.entryFee = entryFee;
            tournament.matchSchedule = matchSchedule;
            tournament.winningPrize = winningPrize;
            tournament.perKillPrize = perKillPrize;
            tournament.rules = rules;
            tournament.maxPlayers = maxPlayers;

            const updatedTournament = await tournament.save();
            res.json(updatedTournament);
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// delete tournament
export const deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (tournament) {
            res.json({ message: 'Tournament deleted' });
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
