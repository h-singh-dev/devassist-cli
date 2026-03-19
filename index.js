import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const provider = process.env.AI_PROVIDER || 'groq';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const conversationHistory = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function chatWithClaude(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are DevAssist, an expert AI coding assistant built by Harshit Singh.
    You help developers write better code, debug issues, explain concepts, and review code.
    You are precise, professional, and always provide working code examples.
    When reviewing code, point out bugs, improvements, and best practices.
    Format code blocks properly and explain your reasoning clearly.`,
    messages: conversationHistory,
  });

  const assistantMessage = response.content[0].text;
  conversationHistory.push({ role: 'assistant', content: assistantMessage });
  return assistantMessage;
}

async function chatWithGemini(userMessage) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are DevAssist, an expert AI coding assistant built by Harshit Singh.
    You help developers write better code, debug issues, explain concepts, and review code.`,
  });

  const historyForGemini = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history: historyForGemini });
  conversationHistory.push({ role: 'user', content: userMessage });

  const result = await chat.sendMessage(userMessage);
  const assistantMessage = result.response.text();

  conversationHistory.push({ role: 'assistant', content: assistantMessage });
  return assistantMessage;
}

async function chatWithGroq(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });

  const messages = [
    {
      role: 'system',
      content: `You are DevAssist, an expert AI coding assistant built by Harshit Singh.
      You help developers write better code, debug issues, explain concepts, and review code.
      You are precise, professional, and always provide working code examples.
      When reviewing code, point out bugs, improvements, and best practices.
      Format code blocks properly and explain your reasoning clearly.`,
    },
    ...conversationHistory,
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    max_tokens: 1024,
  });

  const assistantMessage = response.choices[0].message.content;
  conversationHistory.push({ role: 'assistant', content: assistantMessage });
  return assistantMessage;
}

async function chat(userMessage) {
  if (provider === 'claude') return await chatWithClaude(userMessage);
  if (provider === 'gemini') return await chatWithGemini(userMessage);
  return await chatWithGroq(userMessage);
}

async function processCommand(input) {
  const trimmed = input.trim();

  if (trimmed.startsWith('/review')) {
    const code = trimmed.replace('/review', '').trim();
    if (!code) return 'Please provide code to review. Usage: /review <your code>';
    return await chat(`Please review this code and provide detailed feedback on bugs, improvements, and best practices:\n\n${code}`);
  }

  if (trimmed.startsWith('/explain')) {
    const code = trimmed.replace('/explain', '').trim();
    if (!code) return 'Please provide code to explain. Usage: /explain <your code>';
    return await chat(`Please explain this code in simple terms, line by line if needed:\n\n${code}`);
  }

  if (trimmed.startsWith('/debug')) {
    const code = trimmed.replace('/debug', '').trim();
    if (!code) return 'Please provide code to debug. Usage: /debug <your code>';
    return await chat(`Please find and fix all bugs in this code, explain what was wrong:\n\n${code}`);
  }

  if (trimmed.startsWith('/refactor')) {
    const code = trimmed.replace('/refactor', '').trim();
    if (!code) return 'Please provide code to refactor. Usage: /refactor <your code>';
    return await chat(`Please refactor this code to be cleaner, more efficient and follow best practices:\n\n${code}`);
  }

  return await chat(trimmed);
}

async function main() {
  const providerLabel =
    provider === 'claude'
      ? chalk.magenta('Claude (Anthropic)')
      : provider === 'gemini'
      ? chalk.blue('Gemini (Google)')
      : chalk.yellow('Llama 3.3 (Groq)');

  console.log(chalk.cyan.bold('\n╔════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║       DevAssist CLI v1.0.0         ║'));
  console.log(chalk.cyan.bold('║   Your AI Coding Assistant         ║'));
  console.log(chalk.cyan.bold('║   Built by Harshit Singh           ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════╝\n'));

  console.log(chalk.yellow('AI Provider: ') + providerLabel);
  console.log(chalk.gray('Tip: Change AI_PROVIDER in .env to switch between claude, gemini and groq\n'));

  console.log(chalk.yellow('Available commands:'));
  console.log(chalk.green('  /review <code>    ') + '— Review your code');
  console.log(chalk.green('  /explain <code>   ') + '— Explain code in simple terms');
  console.log(chalk.green('  /debug <code>     ') + '— Find and fix bugs');
  console.log(chalk.green('  /refactor <code>  ') + '— Improve code quality');
  console.log(chalk.green('  /exit             ') + '— Exit DevAssist');
  console.log(chalk.yellow('\nOr just type any coding question directly.\n'));

  while (true) {
    const userInput = await question(chalk.blue.bold('\nYou → '));

    if (!userInput.trim()) continue;

    if (userInput.trim() === '/exit') {
      console.log(chalk.cyan.bold('\nGoodbye! Happy coding, Harshit!\n'));
      rl.close();
      process.exit(0);
    }

    try {
      console.log(chalk.gray('\nDevAssist is thinking...\n'));
      const response = await processCommand(userInput);
      console.log(chalk.green.bold('DevAssist → '));
      console.log(chalk.white(response));
    } catch (error) {
      if (error.status === 401) {
        console.log(chalk.red('Error: Invalid API key. Check your .env file.'));
      } else {
        console.log(chalk.red(`Error: ${error.message}`));
      }
    }
  }
}

main();