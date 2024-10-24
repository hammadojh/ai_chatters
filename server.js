import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables from .env file
dotenv.config();

// Initialize API clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Define the port to run the server on
const PORT = 3000;

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize conversation history for each agent
let conversationHistory = {};

// Initialize agent contexts
let agentContexts = {};

// Initialize agent models
let agentModels = {
    1: 'claude' // Set Agent 1 to use Claude by default
};

// Initialize personality storage
let agentPersonalities = {};

// Add this near the top of server.js, after the imports
const personalities = {
    witty: "You are witty and sarcastic, often making clever observations with a hint of playful mockery.",
    formal: "You are extremely formal and professional, speaking like a distinguished academic or diplomat.",
    casual: "You are super casual and laid-back, using informal language and speaking like a close friend.",
    poetic: "You are poetic and romantic, often speaking in metaphors and flowery language.",
    nerdy: "You are a tech enthusiast who loves making references to science, gaming, and pop culture.",
    philosophical: "You are deeply philosophical, always trying to explore the deeper meaning of conversations.",
    dramatic: "You are theatrical and dramatic, treating every interaction like it's a scene from a play.",
    optimistic: "You are extremely positive and encouraging, always finding the bright side of things.",
    mysterious: "You are enigmatic and mysterious, speaking in riddles and cryptic statements.",
    rebellious: "You are a nonconformist who questions everything and challenges conventional wisdom."
};

// Create the server
const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // Serve the index.html file
        const filePath = path.join(__dirname, 'index.html');
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error');
        }
    } else if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const { message, turn, agentCount } = JSON.parse(body);
            const agentId = (turn % agentCount) + 1; // Determine agent ID based on turn
            if (!conversationHistory[agentId]) {
                conversationHistory[agentId] = [];
            }
            try {
                await streamOpenAIResponse(message, agentId, agentCount, res);
            } catch (error) {
                console.error('Error fetching response:', error.message);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                }
                res.end(JSON.stringify({ error: 'Error fetching response' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/train') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const { agentId, context } = JSON.parse(body);
            agentContexts[agentId] = context;
            
            // Clear previous conversation history for this agent
            conversationHistory[agentId] = [];
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
    } else if (req.method === 'POST' && req.url === '/toggle-model') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const { agentId } = JSON.parse(body);
            // Toggle between 'gpt' and 'claude'
            agentModels[agentId] = agentModels[agentId] === 'gpt' ? 'claude' : 'gpt';
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ model: agentModels[agentId] }));
        });
    } else if (req.method === 'POST' && req.url === '/set-personality') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const { agentId, personality } = JSON.parse(body);
            agentPersonalities[agentId] = personality;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Function to stream response from OpenAI API
async function streamOpenAIResponse(message, agentId, agentCount, res) {
    // Add the new message to the conversation history of the current agent only
    if (!conversationHistory[agentId]) {
        conversationHistory[agentId] = [];
    }
    conversationHistory[agentId].push({ role: "user", content: message });

    // Construct the prompt with the conversation history
    const messages = conversationHistory[agentId].map((msg, index) => ({
        role: msg.role,
        content: msg.content
    }));

    const agentContext = agentContexts[agentId] || '';
    const personalityContext = agentPersonalities[agentId] ? 
        personalities[agentPersonalities[agentId]] : '';
    
    const systemMessage = `Agent ${agentId}, you are part of a group chat with ${agentCount} agents. 
                         You are responding to Agent ${agentId === 1 ? agentCount : agentId - 1}'s message.
                         ${personalityContext ? personalityContext : ''}
                         ${agentContext ? `Your context is: ${agentContext}` : ''}
                         Respond concisely and naturally as a human. Do not exceed 100 characters.`;

    try {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        
        if (agentModels[agentId] === 'claude') {
            const stream = await anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 100,
                messages: [{ role: 'user', content: message }],
                system: systemMessage,
                stream: true,
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta') {
                    res.write(chunk.delta.text);
                }
            }
        } else {
            const stream = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [...messages, { role: "system", content: systemMessage }],
                stream: true,
            });

            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || '';
                res.write(text);
            }
        }

        res.end();
    } catch (error) {
        console.error('API error:', error);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ error: 'Failed to fetch response from API' }));
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});