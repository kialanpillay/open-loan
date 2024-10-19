import TelegramBot from "node-telegram-bot-api";
import { bot, PersistentMenuButton } from "../bot";
import {
  createLoan,
  getLoanByLoanId,
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
      let text = `<b>${
        PersistentMenuButton.MyLoans
      }</b>\n\nManage your loans or create a new one here!\n\nYou've got ${
        loans.length
      } outstanding loan${loans.length > 1 && "s"}.`;
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "New Loan", callback_data: "new_loan" },
              { text: "Manage Loans", callback_data: "manage_loans" },
            ],
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

  async newLoan(msg: TelegramBot.Message) {
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
        "Please enter your Open Payments wallet address.\n\nA $0.4 payment will be deducted to ensure your wallet is active."
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

  async manageLoans(msg: TelegramBot.Message) {
    await bot.sendMessage(msg.chat.id, "...");
    const loans = await getLoansByUserId(msg.chat.id);

    let text = "<b>Manage Loans</b>\n\nPick a loan to manage:";
    const inlineKeyboard = loans.map((loan) => [
      {
        text: loan.description,
        callback_data: `manage_loan_${loan.id}`,
      },
    ]);

    const options = {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    };

    await bot.sendMessage(msg.chat.id, text, {
      ...options,
      parse_mode: "HTML",
    });
  }

  async loanDetails(callbackQuery: TelegramBot.CallbackQuery) {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    await bot.sendMessage(msg.chat.id, "...");
    const loanId = data.split("_")[2];

    const loans = await getLoansByUserId(msg.chat.id);
    const loan = loans.find((loan) => loan.id === loanId);

    let repaymentDetails = "No repayment plan selected.";
    if (loan.repaymentType === AgreementType.FIXED && loan.fixed) {
      repaymentDetails = `$${loan.fixed.amount} every ${loan.fixed.frequency}`;
    } else if (loan.repaymentType === AgreementType.VARIABLE && loan.variable) {
      repaymentDetails = `${
        loan.variable.percentageOfDeposits * 100
      }% of deposits`;
    }

    const loanDetailsMessage =
      `<b>Loan Details</b>\n\n` +
      `<b>Description:</b> ${loan.description}\n` +
      `<b>Remaining amount:</b> $${loan.remaining}\n` +
      `<b>Repayment Plan (${loan.repaymentType.toLowerCase()}):</b> ${repaymentDetails}`;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Pay Back Some Now",
              callback_data: `pay_back_some_now_${loan.id}`,
            },
          ],
        ],
      },
    };

    await bot.sendMessage(msg.chat.id, loanDetailsMessage, {
      ...options,
      parse_mode: "HTML",
    });
  }

  async fixedRepaymentConversationHandler(
    callbackQuery: TelegramBot.CallbackQuery
  ) {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    await bot.sendMessage(msg.chat.id, "...");
    const fixedLoanId = data.split("_")[2];

    await updateLoanRepaymentSchedule(fixedLoanId, AgreementType.FIXED, {
      amount: 120,
      frequency: "monthly",
    });

    const loanDetails = await getLoanByLoanId(fixedLoanId);

    const fixedRepaymentMessage =
      "You have chosen the <b>Fixed Repayment Plan.</b>\n\n" +
      `Your interest rate for the loan is ${
        loanDetails.interestRate * 100
      }% per annum, compounded annually.\n\n` +
      "Please confirm that you agree to 10 monthly repayments of $120 each.";

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
    const loanDetails = await getLoanByLoanId(variableLoanId);
    const variableRepaymentMessage =
      "You have chosen the <b>Variable Repayment Plan.</b>\n\n" +
      "Your interest rate for the loan is " +
      loanDetails.interestRate * 100 +
      "% per annum, compounded annually.\n\n" +
      "Do you accept that 15% of all wallet deposits will be sweeped to your loan until you've paid back $" +
      loanDetails.principal * (1 + loanDetails.interestRate) +
      "?";

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

  async agreeToLoan(callbackQuery: TelegramBot.CallbackQuery) {
    const msg = callbackQuery.message;
    await bot.sendMessage(msg.chat.id, "...");
    await bot.sendMessage(
      msg.chat.id,
      "Great news! <b>Your funds will be sent to you shortly. 🚀</b>",
      { parse_mode: "HTML" }
    );
  }

  async payBackSomeNow(callbackQuery: TelegramBot.CallbackQuery) {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    const loanId = data.split("_")[2];

    await bot.sendMessage(msg.chat.id, "...");
    await bot.sendMessage(msg.chat.id, `You've paid!`, {
      parse_mode: "HTML",
    });
  }
}

const myLoansButtonHandler = new MyLoans();
export default myLoansButtonHandler;
