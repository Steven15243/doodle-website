const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const secretKey = 'your_secret_key'; // Replace with a secure secret key

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doodleApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// User schema and model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Doodle schema and model
const doodleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prompt: String,
    doodleUrl: String,
    date: { type: Date, default: Date.now }
});

const Doodle = mongoose.model('Doodle', doodleSchema);

// Authentication routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    try {
        await user.save();
        res.status(201).send('User registered');
    } catch (err) {
        res.status(400).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send('Invalid username or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send('Invalid username or password');
    }
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    req.session.token = token;
    res.json({ message: 'Login successful', token });
});

// Middleware to check authentication
function authenticate(req, res, next) {
    const token = req.session.token;
    if (!token) {
        return res.status(401).send('Access denied');
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
}

// Routes
app.get('/prompt', authenticate, async (req, res) => {
    const prompt = "Draw something that makes you happy"; // Replace with logic to fetch daily prompt
    res.json({ prompt });
});

app.post('/doodle', authenticate, async (req, res) => {
    const imgData = req.body.doodleUrl;
    const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    const fileName = `uploads/doodle-${Date.now()}.png`;
    fs.writeFile(path.join(__dirname, 'public', fileName), base64Data, 'base64', async (err) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const doodle = new Doodle({ userId: req.userId, doodleUrl: fileName });
            await doodle.save();
            res.status(201).send(doodle);
        }
    });
});

app.get('/doodles', authenticate, async (req, res) => {
    const doodles = await Doodle.find({ userId: req.userId });
    res.json(doodles);
});

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
