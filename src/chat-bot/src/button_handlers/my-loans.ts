import TelegramBot from "node-telegram-bot-api";
import { bot, PersistentMenuButton } from "../bot";
import {
  createLoan,
  getLoanByLoanId,
  getLoansByUserId,
  updateLoanGrants,
  updateLoanRepaymentSchedule,
} from "../services/loans";
import { AgreementType, Loan } from "../services/types";
import { initialCollection } from "../../../shared/interledger/collection/initial";
import { recurringCollection } from "../../../shared/interledger/collection/recurring";
import { db } from "../../../shared/db";

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
      } outstanding loan${loans.length > 1 ? "s" : ""}.`;
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
        "Please enter your <b>Open Payments wallet address URL</b>\n\nYou'll be asked to authorise a $0.40 payment so we can verifiy the account is active.",
        { parse_mode: "HTML" }
      );
      bot.once("message", async (msg) => {
        const walletAddress = msg.text;
        const loan = await createLoan(
          msg.chat.id,
          Number(loanAmount),
          loanReason
        );

        const response = await initialCollection(
          loan.id,
          Number(loanAmount) * 100,
          walletAddress
        );

        updateLoanGrants(loan.id, response);

        await bot.sendMessage(
          msg.chat.id,
          `Please approve the <b>authorisation payment of $0.40:</b>\n\n${response.outgoingPaymentGrant["interact"].redirect}`,
          { parse_mode: "HTML" }
        );
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
    if (
      loan.repaymentType === AgreementType.FIXED &&
      loan.repaymentPlan.type === AgreementType.FIXED
    ) {
      repaymentDetails = `$${loan.repaymentPlan.amount} every ${loan.repaymentPlan.frequency}`;
    } else if (
      loan.repaymentType === AgreementType.VARIABLE &&
      loan.repaymentPlan.type === AgreementType.VARIABLE
    ) {
      repaymentDetails = `${
        loan.repaymentPlan.percentageOfDeposits * 100
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
    const loanDetails = await getLoanByLoanId(fixedLoanId);

    await updateLoanRepaymentSchedule(fixedLoanId, AgreementType.FIXED, {
      type: AgreementType.FIXED,
      amount: loanDetails.remaining / 12,
      frequency: "monthly",
    });
    const fixedRepaymentMessage =
      "You have chosen the <b>Fixed Repayment Plan.</b>\n\n" +
      `Interest Rate: ${loanDetails.interestRate * 100}%\n\n` +
      `Please confirm that you agree to 10 monthly repayments of ${
        loanDetails.remaining / 12
      } each.`;

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
    const variableRepaymentMessage = `You have chosen the <b>Variable Repayment Plan:</b>\n\nInterest Rate: ${
      loanDetails.interestRate * 100
    }%\n\n<b>Do you accept that 10% of all wallet deposits will be sweeped to repay your loan until you've paid back $${
      loanDetails.remaining
    }?</b>`;

    await updateLoanRepaymentSchedule(
      variableLoanId,
      AgreementType.VARIABLE,
      undefined,
      {
        type: AgreementType.VARIABLE,
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
    const loanId = data.replace("pay_back_some_now_", "");

    await bot.sendMessage(
      msg.chat.id,
      "How much would you like to pay back now? Please enter the amount in USD."
    );

    bot.once("message", async (responseMsg) => {
      const amount = parseFloat(responseMsg.text);
      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(
          msg.chat.id,
          "Please enter a valid amount greater than 0."
        );
      } else {
        const response = await recurringCollection(amount * 100, loanId);
        if (!response.failed) {
          // Update loan remaining
          const data = db.readData();
          const loanData: Loan = data["loans"].find(
            (loan) => loan.id === loanId
          );
          loanData.remaining -= amount;
          db.updateData(data);

          await bot.sendMessage(
            msg.chat.id,
            `You've paid $${amount.toFixed(2)}. Thank you for your payment!`
          );
        } else {
          await bot.sendMessage(
            msg.chat.id,
            `Payment failed 😓, please try again later`
          );
        }
      }
    });
  }
}

const myLoansButtonHandler = new MyLoans();
export default myLoansButtonHandler;
