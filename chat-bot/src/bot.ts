import TelegramBot from "node-telegram-bot-api";

export enum PersistentMenuButton {
  MyLoans = "My Loans 💸",
  Profile = "Profile 👤",
  HowItWorks = "How it Works 🙋",
  Option4 = "Option 4",
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});
