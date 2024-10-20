import TelegramBot from "node-telegram-bot-api";
import { TELEGRAM_BOT_TOKEN } from "../../shared/consts";

export enum PersistentMenuButton {
  MyLoans = "My Loans 💸",
  HowItWorks = "How it Works 🙋",
}

export const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: true,
});
