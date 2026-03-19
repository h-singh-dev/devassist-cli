# DevAssist CLI 🤖

An AI-powered command-line coding assistant built with Node.js.
Supports multiple AI providers: Claude (Anthropic), Gemini (Google), and Llama 3.3 (Groq).

## Built By
Harshit Singh — BCA AI/ML Student at Sharda University

## Features
- Ask any coding question directly
- /review — Review your code for bugs and improvements
- /explain — Explain code in simple terms
- /debug — Find and fix bugs in your code
- /refactor — Improve code quality and structure
- Switch between Claude, Gemini and Groq with one line in .env

## Tech Stack
- Node.js
- Anthropic Claude API
- Google Gemini API
- Groq API (Llama 3.3)
- Chalk (terminal styling)
- Dotenv (environment management)

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` file with your API keys
4. Set `AI_PROVIDER` to `claude`, `gemini` or `groq`
5. Run `node index.js`

## Environment Variables
```
ANTHROPIC_API_KEY=your-key-here
GEMINI_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
AI_PROVIDER=groq
```

## License
MIT