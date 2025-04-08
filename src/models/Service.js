const mongoose = require('mongoose');
const { Schema } = mongoose;

const serviceSchema = new Schema({
    title: { type: String, required: true }, // e.g., "Solo Time | Mobile | 37538"
    type: { type: String, required: true }, // e.g., "Solo"
    version: { type: String, required: true }, // e.g., "TPP"
    map: { type: String, required: true }, // e.g., "Bermuda"
    matchType: { type: String, required: true }, // e.g., "Paid"
    entryFee: { type: Number, required: true }, // e.g., 20
    matchSchedule: { type: Date, required: true }, // e.g., "27/03/2025 at 04:30 PM"
    winningPrize: { type: Number, required: true }, // e.g., 800
    perKillPrize: { type: Number, required: true }, // e.g., 10
    rules: { type: String, required: true }, // Match instructions and rules
    createdAt: { type: Date, default: Date.now }
});
