import TelegramBot from "node-telegram-bot-api";
import { bot, PersistentMenuButton } from "../bot";

class MyLoans {
  sendMenu(msg: TelegramBot.Message) {
    bot.sendMessage(msg.chat.id, "...");

    const text = `<b>${PersistentMenuButton.MyLoans}</b>\n\nYou don't have any loans with Open Loan!\n\nTap 'New Loan' to get started.`;
    const options = {
      reply_markup: {
        inline_keyboard: [[{ text: "New Loan", callback_data: "new_loan" }]],
      },
    };

    bot.sendMessage(msg.chat.id, text, { ...options, parse_mode: "HTML" });
  }

  newLoanConversationHandler(msg: TelegramBot.Message) {
    bot.sendMessage(msg.chat.id, "Let's start a new loan process!");

    const askLoanAmount = () => {
      bot.sendMessage(
        msg.chat.id,
        "Please enter the loan amount you need in USD:"
      );
      bot.once("message", (msg) => {
        const loanAmount = msg.text;
        const isValidNumber = /^\d+(\.\d+)?$/.test(loanAmount);
        if (isValidNumber) {
          askLoanReason(loanAmount);
        } else {
          bot.sendMessage(
            msg.chat.id,
            "Invalid input. Please enter a valid number for the loan amount."
          );
          askLoanAmount(); // Re-prompt for the loan amount
        }
      });
    };

    const askLoanReason = (loanAmount) => {
      bot.sendMessage(msg.chat.id, "Please enter the reason for the loan:");
      bot.once("message", (msg) => {
        const loanReason = msg.text;
        askWalletAddress(loanAmount, loanReason);
      });
    };

    const askWalletAddress = (loanAmount, loanReason) => {
      bot.sendMessage(
        msg.chat.id,
        "Please enter your Open Payments wallet address:"
      );
      bot.once("message", (msg) => {
        const walletAddress = msg.text;
        bot.sendMessage(
          msg.chat.id,
          `Thank you! You've entered:\nLoan Amount: ${loanAmount}\nLoan Reason: ${loanReason}\nWallet Address: ${walletAddress}\n\nExiting the conversation.`
        );
      });
    };

    askLoanAmount();
  }
}

const myLoansButtonHandler = new MyLoans();
export default myLoansButtonHandler;
