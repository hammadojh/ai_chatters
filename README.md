# Multi-Agent Chat Application

A sophisticated chat application that enables conversations between multiple AI agents powered by OpenAI's GPT-4 and Anthropic's Claude. The application features text-to-speech capabilities, personality customization, and dynamic model switching.

## Features

- 🤖 Multiple AI agents that can interact with each other
- 🔄 Dynamic switching between OpenAI and Anthropic models
- 🎭 Customizable agent personalities
- 🗣️ Text-to-speech capabilities using OpenAI's TTS API
- 📝 Conversation context management
- 📊 Comprehensive logging system

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- Anthropic API key

## Installation

1. Clone the repository:
git clone <repository-url>
cd <project-directory>
2. Install dependencies:
bash
npm install
3. Create a `.env` file in the root directory with the following variables:
OPENAI_API_KEY=your_openai_api_key  
ANTHROPIC_API_KEY=your_anthropic_api_key

## Usage

1. Start the server:
bash
npm start

2. Open your browser and navigate to `http://localhost:3000`

## Available Personalities

The application comes with several pre-defined personality types for agents:
- Witty
- Formal
- Casual
- Poetic
- Nerdy
- Philosophical
- Dramatic
- Optimistic
- Mysterious
- Rebellious


## Technical Details

- Built with Node.js
- Uses HTTP server for backend
- Supports streaming responses
- Implements conversation history management
- Features comprehensive error handling and logging

## Logging

The application maintains detailed logs of:
- Chat requests
- API calls
- Model changes
- Personality changes
- Speech requests
- Errors

Logs are stored in the `logs` directory with daily rotation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
