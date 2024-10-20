import TelegramBot from "node-telegram-bot-api";

export enum PersistentMenuButton {
  MyLoans = "My Loans 💸",
  HowItWorks = "How it Works 🙋",
}

export const bot = new TelegramBot(
  "7870994566:AAGkM6y9yP8jMvfIejOTtIPM0QIQAFo1gns",
  {
    polling: true,
  }
);
