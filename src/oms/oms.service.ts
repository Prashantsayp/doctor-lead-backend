import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class OmsService {

  async getOmsTickets(page: number = 1, limit: number = 100) {
    try {
      const res = await axios.get(
        `${process.env.OMS_API}/api/v1/get-all-tickets`,
        {
          params: { page, limit },
          headers: {
            "x-access-token": process.env.OMS_TOKEN,
            "x-company-id": process.env.OMS_COMPANY_ID,
          },
          timeout: 5000,
        }
      )

      return res.data?.data?.results || []
    } catch (err) {
      console.error("OMS TICKETS ERROR:", err?.response?.data || err.message)
      return []
    }
  }

  private normalizeText(val: string) {
    return (val || "").toString().toLowerCase().trim()
  }

  private normalizeNumber(val: string) {
    return (val || "").toString().replace(/\D/g, '')
  }

  async searchFromTickets(search: string) {
    try {
      const cleanText = this.normalizeText(search)
      const cleanNumber = this.normalizeNumber(search)

      for (let page = 1; page <= 5; page++) {
        const tickets = await this.getOmsTickets(page, 100)


        const matched = tickets.find((t: any) => {
          const mobile = this.normalizeNumber(t.customerContact)
          const email = this.normalizeText(t.customerEmail)
          const name = this.normalizeText(t.customerName)
          const pan = this.normalizeText(t.panNumber)

          return (
            mobile.includes(cleanNumber) ||
            email.includes(cleanText) ||
            name.includes(cleanText) ||
            pan.includes(cleanText)
          )
        })

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
          }
        }
      }

      return null

    } catch (err) {
      return null
    }
  }
}