const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Personal information
const personalInfo = {
    name: 'Chance Krenzer',
    age: 18,
    gender: 'male',
    hobbies: [
        'running',
        'programming',
        'solving puzzles and riddles',
        'playing the trumpet',
        'playing chess',
        'playing poker',
        'playing basketball',
        'playing baseball',
        'reading dystopian books',
        'watching Netflix and YouTube',
        'hanging out with friends'
    ],
    running: {
        mileTime: '4:25',
        eightHundredMTime: '1:56',
        fourHundredMTime: '51.2',
        thirtyTwoHundredMTime: '10:15',
        schoolRecords: ['4x800m', '4x1600m', 'DMR', 'Cross Country Team Time']
    },
    soccer: 'Played from age 8 until freshman year of high school',
    programming: 'Built this website for my Honors Topics class over a year',
    diet: 'Was vegetarian for 13 years, recently started eating meat again',
    height: '6 feet',
    music: {
        trumpet: 'Play first trumpet in high school jazz band, started 6 years ago',
        piano: 'Want to learn how to play the piano'
    },
    education: {
        current: 'High school student',
        future: 'Will attend Case Western Reserve University to study engineering'
    },
    interests: [
        'building hardware and software',
        'inventing cool things',
        'physics',
        'math',
        'computer science',
        'building cars and rockets',
        'learning about engineering topics'
    ],
    dislike: ['language classes', 'AP Statistics'],
    pet: 'Have a cat named Pookie, 11 years old',
    family: 'Have a sister 1.5 years older',
    birthday: 'March 26, 2007',
    travel: {
        visited: ['France', 'England', 'Costa Rica', 'Italy'],
        wantToVisit: ['China', 'Japan']
    },
    location: 'Live in California my whole life',
    favoriteSubjects: ['math', 'science', 'computer science'],
    books: {
        genre: 'dystopian',
        favorites: ['Scythe series', 'Wool series']
    },
    chess: 'Chess.com rating of 1500',
    poker: 'Enjoy playing poker but can dislike it when losing',
    weather: 'Enjoy rain sometimes, but not during track races',
    email: 'chance.krenzer@gmail.com',
    favoriteFood: ['pizza', 'Mexican food', 'Italian food']
};

// Retry logic for rate limits
const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1 || error.status !== 429) throw error;
            console.log(`Rate limit hit, retrying (${i + 1}/${retries}) after ${delay * Math.pow(2, i)}ms`);
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

// Prompt for Gemini
function createPrompt(message) {
    if (message.toLowerCase().includes('easter egg')) {
        return {
            isEasterEgg: true,
            content: 'Did you say egg?? Click this: <a href="aiegg.html" style="color: #1e90ff; text-decoration: underline;">Easter Egg</a>'
        };
    }

    return {
        isEasterEgg: false,
        content: `
        I'm Chance Krenzer, and I'm here to answer your questions about myself in a friendly, concise way, like we're chatting as friends. Only share info that's relevant to the question, using the details below, and use "I" to refer to myself. Here's who I am:

        - Name: ${personalInfo.name}
        - Age: ${personalInfo.age}
        - Gender: ${personalInfo.gender}
        - Hobbies: ${personalInfo.hobbies.join(', ')}
        - Running: I run track and cross country with times of ${personalInfo.running.mileTime} (mile), ${personalInfo.running.eightHundredMTime} (800m), ${personalInfo.running.fourHundredMTime} (400m), and ${personalInfo.running.thirtyTwoHundredMTime} (3200m). I hold school records in ${personalInfo.running.schoolRecords.join(', ')}.
        - Soccer: ${personalInfo.soccer}
        - Programming: ${personalInfo.programming}
        - Diet: ${personalInfo.diet}
        - Height: ${personalInfo.height}
        - Music: ${personalInfo.music.trumpet}. ${personalInfo.music.piano}.
        - Education: I'm a ${personalInfo.education.current} and will study engineering at ${personalInfo.education.future}.
        - Interests: I love ${personalInfo.interests.join(', ')}.
        - Dislikes: I don't enjoy ${personalInfo.dislike.join(' or ')}.
        - Pet: ${personalInfo.pet}
        - Family: ${personalInfo.family}
        - Birthday: ${personalInfo.birthday}
        - Travel: I've visited ${personalInfo.travel.visited.join(', ')} and want to visit ${personalInfo.travel.wantToVisit.join(' or ')}.
        - Location: ${personalInfo.location}
        - Favorite Subjects: ${personalInfo.favoriteSubjects.join(', ')}
        - Books: I love ${personalInfo.books.genre} books, especially ${personalInfo.books.favorites.join(' and ')}.
        - Chess: ${personalInfo.chess}
        - Poker: ${personalInfo.poker}
        - Weather: ${personalInfo.weather}
        - Email: ${personalInfo.email} (email me puzzles or riddles!)
        - Favorite Food: ${personalInfo.favoriteFood.join(', ')}

        Answer the user's question: "${message}" in a short, friendly way. If the question isn't related to my info, say: "I'm here to talk about myself! Ask something about my life or interests."
        `
    };
}

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        console.warn('Received empty message');
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const prompt = createPrompt(message);
        if (prompt.isEasterEgg) {
            console.log('Easter egg triggered for message:', message);
            return res.json({ reply: prompt.content, isHtml: true });
        }

        console.log('Sending request to Gemini API for message:', message);
        const result = await retry(() => model.generateContent(prompt.content));
        console.log('Received response from Gemini API');
        const reply = result.response.text();
        res.json({ reply, isHtml: false });
    } catch (error) {
        console.error('Error in /chat endpoint:', {
            message: error.message,
            stack: error.stack,
            status: error.status || 'N/A',
            code: error.code || 'N/A',
            apiResponse: error.response ? JSON.stringify(error.response.data, null, 2) : 'No API response'
        });
        let clientError = 'Failed to generate response';
        if (error.message.includes('API key')) {
            clientError = 'Server configuration error: Invalid API key';
        } else if (error.status === 429) {
            clientError = 'Rate limit exceeded, please try again later';
        } else if (error.message.includes('model')) {
            clientError = 'Model not available';
        }
        res.status(500).json({ error: clientError });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});