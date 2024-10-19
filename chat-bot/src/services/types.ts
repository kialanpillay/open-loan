export enum RepaymentType {
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
  amount: number;
  walletAddress: string;
  reason: string;
  repaymentType?: RepaymentType;
  fixed?: FixedRepaymentSchedule;
  variable?: VariableRepaymentSchedule;
};
