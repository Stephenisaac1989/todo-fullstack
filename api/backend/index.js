import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
}
await connectDB();

// Schema + Model
const itemSchema = new mongoose.Schema({
  text: String,
  budgeted: Number,
  spent: Number,
  currency: String,
  time: { type: Date, default: Date.now },
  convertedBudgetedNGN: Number,
  convertedSpentNGN: Number,
  completed: { type: Boolean, default: false }
});
const Item = mongoose.model('Item', itemSchema);

// Currency conversion
function getRate(currency) {
  switch (currency) {
    case 'USD': return 1595;
    case 'EUR': return 1800;
    case 'GBP': return 2170;
    default: return 1;
  }
}

// CRUD + Range filter routes
app.get('/api/todos', async (_, res) => {
  const items = await Item.find();
  res.json(items);
});

app.get('/api/todos/range', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).send('Provide from & to dates');

  const start = new Date(from);
  const end = new Date(to);
  if (isNaN(start) || isNaN(end)) return res.status(400).send('Invalid date format');

  const items = await Item.find({ time: { $gte: start, $lte: end } });
  res.json(items);
});

app.post('/api/todos', async (req, res) => {
  const { text = '', budgeted = 0, spent = 0, currency = 'NGN' } = req.body;
  const rate = getRate(currency);
  const item = new Item({
    text, budgeted, spent, currency,
    convertedBudgetedNGN: budgeted * rate,
    convertedSpentNGN: spent * rate,
    time: new Date()
  });
  await item.save();
  res.status(201).json(item);
});

app.put('/api/todos/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Not found');

  const { text, budgeted, spent } = req.body;
  const rate = getRate(item.currency);
  item.text = text; item.budgeted = budgeted; item.spent = spent;
  item.convertedBudgetedNGN = budgeted * rate;
  item.convertedSpentNGN = spent * rate;
  await item.save();
  res.json(item);
});

app.delete('/api/todos/:id', async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));