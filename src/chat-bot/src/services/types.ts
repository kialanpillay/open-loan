export enum AgreementType {
  FIXED = "FIXED",
  VARIABLE = "VARIABLE",
}

export type FixedRepaymentSchedule = {
  type: AgreementType.FIXED;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
};

export type VariableRepaymentSchedule = {
  type: AgreementType.VARIABLE;
  percentageOfDeposits: number;
};

export type Loan = {
  id?: string;
  userId: number;
  principal: number; // Original loan amount
  remaining: number; // Outstanding balance
  interestRate: number; // Annualised interest rates
  reason: string;
  description: string;
  grants?: any;
  repaymentType?: AgreementType;
  repaymentPlan?: FixedRepaymentSchedule | VariableRepaymentSchedule;
};
