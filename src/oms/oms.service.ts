import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OmsService {

  private readonly baseURL = process.env.OMS_API;
  private readonly headers = {
    "x-access-token": process.env.OMS_TOKEN,
    "x-company-id": process.env.OMS_COMPANY_ID,
  };

  async getOmsTickets(page: number = 1, limit: number = 100) {
    try {
      if (!this.baseURL) {
        return [];
      }

      const res = await axios.get(
        `${this.baseURL}/api/v1/get-all-tickets`,
        {
          params: { page, limit },
          headers: this.headers,
          timeout: 15000,
        }
      );

      const tickets = res.data?.data?.results || [];

      return tickets;

    } catch (err: any) {
      return [];
    }
  }

  async getOmsCount() {
    let total = 0;

    for (let page = 1; page <= 5; page++) {
      const tickets = await this.getOmsTickets(page, 100);

      if (!tickets.length) break;

      total += tickets.length;
    }


    return total;
  }
    private normalizeText(val: any): string {
    return (val || "").toString().toLowerCase().trim();
  }

  private normalizeNumber(val: any): string {
    return (val || "").toString().replace(/\D/g, '');
  }

  async searchFromTickets(search: string) {
    try {
      if (!search) return null;

      const cleanText = this.normalizeText(search);
      const cleanNumber = this.normalizeNumber(search);

      for (let page = 1; page <= 5; page++) {
        const tickets = await this.getOmsTickets(page, 100);

        if (!tickets.length) break;

        const matched = tickets.find((t: any) => {
          const mobile = this.normalizeNumber(t.customerContact);
          const email = this.normalizeText(t.customerEmail);
          const name = this.normalizeText(t.customerName);
          const pan = this.normalizeText(t.panNumber);

          return (
            mobile.includes(cleanNumber) ||
            email.includes(cleanText) ||
            name.includes(cleanText) ||
            pan.includes(cleanText)
          );
        });

        if (matched) {
          return {
            fullName: matched.customerName || "NA",
            mobileNumber: matched.customerContact || "NA",
            email: matched.customerEmail || null,
            cityOrPinCode: matched.customerLocation || "NA",
            loanAmount: Number(matched.applicationAmount) || 0,
            status: matched.ticketStatus || "PENDING",
            pan: matched.panNumber || null,
            cibil: matched.cibilScore || null,
            profession: matched.profession || matched.customerType || null,
            isFromOms: true,
          };
        }
      }

      return null;

    } catch (err: any) {
      return null;
    }
  }
}