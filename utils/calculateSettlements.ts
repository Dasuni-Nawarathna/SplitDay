/**
 * Greedy debt minimization algorithm.
 * Resolves all debts in the minimum number of transactions.
 */

export interface Expense {
  amount: number;
  paidBy: string;
  splitBetween: string[];
  isUnequal: boolean;
  customShares?: Record<string, number> | Map<string, number>;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlements(
  participants: string[],
  expenses: Expense[]
): Settlement[] {
  // Initialize net balances for every participant
  const netBalances: Record<string, number> = {};
  participants.forEach((p) => (netBalances[p] = 0));

  expenses.forEach((exp) => {
    // The payer is owed the full amount
    netBalances[exp.paidBy] = (netBalances[exp.paidBy] ?? 0) + exp.amount;

    if (exp.isUnequal && exp.customShares) {
      // Support both plain object and Mongoose Map
      const shares =
        exp.customShares instanceof Map
          ? Object.fromEntries(exp.customShares)
          : exp.customShares;

      for (const [consumer, share] of Object.entries(shares)) {
        netBalances[consumer] = (netBalances[consumer] ?? 0) - share;
      }
    } else {
      const share = exp.amount / exp.splitBetween.length;
      exp.splitBetween.forEach((consumer) => {
        netBalances[consumer] = (netBalances[consumer] ?? 0) - share;
      });
    }
  });

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors = Object.keys(netBalances)
    .filter((p) => netBalances[p] < -0.01)
    .map((p) => ({ name: p, balance: Math.abs(netBalances[p]) }));

  const creditors = Object.keys(netBalances)
    .filter((p) => netBalances[p] > 0.01)
    .map((p) => ({ name: p, balance: netBalances[p] }));

  const settlements: Settlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmount = Math.min(debtor.balance, creditor.balance);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.balance -= settleAmount;
    creditor.balance -= settleAmount;

    if (debtor.balance < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

  return settlements;
}
