export enum AgreementType {
  FIXED = "FIXED",
  VARIABLE = "VARIABLE",
}

export type FixedRepaymentSchedule = {
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
};

export type VariableRepaymentSchedule = {
  percentageOfDeposits: number;
};

export type Loan = {
  id?: string;
  userId: number;
  principal: number; // Original loan amount
  remaining: number; // Outstanding balance
  interestRate: number; // Annualised interest rates
  walletAddress: string;
  reason: string;
  description: string;
  repaymentType?: AgreementType;
  fixed?: FixedRepaymentSchedule;
  variable?: VariableRepaymentSchedule;
};
