import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";

class MyLoans {
  sendMenu(msg: TelegramBot.Message) {
    bot.sendMessage(msg.chat.id, "loans menu");
  }
}

const myLoansButtonHandler = new MyLoans();
export default myLoansButtonHandler;
