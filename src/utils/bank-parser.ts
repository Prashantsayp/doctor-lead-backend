export function extractBankInsights(text: string) {
  const lines = text
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let creditList: number[] = [];
  let debitList: number[] = [];

  for (const line of lines) {
    const nums = line.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
    if (!nums || nums.length < 2) continue;

    const amountStr = nums[nums.length - 2];

    const amount = Number(amountStr.replace(/,/g, ''));

    if (!amount || isNaN(amount)) continue;

    if (amount < 100 || amount > 10000000) continue;

    const lower = line.toLowerCase();

    if (
      lower.includes('cr') ||
      lower.includes('credit') ||
      lower.includes('neft') ||
      lower.includes('imps')
    ) {
      creditList.push(amount);
    }

    if (
      lower.includes('dr') ||
      lower.includes('debit') ||
      lower.includes('emi') ||
      lower.includes('ecs') ||
      lower.includes('nach') ||
      lower.includes('loan')
    ) {
      debitList.push(amount);
    }
  }

  // ================= SALARY LOGIC =================
  const salaryCandidates = creditList.filter(a => a > 10000);

  const monthly_income =
    salaryCandidates.length > 0
      ? Math.max(...salaryCandidates)
      : 0;

  // ================= EMI LOGIC =================
  const emiCandidates = debitList.filter(
    a => a > 2000 && a < 100000
  );

  const emi_outflow =
    emiCandidates.length > 0
      ? Math.round(
          emiCandidates.reduce((a, b) => a + b, 0) / emiCandidates.length
        )
      : 0;

  return {
    monthly_income,
    emi_outflow,
    salary_entries: salaryCandidates.length,
    emi_entries: emiCandidates.length,
  };
}