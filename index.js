const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const app = express();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

// Rizz, Roast, Trivia, Games
const rizzLines = [...Array(100).keys()].map(i => `You're hotter than my phone when it’s on 1% and I can’t find the charger. (${i+1})`);
const roastLines = [...Array(100).keys()].map(i => `You're like a cloud. When you disappear, it's a beautiful day. (${i+1})`);
const triviaQuestions = [...Array(50).keys()].map(i => `Trivia Question ${i+1}: What is the answer to life, the universe, and everything?`);
const gamesList = [...Array(50).keys()].map(i => `Game Prompt ${i+1}: Do 10 pushups or answer a hard truth.`);

const commands = {
    rizz: () => rizzLines[Math.floor(Math.random() * rizzLines.length)],
    roast: () => roastLines[Math.floor(Math.random() * roastLines.length)],
    trivia: () => triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)],
    game: () => gamesList[Math.floor(Math.random() * gamesList.length)],
    menu: () => `🧠 .rizz
🔥 .roast
🎯 .trivia
🎮 .game
📥 .yt <url>
👥 .tagall
👑 .promote
💀 .kick`
};

client.on('message', async msg => {
    if (!msg.body.startsWith('.')) return;
    const command = msg.body.slice(1).split(" ")[0].toLowerCase();
    const args = msg.body.slice(command.length + 2).trim();

    // Handle YouTube downloader
    if (command === "yt") {
        return msg.reply("YouTube download not supported in this version.");
    }

    // Tag all (group only)
    if (command === "tagall" && msg.isGroupMsg) {
        const chat = await msg.getChat();
        let text = "*Tagging all members:*\n";
        let mentions = [];
        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${contact.number} `;
        }
        return chat.sendMessage(text, { mentions });
    }

    // Group commands (admin only)
    if (["kick", "promote"].includes(command) && msg.isGroupMsg) {
        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const senderId = sender.id._serialized;
        const isAdmin = chat.participants.find(p => p.id._serialized === senderId && p.isAdmin);

        if (!isAdmin) return msg.reply("Only admins can use this command.");

        const quoted = msg.hasQuotedMsg ? await msg.getQuotedMessage() : null;
        const targetId = quoted ? quoted.author : null;

        if (!targetId) return msg.reply("Reply to someone's message to use this command.");

        if (command === "kick") await chat.removeParticipants([targetId]);
        if (command === "promote") await chat.promoteParticipants([targetId]);
        return msg.reply(`${command}ed successfully.`);
    }

    // Normal commands
    if (commands[command]) {
        return msg.reply(commands[command]());
    }
});

client.initialize();

// Keep-alive server (for Railway or Replit)
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("Web server running."));
