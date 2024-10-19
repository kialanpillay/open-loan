import { db } from "../db";
import {
  FixedRepaymentSchedule,
  Loan,
  AgreementType,
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

export async function getLoansByUserId(userId: number): Promise<Loan[]> {
  const querySnapshot = await db
    .collection("loans")
    .where("userId", "==", userId)
    .get();
  const loans: Loan[] = [];
  querySnapshot.forEach((doc) => {
    const docData = doc.data() as Loan;
    docData.id = doc.id;
    loans.push(docData);
  });
  return loans;
}

export async function updateLoanRepaymentSchedule(
  loanId: string,
  repaymentType: AgreementType,
  fixed?: FixedRepaymentSchedule,
  variable?: VariableRepaymentSchedule
) {
  const doc_ref = await db.collection("loans").doc(loanId);
  if (repaymentType === AgreementType.FIXED) {
    await doc_ref.update({ repaymentType, fixed });
  } else if (repaymentType === AgreementType.VARIABLE) {
    await doc_ref.update({ repaymentType, variable });
  }
}
