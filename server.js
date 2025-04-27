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

// Your personal information (update this with your details)
const personalInfo = {
    name: 'Your Name',
    occupation: 'Web Developer',
    hobbies: ['coding', 'gaming', 'reading'],
    education: 'B.S. in Computer Science from Example University',
    projects: [
        { name: 'Fluid Dynamics Game', description: 'A canvas-based game with stick figure animations.' },
        { name: 'NFT Marketplace', description: 'A platform for creating and trading NFTs.' }
    ],
    contact: 'email@example.com'
};

// Generate prompt for Gemini
function createPrompt(message) {
    return `
You are a chatbot on my personal website, designed to answer questions about me based on the following information:
- Name: ${personalInfo.name}
- Occupation: ${personalInfo.occupation}
- Hobbies: ${personalInfo.hobbies.join(', ')}
- Education: ${personalInfo.education}
- Projects: ${personalInfo.projects.map(p => `${p.name}: ${p.description}`).join('; ')}
- Contact: ${personalInfo.contact}

Answer the user's question: "${message}" in a friendly, concise manner. If the question is unrelated to the provided information, say: "I'm here to talk about me! Ask something about my life or work."
`;
}

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const prompt = createPrompt(message);
        const result = await model.generateContent(prompt);
        const reply = result.response.text();
        res.json({ reply });
    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});