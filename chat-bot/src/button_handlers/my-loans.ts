import TelegramBot from "node-telegram-bot-api";
import { bot, PersistentMenuButton } from "../bot";
import {
  createLoan,
  getLoansByUserId,
  updateLoanRepaymentSchedule,
} from "../services/loans";
import { AgreementType } from "../services/types";

class MyLoans {
  async sendMenu(msg: TelegramBot.Message) {
    bot.sendMessage(msg.chat.id, "...");

    const loans = await getLoansByUserId(msg.chat.id);

    if (loans.length == 0) {
      const text = `<b>${PersistentMenuButton.MyLoans}</b>\n\nYou don't have any loans with Open Loan!\n\nTap 'New Loan' to get started.`;
      const options = {
        reply_markup: {
          inline_keyboard: [[{ text: "New Loan", callback_data: "new_loan" }]],
        },
        parse_mode: "HTML",
      };

      bot.sendMessage(msg.chat.id, text, {
        ...options,
        parse_mode: "HTML",
      });
    } else {
      const text = `<b>${PersistentMenuButton.MyLoans}</b>\n\nManage your loans or create a new one here!`;
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "New Loan", callback_data: "new_loan" }],
            [{ text: "Manage Loan", callback_data: "manage_loans" }],
          ],
        },
        parse_mode: "HTML",
      };

      bot.sendMessage(msg.chat.id, text, {
        ...options,
        parse_mode: "HTML",
      });
    }
  }

  async newLoanConversationHandler(msg: TelegramBot.Message) {
    await bot.sendMessage(msg.chat.id, "...");
    await bot.sendMessage(msg.chat.id, "<b>Let's get you funded!</b>", {
      parse_mode: "HTML",
    });

    const askLoanAmount = async () => {
      await bot.sendMessage(
        msg.chat.id,
        "Please enter the loan amount you need in USD:"
      );
      bot.once("message", async (msg) => {
        const loanAmount = msg.text;

        const isValidNumber = /^\d+(\.\d+)?$/.test(loanAmount);
        if (isValidNumber) {
          await askLoanReason(loanAmount);
        } else {
          await bot.sendMessage(
            msg.chat.id,
            "Invalid input. Please enter a valid number for the loan amount."
          );
          await askLoanAmount(); // Re-prompt for the loan amount
        }
      });
    };

    const askLoanReason = async (loanAmount: string) => {
      await bot.sendMessage(
        msg.chat.id,
        "Please enter the reason for the loan:"
      );
      bot.once("message", async (msg) => {
        const loanReason = msg.text;
        await askWalletAddress(loanAmount, loanReason);
      });
    };

    const askWalletAddress = async (loanAmount: string, loanReason: string) => {
      await bot.sendMessage(
        msg.chat.id,
        "Please enter your Open Payments wallet address:"
      );
      bot.once("message", async (msg) => {
        const walletAddress = msg.text;
        await presentLoanOutcome(loanAmount, loanReason, walletAddress);
      });
    };

    const presentLoanOutcome = async (
      loanAmount: string,
      loanReason: string,
      walletAddress: string
    ) => {
      const loan = await createLoan(
        msg.chat.id,
        Number(loanAmount),
        walletAddress,
        loanReason
      );

      const outcomeMessage =
        "<b>Your loan application was successful. ✅</b>\n\n You can repay using one of the following plans:\n\n• <b>Fixed Plan</b>: Fixed repayments at regular intervals.\n\n• <b>Variable Plan</b>: A percentage of all incoming deposits will be taken as repayment.\n\nPick the option that works for you!";

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Fixed",
                callback_data: `fixed_repayments_${loan.id}`,
              },
              {
                text: "Variable",
                callback_data: `variable_repayments_${loan.id}`,
              },
            ],
          ],
        },
      };

      await bot.sendMessage(msg.chat.id, outcomeMessage, {
        ...options,
        parse_mode: "HTML",
      });
    };

    await askLoanAmount();
  }

  async fixedRepaymentConversationHandler(
    callbackQuery: TelegramBot.CallbackQuery
  ) {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    const fixedLoanId = data.split("_")[2];

    await updateLoanRepaymentSchedule(fixedLoanId, AgreementType.FIXED, {
      amount: 100,
      frequency: "weekly",
    });

    const fixedRepaymentMessage =
      "You have chosen the <b>Fixed Repayment Plan.</b>\n\n" +
      "Please confirm that you agree to 10 weekly repayments of $100 each.";

    const fixedRepaymentOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Agree",
              callback_data: `agree_${fixedLoanId}`,
            },
            {
              text: "Cancel",
              callback_data: `cancel_${fixedLoanId}`,
            },
          ],
        ],
      },
    };
    await bot.sendMessage(msg.chat.id, "...");
    await bot.sendMessage(msg.chat.id, fixedRepaymentMessage, {
      ...fixedRepaymentOptions,
      parse_mode: "HTML",
    });
  }

  async variableRepaymentConversationHandler(
    callbackQuery: TelegramBot.CallbackQuery
  ) {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    const variableLoanId = data.split("_")[2];
    const variableRepaymentMessage =
      "You have chosen the <b>Variable Repayment Plan.</b>\n\n" +
      "Do you accept that 10% of all incoming payments will be sent as repayment?";

    await updateLoanRepaymentSchedule(
      variableLoanId,
      AgreementType.VARIABLE,
      undefined,
      {
        percentageOfDeposits: 0.1,
      }
    );

    const variableRepaymentOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Agree",
              callback_data: `agree_${variableLoanId}`,
            },
            {
              text: "Cancel",
              callback_data: `cancel_${variableLoanId}`,
            },
          ],
        ],
      },
    };
    await bot.sendMessage(msg.chat.id, "...");
    await bot.sendMessage(msg.chat.id, variableRepaymentMessage, {
      ...variableRepaymentOptions,
      parse_mode: "HTML",
    });
  }
}

const myLoansButtonHandler = new MyLoans();
export default myLoansButtonHandler;
