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
    username: { type: String, required: true },
    prompt: String,
    doodleUrl: String,
    date: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        comment: String,
        date: { type: Date, default: Date.now }
    }]
});




const Doodle = mongoose.model('Doodle', doodleSchema);

// Authentication routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Regular expression to validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

    if (!passwordRegex.test(password)) {
        // If the password does not meet the criteria, return an error response
        return res.status(400).send('Password must be at least 6 characters long, with at least one number, one uppercase letter, and one lowercase letter.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });

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

//List of daily prompts
const prompts = [
    " A self-portrait ",
    " Your favorite animal ",
    " A landscape ",
    " A portrait of a friend ",
    " An abstract design ",
    " Your favorite food ",
    " A city skyline ",
    " A mythical creature ",
    " Your dream home ",
    " A flower bouquet ",
    " A character from your favorite book ",
    " A forest scene ",
    " A still life of objects on your desk ",
    " A favorite memory ",
    " A vehicle ",
    " A superhero ",
    " An underwater scene ",
    " A family member ",
    " A sunset ",
    " Your pet or a friend’s pet ",
    " A scene from a dream ",
    " A famous landmark ",
    " A tree ",
    " A street view from your neighborhood ",
    " A favorite piece of clothing ",
    " A sports scene ",
    " An instrument ",
    " A planet or space scene ",
    " A beach scene ",
    " A mountain range ",
    " A piece of jewelry ",
    " A garden ",
    " A portrait of a historical figure ",
    " A robot ",
    " A surreal scene ",
    " A scene from your favorite movie ",
    " A mythical landscape ",
    " A child playing ",
    " A close-up of an eye ",
    " A bird ",
    " A pattern ",
    " A vintage object ",
    " A rainy day ",
    " A character from your favorite TV show ",
    " A lighthouse ",
    " An animal in a human-like pose ",
    " A favorite building ",
    " A desert scene ",
    " A scene from a fairytale ",
    " An autumn scene ",
    " A spaceship ",
    " A person in action (dancing, running, etc.) ",
    " A peaceful scene ",
    " A hot air balloon ",
    " A pirate ",
    " A map of an imaginary place ",
    " A butterfly ",
    " A parade ",
    " A bicycle ",
    " A portrait of your favorite celebrity ",
    " A carnival or circus ",
    " A scene from history ",
    " A farm ",
    " An insect ",
    " A close-up of hands ",
    " A winter scene ",
    " A tropical island ",
    " A portrait of a fictional character ",
    " A fashion design ",
    " A park ",
    " A nighttime scene ",
    " A fairy ",
    " A book cover ",
    " A character in a costume ",
    " A mask ",
    " A sci-fi scene ",
    " A festival ",
    " A bridge ",
    " A musical performance ",
    " A mermaid ",
    " A machine or gadget ",
    " A scene with animals interacting ",
    " A busy marketplace ",
    " A close-up of a leaf ",
    " A scene from your favorite childhood story ",
    " A dragon ",
    " A portrait of your favorite athlete ",
    " A scene with strong shadows ",
    " A carnival mask ",
    " A family gathering ",
    " A parade float ",
    " A close-up of a texture ",
    " A fireworks display ",
    " A historical event ",
    " A pirate ship ",
    " A circus performer ",
    " A portrait of your favorite artist ",
    " A magical object ",
    " A flower close-up ",
    " A waterfall ",
    " A scene from a musical ",
    " A mountain trail ",
    " A forest animal ",
    " A flying creature ",
    " A character from mythology ",
    " A library or bookstore ",
    " A city park ",
    " A scene with rainbows ",
    " A sports team ",
    " A market stall ",
    " A field of flowers ",
    " A city street at night ",
    " A train ",
    " A vintage car ",
    " A character in a fantasy world ",
    " A snowy landscape ",
    " A gothic scene ",
    " A witch or wizard ",
    " A castle ",
    " A portrait of someone laughing ",
    " A scene with reflections ",
    " A UFO ",
    " A medieval scene ",
    " A jungle ",
    " A character in armor ",
    " A still life with fruit ",
    " A quiet village ",
    " A cozy cabin ",
    " A warrior ",
    " A bakery or cafe ",
    " A whimsical creature ",
    " A market in a foreign country ",
    " A scene with fog ",
    " A monument ",
    " A sunset over the water ",
    " A vintage object ",
    " A steampunk scene ",
    " A character from folklore ",
    " A superhero team ",
    " A carnival ride ",
    " A scene in a mirror ",
    " A portrait of someone crying ",
    " A bridge at sunset ",
    " A futuristic city ",
    " A deserted island ",
    " A group of people ",
    " A library ",
    " A scene with flying objects ",
    " A portrait with unusual lighting ",
    " A surreal landscape ",
    " A character with wings ",
    " A cozy living room ",
    " A fantasy castle ",
    " A street vendor ",
    " A quiet place ",
    " A neon sign ",
    " A portrait in profile ",
    " A scene in space ",
    " A nighttime sky ",
    " A carousel ",
    " A close-up of an animal ",
    " A fire-breathing creature ",
    " A vintage portrait ",
    " A carnival game ",
    " A musician ",
    " A pirate treasure map ",
    " A character in a suit of armor ",
    " A cityscape ",
    " A flying vehicle ",
    " A mountain lake ",
    " A portrait with a hat ",
    " A surreal portrait ",
    " A group of animals ",
    " A magical scene ",
    " A fantasy creature ",
    " A close-up of a face ",
    " A scene with clouds ",
    " A person in traditional clothing ",
    " A floral design ",
    " A scene in the rain ",
    " A fantasy landscape ",
    " A character in motion ",
    " A futuristic vehicle ",
    " A scene with water ",
    " A historical building ",
    " A desert animal ",
    " A medieval market ",
    " A portrait of someone reading ",
    " A dragonfly ",
    " A character in the wind ",
    " A person in the snow ",
    " A scene with fire ",
    " A street musician ",
    " A character with a weapon ",
    " A botanical garden ",
    " A surreal animal ",
    " A character in the shadows ",
    " A close-up of a hand ",
    " A scene from a festival ",
    " A nighttime city scene ",
    " A superhero battle ",
    " A portrait in black and white ",
    " A flying animal ",
    " A mystical scene ",
    " A reflection in water ",
    " A scene in a forest ",
    " A tropical animal ",
    " A portrait with a dramatic expression ",
    " A medieval building ",
    " A character with a sword ",
    " A desert landscape ",
    " A moonlit scene ",
    " A character in a cape ",
    " A scene with strong contrasts ",
    " A colorful pattern ",
    " A character in armor ",
    " A scene with birds ",
    " A vintage scene ",
    " A character with an unusual outfit ",
    " A landscape with mountains ",
    " A quiet alley ",
    " A surreal object ",
    " A character with glowing eyes ",
    " A forest path ",
    " A scene with unusual lighting ",
    " A portrait of a child ",
    " A dragon guarding treasure ",
    " A character with a magical object ",
    " A whimsical animal ",
    " A peaceful garden ",
    " A close-up of an eye ",
    " A flying creature ",
    " A carnival mask ",
    " A futuristic scene ",
    " A fantasy character ",
    " A flower garden ",
    " A scene at sunrise ",
    " A portrait of a historical figure ",
    " A tropical scene ",
    " A character in a dramatic pose ",
    " A beach at sunset ",
    " A character with a staff ",
    " A scene with lightning ",
    " A portrait with a bold color scheme ",
    " A mythical animal ",
    " A city at night ",
    " A fantasy battle ",
    " A character in a fantasy outfit ",
    " A street scene ",
    " A close-up of a flower ",
    " A moonlit landscape ",
    " A character with a mask ",
    " A medieval castle ",
    " A character in a peaceful pose ",
    " A scene in a storm ",
    " A portrait of a musician ",
    " A character with a weapon ",
    " A scene with stars ",
    " A surreal cityscape ",
    " A character in a fantasy world ",
    " A still life with objects ",
    " A street vendor ",
    " A character in a hat ",
    " A scene with reflections ",
    " A character in armor ",
    " A mountain range ",
    " A peaceful forest ",
    " A character with wings ",
    " A colorful landscape ",
    " A moonlit sea ",
    " A character in a dramatic scene ",
    " A scene with shadows ",
    " A character in a fantasy scene ",
    " A character with glowing eyes ",
    " A city street at night ",
    " A scene with fog ",
    " A character in a mystical world ",
    " A peaceful garden ",
    " A character with a magical object ",
    " A mountain lake ",
    " A character in a whimsical outfit ",
    " A scene with rainbows ",
    " A character in a surreal scene ",
    " A character in a fantasy landscape ",
    " A character with an unusual weapon ",
    " A night sky ",
    " A scene with flying creatures ",
    " A whimsical landscape ",
    " A character in a surreal world ",
    " A character with a mystical aura ",
    " A scene with glowing objects ",
    " A character in a peaceful setting ",
    " A character in a dramatic pose ",
    " A character in a futuristic world ",
    " A scene with water reflections ",
    " A character in a whimsical scene ",
    " A character with an unusual object ",
    " A scene with colorful lighting ",
    " A character in a dreamlike world ",
    " A character with a magical weapon ",
    " A scene with stars ",
    " A character in a historical setting ",
    " A character with glowing eyes ",
    " A character in a dramatic scene ",
    " A character with a mystical object ",
    " A scene with unusual lighting ",
    " A character in a futuristic scene ",
    " A character in a whimsical outfit ",
    " A scene with glowing objects ",
    " A character in a surreal landscape ",
    " A character with an unusual weapon ",
    " A character in a peaceful setting ",
    " A scene with water reflections ",
    " A character in a dreamlike world ",
    " A character with glowing eyes ",
    " A character in a whimsical scene ",
    " A character with a mystical aura ",
    " A scene with flying creatures ",
    " A character in a fantasy world ",
    " A character with an unusual outfit ",
    " A scene with colorful lighting ",
    " A character in a whimsical world ",
    " A character with a magical object ",
    " A scene with unusual lighting ",
    " A character in a historical setting ",
    " A character with glowing objects ",
    " A character in a surreal scene ",
    " A scene with stars ",
    " A character in a mystical world ",
    " A character with an unusual weapon ",
    " A character in a dreamlike setting ",
    " A scene with reflections ",
    " A character in a whimsical landscape ",
    " A character with glowing eyes ",
    " A character in a peaceful setting ",
    " A scene with flying objects ",
    " A character in a fantasy scene ",
    " A character in a whimsical outfit ",
    " A scene with glowing lights ",
    " A character in a surreal world ",
    " A character with a mystical object ",
    " A scene with colorful lighting ",
    " A character in a futuristic world ",
    " A character in a whimsical landscape ",
    " A character with a magical weapon ",
    " A scene with reflections ",
    " A character in a peaceful world ",
    " A character with an unusual weapon ",
    " A character in a surreal setting ",
    " A scene with stars ",
    " A character in a historical setting ",
    " A character with glowing eyes ",
    " A scene with flying creatures ",
    " A character in a whimsical world ",
    " A character with an unusual object ",
    " A scene with colorful lighting ",
    " A character in a dreamlike world ",
    " A character with a mystical aura ",
    " A scene with glowing objects ",
    " A character in a peaceful setting ",
    " A character in a fantasy landscape ",
    " A character with glowing eyes ",
    " A scene with reflections ",
    " A character in a whimsical outfit ",
    " A character with a magical object "
]



// Routes
function getTodayPrompt() {
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const promptIndex = dayOfYear % prompts.length; // Rotate through prompts
    return prompts[promptIndex];
}



app.get('/prompt', authenticate, (req, res) => {
    const prompt = getTodayPrompt();
    res.json({ prompt });
});

app.post('/doodle', authenticate, async (req, res) => {
    const imgData = req.body.doodleUrl;
    const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    const fileName = `uploads/doodle-${Date.now()}.png`;
    const user = await User.findById(req.userId);

    fs.writeFile(path.join(__dirname, 'public', fileName), base64Data, 'base64', async (err) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const doodle = new Doodle({
                userId: req.userId,
                username: user.username,
                doodleUrl: fileName
            });
            await doodle.save();
            res.status(201).send(doodle);
        }
    });
});

app.post('/doodle/:id/like', authenticate, async (req, res) => {
    const doodleId = req.params.id;
    const userId = req.userId;

    const doodle = await Doodle.findById(doodleId);
    if (!doodle) {
        return res.status(404).send('Doodle not found');
    }

    if (doodle.likedBy.includes(userId)) {
        return res.status(400).send('Already liked');
    }

    doodle.likes += 1;
    doodle.likedBy.push(userId);
    await doodle.save();

    res.json({ likes: doodle.likes });
});

// Add a comment to a doodle
app.post('/doodle/:id/comment', authenticate, async (req, res) => {
    try {
        const doodleId = req.params.id;
        const { comment } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).send('Comment cannot be empty');
        }

        const doodle = await Doodle.findById(doodleId);
        if (!doodle) {
            return res.status(404).send('Doodle not found');
        }

        const user = await User.findById(req.userId);

        const newComment = {
            userId: req.userId,
            username: user.username,
            comment: comment,
            date: new Date()
        };

        doodle.comments.push(newComment);
        await doodle.save();

        res.status(201).send(doodle);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// Get comments for a doodle
app.get('/doodle/:id/comments', authenticate, async (req, res) => {
    try {
        const doodleId = req.params.id;
        const doodle = await Doodle.findById(doodleId).select('comments');

        if (!doodle) {
            return res.status(404).send('Doodle not found');
        }

        res.status(200).json(doodle.comments);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});




app.get('/doodles', authenticate, async (req, res) => {
    const doodles = await Doodle.find().populate('userId', 'username');  // Populate username
    res.json(doodles);
});



app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});