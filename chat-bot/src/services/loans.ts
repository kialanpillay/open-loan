import { db } from "../db";
import {
  FixedRepaymentSchedule,
  Loan,
  RepaymentType,
  VariableRepaymentSchedule,
} from "./types";

export async function createLoan(
  userId: number,
  amount: number,
  walletAddress: string,
  reason: string
): Promise<Loan> {
  const loan: Loan = { userId, amount, walletAddress, reason };
  const doc_ref = await db.collection("loans").doc();
  await doc_ref.set(loan);
  loan.id = doc_ref.id;
  return loan;
}

// export async function getLoansByUserId(userId: number) {
//   db.collection("loans").
// }

export async function updateLoanRepaymentSchedule(
  loanId: string,
  repaymentType: RepaymentType,
  fixed?: FixedRepaymentSchedule,
  variable?: VariableRepaymentSchedule
) {
  const doc_ref = await db.collection("loans").doc(loanId);
  if (repaymentType === RepaymentType.FIXED) {
    await doc_ref.update({ repaymentType, fixed });
  } else if (repaymentType === RepaymentType.VARIABLE) {
    await doc_ref.update({ repaymentType, variable });
  }
}
