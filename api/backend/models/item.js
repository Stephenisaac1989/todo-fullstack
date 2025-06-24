import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  text: String,
  budgeted: Number,
  spent: Number,
  currency: String,
  time: String,
  convertedBudgetedNGN: Number,
  convertedSpentNGN: Number,
  completed: { type: Boolean, default: false }
});

export default mongoose.model('Item', itemSchema);