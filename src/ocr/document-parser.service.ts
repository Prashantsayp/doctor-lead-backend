import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface BankStatementData {
  salary: number | null;
  totalIncome: number | null;
  averageMonthlyCredit: number | null;
  averageMonthlyDebit: number | null;
  transactions: {
    debits: number;
    credits: number;
  };
}

export interface CibilData {
  cibilScore: number | null;
  activeLoans: number;
  totalObligations: number | null;
  bounceCount: number;
  loanDetails: Array<{
    loanType: string;
    outstandingAmount: number | null;
    emi: number | null;
    status: string;
  }>;
}

export interface ParsedDocumentResult {
  type: 'bankStatement' | 'cibil';
  data: BankStatementData | CibilData;
  raw: string;
}

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

async parseBankStatement(ocrText: string) {

  const salaryMatch =
    ocrText.match(/SALARY.*?(\d{4,7})/i);

  const creditMatches = [
    ...ocrText.matchAll(/CREDIT.*?(\d{3,7})/gi),
  ];

  const debitMatches = [
    ...ocrText.matchAll(/DEBIT.*?(\d{3,7})/gi),
  ];

  const totalCredits = creditMatches.reduce(
    (sum, item) => sum + Number(item[1]),
    0,
  );

  const totalDebits = debitMatches.reduce(
    (sum, item) => sum + Number(item[1]),
    0,
  );

  return {
    salary: salaryMatch
      ? Number(salaryMatch[1])
      : null,

    totalIncome: totalCredits,

    averageMonthlyCredit:
      creditMatches.length
        ? totalCredits / creditMatches.length
        : null,

    averageMonthlyDebit:
      debitMatches.length
        ? totalDebits / debitMatches.length
        : null,

    transactions: {
      debits: debitMatches.length,
      credits: creditMatches.length,
    },
  };
}

async parseCibil(
  ocrText: string,
): Promise<CibilData> {

  try {

    console.log('============= CIBIL OCR TEXT =============');
    console.log(ocrText);

    // SCORE
    const scoreMatch =
      ocrText.match(/CIBIL SCORE[:\s]*([0-9]{3})/i) ||
      ocrText.match(/score[:\s]*([0-9]{3})/i);

    // ACTIVE LOANS
    const activeLoansMatch =
      ocrText.match(/Active Loans[:\s]*([0-9]+)/i);

    // OBLIGATIONS
    const obligationMatch =
      ocrText.match(/Total Obligations[:\s]*([0-9]+)/i);

    // BOUNCE
    const bounceMatch =
      ocrText.match(/Bounce Count[:\s]*([0-9]+)/i);

    // LOAN DETAILS
const loanDetails: CibilData['loanDetails'] = [];
    const homeLoanMatch =
      ocrText.match(/Home Loan.*?([0-9]{4,6}).*?Active/i);

    if (homeLoanMatch) {
      loanDetails.push({
        loanType: 'Home Loan',
        outstandingAmount: null,
        emi: Number(homeLoanMatch[1]),
        status: 'Active',
      });
    }

    const carLoanMatch =
      ocrText.match(/Car Loan.*?([0-9]{4,6}).*?Active/i);

    if (carLoanMatch) {
      loanDetails.push({
        loanType: 'Car Loan',
        outstandingAmount: null,
        emi: Number(carLoanMatch[1]),
        status: 'Active',
      });
    }

    return {

      cibilScore: scoreMatch
        ? Number(scoreMatch[1])
        : null,

      activeLoans: activeLoansMatch
        ? Number(activeLoansMatch[1])
        : 0,

      totalObligations: obligationMatch
        ? Number(obligationMatch[1])
        : null,

      bounceCount: bounceMatch
        ? Number(bounceMatch[1])
        : 0,

      loanDetails,
    };

  } catch (err) {

    this.logger.error(
      'Failed to parse CIBIL',
      err,
    );

    return {
      cibilScore: null,
      activeLoans: 0,
      totalObligations: null,
      bounceCount: 0,
      loanDetails: [],
    };
  }
}

  async parse(
    ocrText: string,
    type: 'bankStatement' | 'cibil',
  ): Promise<ParsedDocumentResult> {
    if (type === 'bankStatement') {
      const data = await this.parseBankStatement(ocrText);
      return { type, data, raw: ocrText };
    } else {
      const data = await this.parseCibil(ocrText);
      return { type, data, raw: ocrText };
    }
  }
}