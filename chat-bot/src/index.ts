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

      bot.sendMessage(chatId, "Please choose:", options);
  }
});
