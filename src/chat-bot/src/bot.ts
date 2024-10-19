import TelegramBot from "node-telegram-bot-api";

export enum PersistentMenuButton {
  MyLoans = "My Loans 💸",
  HowItWorks = "How it Works 🙋",
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});
