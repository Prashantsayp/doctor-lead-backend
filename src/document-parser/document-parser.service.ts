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

  private readonly logger =
    new Logger(DocumentParserService.name);

  private client: Groq;

  constructor() {

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }


  private parseAmount(value: string): number {

    return Number(
      value
        .replace(/,/g, '')
        .replace(/[^\d.]/g, ''),
    );
  }

  private extractAmountFromLine(
    line: string,
  ): number | null {

    const matches =
      line.match(/[\d,]+\.\d{2}|[\d,]+/g);

    if (!matches?.length) return null;

    for (const amt of matches.reverse()) {

      const num =
        this.parseAmount(amt);

      if (
        num > 100 &&
        num < 10000000
      ) {
        return num;
      }
    }

    return null;
  }

  /* =========================================================
      BANK STATEMENT PARSER
  ========================================================= */

  async parseBankStatement(
    ocrText: string,
  ): Promise<BankStatementData> {

    try {

      console.log(
        '============= BANK OCR TEXT =============',
      );

      console.log(ocrText);

      const lines =
        ocrText.split('\n');

      let salaryCredits: number[] = [];

      let totalCredits = 0;

      let totalDebits = 0;

      let creditCount = 0;

      let debitCount = 0;

      for (const rawLine of lines) {

        const line =
          rawLine.trim();

        if (!line) continue;

        const lower =
          line.toLowerCase();

        const amount =
          this.extractAmountFromLine(
            line,
          );

        if (!amount) continue;

       

        const isCredit =
          /credit|cr|deposit|salary|salary credit|salarycr|neft/i.test(
            lower,
          );

        if (isCredit) {

          totalCredits += amount;

          creditCount++;

       

          const isSalary =
            /salary|salary credit|payroll|sal credit|salarycr/i.test(
              lower,
            );

          if (
            isSalary &&
            amount > 5000 &&
            amount < 1000000
          ) {

            salaryCredits.push(amount);
          }
        }

        const isDebit =
          /debit|dr|withdrawal|emi|atm|upi/i.test(
            lower,
          );

        if (isDebit) {

          totalDebits += amount;

          debitCount++;
        }
      }

      let salary: number | null =
        null;

      if (salaryCredits.length) {

        salary = Math.round(
          salaryCredits.reduce(
            (a, b) => a + b,
            0,
          ) / salaryCredits.length,
        );
      }

      if (!salary) {

        const allAmounts =
          lines
            .map((line) =>
              this.extractAmountFromLine(
                line,
              ),
            )
            .filter(Boolean)
            .filter(
              (num: any) =>
                num > 5000 &&
                num < 500000,
            ) as number[];

        if (allAmounts.length) {

          salary = Math.max(
            ...allAmounts,
          );
        }
      }

      /* ========================================
          SAFETY VALIDATION
      ======================================== */

      if (
        salary &&
        salary > 1000000
      ) {

        this.logger.warn(
          `Invalid salary detected: ${salary}`,
        );

        salary = null;
      }

      return {

        salary,

        totalIncome:
          totalCredits || null,

        averageMonthlyCredit:
          creditCount > 0
            ? Math.round(
                totalCredits /
                  creditCount,
              )
            : null,

        averageMonthlyDebit:
          debitCount > 0
            ? Math.round(
                totalDebits /
                  debitCount,
              )
            : null,

        transactions: {
          debits: debitCount,
          credits: creditCount,
        },
      };

    } catch (err) {

      this.logger.error(
        'Bank Statement Parse Failed',
        err,
      );

      return {
        salary: null,
        totalIncome: null,
        averageMonthlyCredit: null,
        averageMonthlyDebit: null,
        transactions: {
          debits: 0,
          credits: 0,
        },
      };
    }
  }

  /* =========================================================
      CIBIL PARSER
  ========================================================= */

  async parseCibil(
    ocrText: string,
  ): Promise<CibilData> {

    try {

      console.log(
        '============= CIBIL OCR TEXT =============',
      );

      console.log(ocrText);

      /* ========================================
          SCORE
      ======================================== */

      const scorePatterns = [

        /cibil score[:\s\-]*([0-9]{3})/i,

        /credit score[:\s\-]*([0-9]{3})/i,

        /score[:\s\-]*([0-9]{3})/i,

        /your score is[:\s\-]*([0-9]{3})/i,
      ];

      let cibilScore:
        number | null = null;

      for (const pattern of scorePatterns) {

        const match =
          ocrText.match(pattern);

        if (match?.[1]) {

          const score =
            Number(match[1]);

          if (
            score >= 300 &&
            score <= 900
          ) {

            cibilScore = score;

            break;
          }
        }
      }

      /* ========================================
          ACTIVE LOANS
      ======================================== */

      const activeLoanMatches =
        ocrText.match(
          /active loan/gi,
        );

      const activeLoans =
        activeLoanMatches?.length || 0;

      /* ========================================
          EMI / OBLIGATION
      ======================================== */

      const emiMatches =
        [
          ...ocrText.matchAll(
            /emi[:\s\-]*([\d,]+)/gi,
          ),
        ];

      let totalObligations = 0;

      for (const emi of emiMatches) {

        const amount =
          this.parseAmount(
            emi[1],
          );

        if (
          amount > 0 &&
          amount < 1000000
        ) {

          totalObligations += amount;
        }
      }

      /* ========================================
          BOUNCE
      ======================================== */

      const bounceMatch =
        ocrText.match(
          /bounce count[:\s\-]*([0-9]+)/i,
        );

      const bounceCount =
        bounceMatch?.[1]
          ? Number(
              bounceMatch[1],
            )
          : 0;

      /* ========================================
          LOAN DETAILS
      ======================================== */

      const loanDetails:
        CibilData['loanDetails'] =
          [];

      const loanTypes = [

        'Home Loan',

        'Car Loan',

        'Personal Loan',

        'Credit Card',

        'Business Loan',
      ];

      for (const loanType of loanTypes) {

        const regex = new RegExp(
          `${loanType}.*?(\\d{3,7}).*?(active|closed)`,
          'i',
        );

        const match =
          ocrText.match(regex);

        if (match) {

          loanDetails.push({

            loanType,

            outstandingAmount:
              null,

            emi:
              Number(match[1]),

            status:
              match[2],
          });
        }
      }

      return {

        cibilScore,

        activeLoans,

        totalObligations:
          totalObligations || null,

        bounceCount,

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

  /* =========================================================
      MAIN PARSER
  ========================================================= */

  async parse(
    ocrText: string,
    type: 'bankStatement' | 'cibil',
  ): Promise<ParsedDocumentResult> {

    if (
      type === 'bankStatement'
    ) {

      const data =
        await this.parseBankStatement(
          ocrText,
        );

      return {
        type,
        data,
        raw: ocrText,
      };
    }

    const data =
      await this.parseCibil(
        ocrText,
      );

    return {
      type,
      data,
      raw: ocrText,
    };
  }
}