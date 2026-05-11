import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // ================= COMMON AI CALL =================
  private async callAI(prompt: string) {
    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are a strict JSON extractor. Return ONLY valid JSON. No markdown. No explanation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0,
      });

      const raw = response?.choices?.[0]?.message?.content?.trim() || '';

      this.logger.log(`🔥 RAW AI RESPONSE: ${raw}`);

      if (!raw) {
        return {
          success: false,
          error: 'No response from AI',
        };
      }

      // ✅ CLEAN RESPONSE
      const clean = raw
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // ✅ EXTRACT JSON
      const jsonMatch = clean.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          success: false,
          error: 'No JSON found',
          raw: clean,
        };
      }

      try {
        return {
          success: true,
          data: JSON.parse(jsonMatch[0]),
        };
      } catch (parseError) {
        this.logger.error('JSON Parse Error', parseError);

        return {
          success: false,
          error: 'Invalid JSON',
          raw: clean,
        };
      }
    } catch (error) {
      this.logger.error('Groq API Error', error);

      return {
        success: false,
        error: 'AI request failed',
      };
    }
  }

  // ================= POLICY EXTRACTION =================
  async extractPolicy(text: string) {
    try {
      const prompt = `
Extract loan policy details from the given text.

TEXT:
${text.slice(0, 12000)}

Return ONLY valid JSON in this exact format:

{
  "lender_name": string | null,
  "min_cibil": number,
  "max_loan": number,
  "min_income": number,
  "employment": string | null
}

Rules:
- No markdown
- No explanation
- Numbers should not contain commas or currency symbols
- employment must be one of:
  salaried / business / doctor
- If value not found:
  - string => null
  - number => 0
`;

      const result: any = await this.callAI(prompt);

      if (!result.success) {
        return result;
      }

      const parsed = result.data;

      return {
        success: true,
        data: {
          lender_name: parsed?.lender_name || null,
          min_cibil: Number(parsed?.min_cibil) || 0,
          max_loan: Number(parsed?.max_loan) || 0,
          min_income: Number(parsed?.min_income) || 0,
          employment: parsed?.employment || null,
        },
      };
    } catch (error) {
      this.logger.error('Policy Extraction Error', error);

      return {
        success: false,
        error: 'Policy extraction failed',
      };
    }
  }

  // ================= FINANCIAL EXTRACTION =================
  async extractFinancial(text: string, type: string) {
    try {
      let prompt = '';

      // ================= BANK STATEMENT =================
      if (type === 'bank_statement') {
        prompt = `
Extract financial data from the bank statement text.

TEXT:
${text.slice(0, 12000)}

Return ONLY valid JSON:

{
  "monthly_income": number,
  "emi_outflow": number,
  "cibil_score": number,
  "active_loans": number,
  "overdue": boolean
}

Rules:
- No markdown
- No explanation
- Return only JSON
- If value missing:
  - number => 0
  - boolean => false
`;
      }

      // ================= CIBIL =================
      else if (type === 'cibil') {
        prompt = `
Extract credit details from the CIBIL report.

TEXT:
${text.slice(0, 12000)}

Return ONLY valid JSON:

{
  "monthly_income": number,
  "emi_outflow": number,
  "cibil_score": number,
  "active_loans": number,
  "overdue": boolean
}

Rules:
- overdue = true if overdue/late payment/default found
- No markdown
- No explanation
- Return only JSON
- Missing values => 0 or false
`;
      }

      // ================= INVALID TYPE =================
      else {
        return {
          success: false,
          error: 'Invalid extraction type',
        };
      }

      const result: any = await this.callAI(prompt);

      if (!result.success) {
        return result;
      }

      const parsed = result.data;

      return {
        success: true,
        data: {
          monthly_income: Number(parsed?.monthly_income) || 0,
          emi_outflow: Number(parsed?.emi_outflow) || 0,
          cibil_score: Number(parsed?.cibil_score) || 0,
          active_loans: Number(parsed?.active_loans) || 0,
          overdue: Boolean(parsed?.overdue),
        },
      };
    } catch (error) {
      this.logger.error('Financial Extraction Error', error);

      return {
        success: false,
        error: 'Financial extraction failed',
      };
    }
  }
}