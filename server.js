const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

const doodleSchema = new mongoose.Schema({
    prompt: String,
    doodleUrl: String,
    date: { type: Date, default: Date.now }
});

const Doodle = mongoose.model('Doodle', doodleSchema);

// Routes
app.get('/prompt', async (req, res) => {
    const prompt = "Draw something that makes you happy"; // Replace with logic to fetch daily prompt
    res.json({ prompt });
});

app.post('/doodle', async (req, res) => {
    const imgData = req.body.doodleUrl;
    const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    const fileName = `uploads/doodle-${Date.now()}.png`;
    fs.writeFile(path.join(__dirname, 'public', fileName), base64Data, 'base64', async (err) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const doodle = new Doodle({ doodleUrl: fileName });
            await doodle.save();
            res.status(201).send(doodle);
        }
    });
});

app.get('/doodles', async (req, res) => {
    const doodles = await Doodle.find();
    res.json(doodles);
});

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
