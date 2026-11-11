const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
  res.send('Game Master Server is Running Successfully');
});

app.post('/api/user/login', async (req, res) => {
  const { phone } = req.body;
  try {
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, balance: 100 });
      await user.save();
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Login Failed' });
  }
});

app.post('/api/game/settle', async (req, res) => {
  const { phone, betAmount, hasWon, winAmount, gameType } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user || user.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient Balance or User Not Found' });
    }

    user.balance -= betAmount;

    let payout = 0;
    if (hasWon) {
      const winFee = winAmount * 0.005;
      payout = winAmount - winFee;
      user.balance += payout;
    }

    await user.save();
    res.json({
      success: true,
      game: gameType,
      newBalance: user.balance,
      payout: payout
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Internal Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
