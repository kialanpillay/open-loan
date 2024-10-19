import { bot, PersistentMenuButton } from "./bot";
import myLoansButtonHandler from "./button_handlers/my-loans";

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  switch (msg.text) {
    case PersistentMenuButton.MyLoans:
      myLoansButtonHandler.sendMenu(msg);
      break;
    case PersistentMenuButton.HowItWorks:
      bot.sendMessage(chatId, "...");
      bot.sendMessage(
        chatId,
        `<b>${PersistentMenuButton.HowItWorks}</b>\n\nGet funded today by:\n\n1. Giving us some information about your loan.\n2. Supplying your Open Payments wallet address.\n3. Selecting and agreeing to your repayment plan\n\nAs simple as that!`
      );
      break;
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `Welcome BOSS! 🤑\n\n<b>Let's get you financed.</b>\n\nNeed some help filling a new purchase order? How about a new piece of machinery for your business? Open Loan's got you covered.\n\nTap <b>${PersistentMenuButton.MyLoans}</b> to get started`;
  const options = {
    reply_markup: {
      keyboard: [
        [
          { text: PersistentMenuButton.MyLoans },
          { text: PersistentMenuButton.HowItWorks },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  bot.sendMessage(chatId, welcomeMessage, {
    ...options,
    parse_mode: "HTML",
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const msg = callbackQuery.message;

  switch (data) {
    case "new_loan":
      await myLoansButtonHandler.newLoan(msg);
      break;
    case "manage_loans":
      await myLoansButtonHandler.manageLoans(msg);
      break;
    case data.match(/^manage_loan_.+/)?.input:
      await myLoansButtonHandler.loanDetails(callbackQuery);
      break;
    case data.match(/^variable_repayments_.+/)?.input:
      await myLoansButtonHandler.variableRepaymentConversationHandler(
        callbackQuery
      );
      break;
    case data.match(/^fixed_repayments_.+/)?.input:
      await myLoansButtonHandler.fixedRepaymentConversationHandler(
        callbackQuery
      );
      break;
    case data.match(/^agree_.+/)?.input:
      await myLoansButtonHandler.agreeToLoan(callbackQuery);
      break;
    case data.match(/^pay_back_some_now.+/)?.input:
      await myLoansButtonHandler.payBackSomeNow(callbackQuery);
    default:
      break;
  }
});
