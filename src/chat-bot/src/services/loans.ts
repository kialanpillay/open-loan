import OpenAI from "openai";

import {
  FixedRepaymentSchedule,
  Loan,
  AgreementType,
  VariableRepaymentSchedule,
} from "./types";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../shared/db";

export async function createLoan(
  userId: number,
  principal: number,
  reason: string
): Promise<Loan> {
  const id = uuidv4();

  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You need to summarise a given reason for a loan into a 2-3 word description of the loan that a user will recognise as being related to their loan. Don't inlude loan in the desciption.",
      },
      {
        role: "user",
        content: `${reason}`,
      },
    ],
  });

  const loan: Loan = {
    id,
    userId,
    principal,
    remaining: principal,
    interestRate: 0.1,
    reason,
    description: completion.choices[0].message.content,
  };

  const data = db.readData();
  data["loans"].push(loan);
  db.updateData(data);

  return loan;
}

export async function updateLoanGrants(loanId: string, grants: any) {
  const data = db.readData();

  for (const loan of data["loans"]) {
    if (loan.id === loanId) {
      loan.grants = { ...loan.grants, ...grants };
    }
  }

  db.updateData(data);
}

export async function getLoansByUserId(userId: number): Promise<Loan[]> {
  const data = db.readData();
  const allLoans = data["loans"];

  const userLoans = [];
  for (const loan of allLoans) {
    if (loan.userId === userId) {
      userLoans.push(loan);
    }
  }

  return userLoans;
}

export async function getLoanByLoanId(loanId: string): Promise<Loan> {
  const data = db.readData();
  const allLoans = data["loans"];

  for (const loan of allLoans) {
    if (loan.id === loanId) {
      return loan;
    }
  }
  throw new Error("loan not found");
}

export async function updateLoanRepaymentSchedule(
  loanId: string,
  repaymentType: AgreementType,
  fixed?: FixedRepaymentSchedule,
  variable?: VariableRepaymentSchedule
) {
  const data = db.readData();
  const allLoans = data["loans"];
  for (const loan of allLoans) {
    if (loan["id"] === loanId) {
      if (repaymentType === AgreementType.FIXED) {
        loan["repaymentType"] = repaymentType;
        loan["repaymentPlan"] = fixed;
      } else if (repaymentType === AgreementType.VARIABLE) {
        loan["repaymentType"] = repaymentType;
        loan["repaymentPlan"] = variable;
      }
    }
  }
  db.updateData(data);
}
