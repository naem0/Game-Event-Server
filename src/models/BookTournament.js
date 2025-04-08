import mongoose from 'mongoose';
const { Schema } = mongoose;

const BookTournamentSchema = new Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tournament_id: [{ type: Schema.Types.ObjectId, ref: 'Tournament' }],
    createdAt: { type: Date, default: Date.now },
});

const BookTournament = mongoose.model('BookTournament', BookTournamentSchema);

export default BookTournament;