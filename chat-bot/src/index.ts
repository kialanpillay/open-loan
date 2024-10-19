import { bot, PersistentMenuButton } from "./bot";
import myLoansButtonHandler from "./button_handlers/my-loans";

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  switch (msg.text) {
    case PersistentMenuButton.MyLoans:
      myLoansButtonHandler.sendMenu(msg);
      break;
    case PersistentMenuButton.Profile:
      bot.sendMessage(chatId, "Here is your profile information...");
      break;
    case PersistentMenuButton.HowItWorks:
      bot.sendMessage(chatId, "Here's how it works...");
      break;
    case PersistentMenuButton.Option4:
      bot.sendMessage(chatId, "Option 4 selected...");
      break;
    default:
      const options = {
        reply_markup: {
          keyboard: [
            [
              { text: PersistentMenuButton.MyLoans },
              { text: PersistentMenuButton.Profile },
            ],
            [
              { text: PersistentMenuButton.HowItWorks },
              { text: PersistentMenuButton.Option4 },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      };
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage =
    "Welcome BOSS! 🤑\n\n<b>Let's get you financed.</b>\n\nNeed some help filling a new purchase order? How about a new piece of machinery for your business? Open Loan's got you covered.";
  const options = {
    reply_markup: {
      keyboard: [
        [
          { text: PersistentMenuButton.MyLoans },
          { text: PersistentMenuButton.Profile },
        ],
        [
          { text: PersistentMenuButton.HowItWorks },
          { text: PersistentMenuButton.Option4 },
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
      await myLoansButtonHandler.newLoanConversationHandler(msg);
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
      await bot.sendMessage(
        msg.chat.id,
        "Great news! Your funds will be sent to you shortly. 🚀"
      );
      break;
    default:
      // Add default case logic if necessary
      break;
  }
});
