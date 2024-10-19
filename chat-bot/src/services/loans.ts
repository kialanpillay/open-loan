import { db } from "../db";
import {
  FixedRepaymentSchedule,
  Loan,
  AgreementType,
  VariableRepaymentSchedule,
} from "./types";
import { v4 as uuidv4 } from "uuid";

export async function createLoan(
  userId: number,
  amount: number,
  walletAddress: string,
  reason: string
): Promise<Loan> {
  const id = uuidv4();
  const loan: Loan = { id, userId, amount, walletAddress, reason };

  const data = db.readData();
  data["loans"].push(loan);
  db.updateData(data);

  return loan;
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
        loan["fixed"] = fixed;
      } else if (repaymentType === AgreementType.VARIABLE) {
        loan["repaymentType"] = repaymentType;
        loan["variable"] = variable;
      }
    }
  }
  db.updateData(data);
}
