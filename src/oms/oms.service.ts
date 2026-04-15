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
        }
      )

      return res.data?.data?.results || []
    } catch (err) {
      console.error("OMS TICKETS ERROR:", err?.response?.data || err.message)
      return []
    }
  }

  async searchFromTickets(search: string) {
    try {
      const tickets = await this.getOmsTickets(1, 100)

      const normalize = (val: string) =>
        (val || "").toString().toLowerCase().replace(/\s/g, '')

      const cleanSearch = normalize(search)

      const matched = tickets.find((t: any) => {
        const mobile = normalize(t.customerContact)
        const email = normalize(t.customerEmail)
        const name = normalize(t.customerName)

        return (
          mobile.includes(cleanSearch) ||
          email.includes(cleanSearch) ||
          name.includes(cleanSearch)
        )
      })
      
      if (!matched) return null

      return {
        fullName: matched.customerName,
        mobileNumber: matched.customerContact,
        email: matched.customerEmail,
        cityOrPinCode: matched.customerLocation,
        loanAmount: Number(matched.applicationAmount) || 0,
        status: matched.ticketStatus,
        isFromOms: true,
      }

    } catch (err) {
      console.error("OMS SEARCH ERROR:", err)
      return null
    }
  }
}