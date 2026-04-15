export const mapOmsToLead = (data: any) => {

  const mobile =
    data.number ||
    data.mobile ||
    data.phone ||
    ''

  return {
    fullName:
      data.username ||
      data.customerName ||
      data.name ||
      'OMS User',

    mobileNumber: String(mobile).replace(/\D/g, ''),

    email: data.email || undefined,

    cityOrPinCode:
      data.city ||
      data.pinCode ||
      'NA',

    status: data.status || 'PENDING',

    loanAmount: Number(
      data.amount ||
      data.loanAmount ||
      0
    ),

    isFromOms: true,
    syncedAt: new Date()
  }
}