import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
import { Model, isValidObjectId } from 'mongoose'
import { LeadStatus, RegVerificationStatus } from './schemas/doctor-lead.schema'
import * as XLSX from 'xlsx'
import { parse as csvParse } from 'csv-parse/sync'
import {PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreateDoctorLeadDto } from './dto/create-doctor-lead.dto'
import { UpdateDoctorLeadDto } from './dto/update-doctor-lead.dto'
import { DoctorLead, DoctorLeadDocument, LeadProfession } from './schemas/doctor-lead.schema'

type BulkRow = Record<string, any>
import { s3 } from '../common/file-upload.config'
import { OmsService } from 'src/oms/oms.service'
import { mapOmsToLead } from 'src/oms/oms.mapper'

@Injectable()
  export class DoctorLeadService {
  constructor(
    @InjectModel(DoctorLead.name)
    private readonly doctorLeadModel: Model<DoctorLeadDocument>,
    private readonly omsService: OmsService,
  ) {}
    private cleanStr(v: any) {
    return String(v ?? '').trim()
  }

  private escapeRegex(input: string) {
    return String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private toNum(v: any, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  private normEmailOrUndefined(v: any): string | undefined {
    const em = this.cleanStr(v).toLowerCase()
    return em ? em : undefined
  }

  private normMobile(v: any) {
    return this.cleanStr(v).replace(/\D/g, '')
  }

  private normRegNoOrUndefined(v: any): string | undefined {
    const reg = this.cleanStr(v).toUpperCase()
    return reg ? reg : undefined
  }

  private normPANOrUndefined(v: any): string | undefined {
    const pan = this.cleanStr(v).toUpperCase()
    return pan ? pan : undefined
  }

  private normAadharOrUndefined(v: any): string | undefined {
    const a = this.cleanStr(v).replace(/\D/g, '')
    return a ? a : undefined
  }



  private normProfession(v: any): LeadProfession | undefined {
  const p = this.cleanStr(v).toUpperCase().replace('_', ' ')

  if (!p) return undefined
  if (p === 'DOCTOR') return LeadProfession.DOCTOR
  if (p === 'CA' || p === 'CHARTERED ACCOUNTANT') return LeadProfession.CA
  if (p === 'LAWYER' || p === 'ADVOCATE') return LeadProfession.LAWYER
  if (p === 'SALARIED' || p === 'EMPLOYEE' || p === 'JOB') return LeadProfession.SALARIED
  if (p === 'BUSINESSMAN' || p === 'BUSINESS') return LeadProfession.BUSINESSMAN
  if (p === 'COMPANY SECRETARY' || p === 'CS') return LeadProfession.COMPANY_SECRETARY
  if (p === 'COST ACCOUNTANT') return LeadProfession.COST_ACCOUNTANT
  if (p === 'REALTOR') return LeadProfession.REALTOR
  if (p === 'BROKER') return LeadProfession.BROKER
  if (p === 'CHANNEL PARTNER') return LeadProfession.CHANNEL_PARTNER

  return undefined
}

  private computeVerified(reg?: string): boolean {
    return Boolean(reg && String(reg).trim().length > 0)
  }

  private splitMulti(v: any) {
    if (Array.isArray(v)) return v.map((x) => this.cleanStr(x)).filter(Boolean)
    const s = this.cleanStr(v)
    if (!s) return []
    return s
      .split(/[,|;]/g)
      .map((x) => this.cleanStr(x))
      .filter(Boolean)
  }

  private safeBool(v: any) {
    const s = this.cleanStr(v).toLowerCase()
    if (['true', 'yes', 'y', '1'].includes(s)) return true
    if (['false', 'no', 'n', '0'].includes(s)) return false
    return Boolean(v)
  }

  private normLoanType(v: any): string[] {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
    const s = String(v ?? '').trim()
    if (!s) return []
    return s
      .split(/[,|;]/g)
      .map((x) => x.trim())
      .filter(Boolean)
  }

  async exists(query: {
    profession?: any
    registrationNumber?: any
    panNumber?: any
    mobileNumber?: any
    email?: any
    aadharNumber?: any
  }) {
    const profession = this.normProfession(query?.profession)
    const reg = this.normRegNoOrUndefined(query?.registrationNumber)
    const pan = this.normPANOrUndefined(query?.panNumber)
    const mob = this.normMobile(query?.mobileNumber)
    const email = this.normEmailOrUndefined(query?.email)
    const aad = this.normAadharOrUndefined(query?.aadharNumber)

    const or: any[] = []
    if (reg) or.push({ registrationNumber: reg })
    if (pan) or.push({ panNumber: pan })
    if (mob) or.push({ mobileNumber: mob })
    if (email) or.push({ email })
    if (aad) or.push({ aadharNumber: aad })

    if (!or.length) {
      return { exists: false, matchedOn: [], leadId: null }
    }

    const filter: any = { $or: or }
    if (profession) filter.profession = profession

    const existing: any = await this.doctorLeadModel
    .findOne(filter)
    .select('_id profession fullName registrationNumber panNumber mobileNumber email aadharNumber')
    .lean()
    
    if (!existing) {
      return { exists: false, matchedOn: [], leadId: null }
    }

    const matchedOn: string[] = []
    if (reg && existing.registrationNumber === reg) matchedOn.push('Reg No')
    if (pan && (existing as any).panNumber === pan) matchedOn.push('PAN')
    if (mob && existing.mobileNumber === mob) matchedOn.push('Mobile No')
    if (email && existing.email === email) matchedOn.push('Email ID')
    if (aad && (existing as any).aadharNumber === aad) matchedOn.push('Aadhar Number')

    return {
      exists: true,
      matchedOn,
      leadId: String(existing._id),
      fullName: existing.fullName || null,
      profession: (existing as any).profession || null,
    }
  }

  async create(dto: CreateDoctorLeadDto) {
    const profession = this.normProfession((dto as any).profession)
    const fullName = this.cleanStr(dto.fullName)
    const mobileNumber = this.normMobile(dto.mobileNumber)
    const cityOrPinCode = this.cleanStr(dto.cityOrPinCode)

    if (!profession) throw new BadRequestException('profession is required')
    if (!fullName) throw new BadRequestException('fullName is required')
    if (!mobileNumber) throw new BadRequestException('mobileNumber is required')
    if (!cityOrPinCode) throw new BadRequestException('cityOrPinCode is required')
    const reg = this.normRegNoOrUndefined((dto as any).registrationNumber)
    const panNumber = this.normPANOrUndefined((dto as any).panNumber)
    const aadharNumber = this.normAadharOrUndefined((dto as any).aadharNumber)
    const email = this.normEmailOrUndefined(dto.email)

    const dup = await this.exists({
      profession,
      registrationNumber: reg,
      panNumber,
      mobileNumber,
      email,
      aadharNumber,
    })

    if (dup?.exists) {
      throw new BadRequestException({
        message: 'Lead already exists. New lead not created.',
        matchedOn: dup.matchedOn,
        existingLeadId: dup.leadId,
      })
    }
const payload: Partial<DoctorLead> = {
  profession,
  fullName,
  mobileNumber,
  cityOrPinCode,
  ...(email ? { email } : {}),
  ...(reg ? { registrationNumber: reg } : {}),
  ...(panNumber ? { panNumber } : {}),
  ...(aadharNumber ? { aadharNumber } : {}),

  isVerified: false,
  status: LeadStatus.PENDING,
regVerificationStatus: RegVerificationStatus.PENDING,

      yearsOfPractice:
        dto.yearsOfPractice !== undefined && dto.yearsOfPractice !== null
          ? this.toNum(dto.yearsOfPractice)
          : undefined,

      qualification: Array.isArray(dto.qualification)
        ? dto.qualification.map((x) => this.cleanStr(x)).filter(Boolean)
        : [],

      practiceType: Array.isArray(dto.practiceType)
        ? dto.practiceType.map((x) => this.cleanStr(x)).filter(Boolean)
        : [],

      remarks: (dto as any).remarks ? this.cleanStr((dto as any).remarks) : '',

      monthlyGrossIncome: dto.monthlyGrossIncome !== undefined ? this.toNum(dto.monthlyGrossIncome) : 0,
      monthlyNetIncome: dto.monthlyNetIncome !== undefined ? this.toNum(dto.monthlyNetIncome) : 0,
      otherIncomeSources: dto.otherIncomeSources !== undefined ? this.toNum(dto.otherIncomeSources) : 0,

      monthlyEmi: (dto as any).monthlyEmi !== undefined ? this.toNum((dto as any).monthlyEmi) : 0,
      activeLoans: (dto as any).activeLoans !== undefined ? this.toNum((dto as any).activeLoans) : 0,
      loanType: this.normLoanType((dto as any).loanType),
      hasOverdue: Boolean((dto as any).hasOverdue),

      hasProperty: Boolean((dto as any).hasProperty),
      propertyValue: (dto as any).propertyValue !== undefined ? this.toNum((dto as any).propertyValue) : 0,
      medicalEquipmentValue:
        (dto as any).medicalEquipmentValue !== undefined ? this.toNum((dto as any).medicalEquipmentValue) : 0,

      cibilScore: (dto as any).cibilScore === undefined ? null : (dto as any).cibilScore,
    }

    try {
      const created = await this.doctorLeadModel.create(payload)
      return created.toObject()
    } catch (e: any) {
      if (e?.name === 'ValidationError') throw new BadRequestException(e.message)
      if (String(e?.message || '').includes('E11000')) {
        throw new BadRequestException('Duplicate lead (unique constraint) detected')
      }
      throw e
    }
  }

  async findAll(query?: { 
  page?: any
  limit?: any
  search?: any
  verified?: any
  profession?: any
  status?: any
  city?: any
}) {
  const page = Math.max(1, Number(query?.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)))
  const skip = (page - 1) * limit

  const rawSearch = this.cleanStr(query?.search)
  const filter: any = {}

  // ✅ profession
  const profession = this.normProfession(query?.profession)
  if (profession) {
    filter.profession = profession
  }

  // ✅ status (NEW ADD)
  if (query?.status) {
    filter.status = query.status
  }

  // ✅ city (NEW ADD)
  if (query?.city) {
    filter.cityOrPinCode = {
      $regex: this.escapeRegex(query.city),
      $options: 'i',
    }
  }

  // ✅ search
  if (rawSearch) {
    const search = this.escapeRegex(rawSearch)
    const isNum = /^\d+$/.test(rawSearch)
    const mobileOnly = rawSearch.replace(/\D/g, '')

    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { cityOrPinCode: { $regex: search, $options: 'i' } },
      { mobileNumber: { $regex: search, $options: 'i' } },
      ...(mobileOnly ? [{ mobileNumber: { $regex: this.escapeRegex(mobileOnly), $options: 'i' } }] : []),
      ...(isNum ? [{ cibilScore: Number(rawSearch) }] : []),
    ]
  }

  // ✅ verified
  if (query?.verified !== undefined && query?.verified !== '') {
    filter.isVerified = String(query.verified) === 'true'
  }

  const [items, total] = await Promise.all([
    this.doctorLeadModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    this.doctorLeadModel.countDocuments(filter).exec(),
  ])
      
  if (rawSearch?.trim() && items.length === 0) {
    const fallback = await this.searchWithFallback(rawSearch)

    if (fallback) {
      return {
        items: [fallback],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
        source: 'OMS'
      }
    }
  }

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    source: items.length ? 'DB' : 'NONE'
  }
  }

  private mapOmsStatus(status: string) {
  const s = (status || "").toLowerCase()

  if (s.includes("approved")) return LeadStatus.APPROVED
  if (s.includes("reject")) return LeadStatus.REJECTED
  if (s.includes("disbursed")) return LeadStatus.DISBURSED

  return LeadStatus.PENDING
}

async searchWithFallback(search: string) {

  const omsData = await this.omsService.searchFromTickets(search)

  if (!omsData) return null

  // 🔥 normalize values
  const mobile = this.normMobile(omsData.mobileNumber)
  const email = this.normEmailOrUndefined(omsData.email)
  const pan = this.normPANOrUndefined(omsData.pan)

  // 🔥 strong duplicate check (mobile + email + PAN)
  const existing = await this.doctorLeadModel.findOne({
    $or: [
      { mobileNumber: mobile },
      ...(email ? [{ email }] : []),
      ...(pan ? [{ panNumber: pan }] : []),
    ]
  })

  if (!existing) {

    const mappedProfession = this.normProfession(omsData.profession)

    await this.doctorLeadModel.create({
      profession: mappedProfession || LeadProfession.DOCTOR,
      fullName: omsData.fullName || "NA",
      mobileNumber: mobile,
      ...(email ? { email } : {}),
      ...(pan ? { panNumber: pan } : {}),
      cityOrPinCode: omsData.cityOrPinCode || "NA",

      status: this.mapOmsStatus(omsData.status),

      isFromOms: true,
      syncedAt: new Date(),
    })

  } else {
    console.log("⚠️ ALREADY EXISTS, NOT SAVING")
  }

  // 🔥 return for UI (always OMS data, not DB)
  return {
    fullName: omsData.fullName,
    mobileNumber: mobile,
    cityOrPinCode: omsData.cityOrPinCode || "NA",
    loanAmount: omsData.loanAmount || 0,
    status: omsData.status || "PENDING",
    isFromOms: true,
    syncedAt: new Date(),
  }
}


@Cron('*/10 * * * *')
async syncOmsToDb() {
  console.log("🔄 OMS SYNC START")

  try {
    const tickets = await this.omsService.getOmsTickets(1, 200)

    for (const t of tickets) {

      const mobile = this.normMobile(t.customerContact)
      if (!mobile) continue

      // ✅ NEW LINE (ADD THIS)
      const email = this.normEmailOrUndefined(t.customerEmail)
      const pan = this.normPANOrUndefined(t.panNumber)

      // ❌ OLD CODE NAHI HAI (GOOD)
      // 👉 yaha new duplicate check lagega

      const exists = await this.doctorLeadModel.findOne({
        $or: [
          { mobileNumber: mobile },
          ...(email ? [{ email }] : []),
          ...(pan ? [{ panNumber: pan }] : []),
        ]
      })

      if (exists) continue

      const mappedProfession = this.normProfession(
        t.profession || t.customerType
      )

      await this.doctorLeadModel.create({
        profession: mappedProfession || LeadProfession.DOCTOR,
        fullName: t.customerName || "NA",
        mobileNumber: mobile,
        email,
        ...(pan ? { panNumber: pan } : {}),
        cityOrPinCode: t.customerLocation || "NA",

        status: this.mapOmsStatus(t.ticketStatus),

        isFromOms: true,
        syncedAt: new Date(),
      })
    }

    console.log("✅ OMS SYNC DONE")

  } catch (err) {
    console.error("❌ OMS SYNC ERROR:", err.message)
  }
}

  async count(query?: { search?: any; verified?: any; profession?: any }) {
    const rawSearch = this.cleanStr(query?.search)

    const baseFilter: any = {}
    const profession = this.normProfession(query?.profession)
    if (profession) {
      baseFilter.profession = profession
    }

    if (query?.verified !== undefined && query?.verified !== '') {
      baseFilter.isVerified = String(query.verified) === 'true'
    }

    let searchFilter: any = { ...baseFilter }

    if (rawSearch) {
      const search = this.escapeRegex(rawSearch)
      const isNum = /^\d+$/.test(rawSearch)
      const mobileOnly = rawSearch.replace(/\D/g, '')

      searchFilter = {
        ...baseFilter,
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { cityOrPinCode: { $regex: search, $options: 'i' } },
          ...(mobileOnly ? [{ mobileNumber: { $regex: this.escapeRegex(mobileOnly), $options: 'i' } }] : []),
          ...(isNum ? [{ cibilScore: Number(rawSearch) }] : []),
        ],
      }
    }

    const [totalDoctors, searchTotal] = await Promise.all([
      this.doctorLeadModel.countDocuments(baseFilter),
      rawSearch ? this.doctorLeadModel.countDocuments(searchFilter) : Promise.resolve(null),
    ])

    return { totalDoctors, searchTotal: searchTotal ?? totalDoctors }
  }


  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')
    const lead = await this.doctorLeadModel.findById(id).lean()
    if (!lead) throw new NotFoundException('Doctor lead not found')
    return lead
  }

async update(id: string, dto: UpdateDoctorLeadDto) {
  if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')

  const existing = await this.doctorLeadModel
    .findById(id)
    .select('registrationNumber isVerified status')
    .lean()

  if (!existing) throw new NotFoundException('Doctor lead not found')

  const $set: any = {}
  const $unset: any = {}

  if ((dto as any).profession !== undefined) {
    const profession = this.normProfession((dto as any).profession)
    if (!profession) throw new BadRequestException('Invalid profession')
    $set.profession = profession
  }

  if (dto.fullName !== undefined) $set.fullName = this.cleanStr(dto.fullName)
  if (dto.mobileNumber !== undefined) $set.mobileNumber = this.normMobile(dto.mobileNumber)

  if (dto.email !== undefined) {
    const em = this.normEmailOrUndefined(dto.email)
    if (em) $set.email = em
    else $unset.email = 1
  }

  if (dto.cityOrPinCode !== undefined) {
    $set.cityOrPinCode = this.cleanStr(dto.cityOrPinCode)
  }

 if (dto.status !== undefined) {
  const allowedTransitions = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['DISBURSED'],
    REJECTED: [],
    DISBURSED: [],
  }

  const current = (existing as any).status
  const next = dto.status

  if (!allowedTransitions[current]?.includes(next)) {
    throw new BadRequestException(
      `Cannot change status from ${current} to ${next}`
    )
  }

  $set.status = next
}


  if ((dto as any).panNumber !== undefined) {
    const pan = this.normPANOrUndefined((dto as any).panNumber)
    if (pan) $set.panNumber = pan
    else $unset.panNumber = 1
  }

  if ((dto as any).aadharNumber !== undefined) {
    const aad = this.normAadharOrUndefined((dto as any).aadharNumber)
    if (aad) $set.aadharNumber = aad
    else $unset.aadharNumber = 1
  }

  if ((dto as any).registrationNumber !== undefined) {
    const reg = this.normRegNoOrUndefined((dto as any).registrationNumber)
    if (!reg) {
      $unset.registrationNumber = 1
      $set.isVerified = false
    } else {
      $set.registrationNumber = reg
      $set.isVerified = true
    }
  } else {
    if ((existing as any).registrationNumber && (existing as any).isVerified !== true)
      $set.isVerified = true
    if (!(existing as any).registrationNumber && (existing as any).isVerified === true)
      $set.isVerified = false
  }

  if (dto.yearsOfPractice !== undefined) {
    if (dto.yearsOfPractice === null) $unset.yearsOfPractice = 1
    else $set.yearsOfPractice = this.toNum(dto.yearsOfPractice)
  }

  if (dto.qualification !== undefined) {
    $set.qualification = Array.isArray(dto.qualification)
      ? dto.qualification.map((x) => this.cleanStr(x)).filter(Boolean)
      : []
  }

  if (dto.practiceType !== undefined) {
    $set.practiceType = Array.isArray(dto.practiceType)
      ? dto.practiceType.map((x) => this.cleanStr(x)).filter(Boolean)
      : []
  }

  if (dto.remarks !== undefined) {
    $set.remarks = dto.remarks === null ? '' : this.cleanStr(dto.remarks)
  }

  if ((dto as any).monthlyGrossIncome !== undefined)
    $set.monthlyGrossIncome = this.toNum((dto as any).monthlyGrossIncome)

  if ((dto as any).monthlyNetIncome !== undefined)
    $set.monthlyNetIncome = this.toNum((dto as any).monthlyNetIncome)

  if ((dto as any).otherIncomeSources !== undefined)
    $set.otherIncomeSources = this.toNum((dto as any).otherIncomeSources)

  if ((dto as any).monthlyEmi !== undefined)
    $set.monthlyEmi = this.toNum((dto as any).monthlyEmi)

  if ((dto as any).activeLoans !== undefined)
    $set.activeLoans = this.toNum((dto as any).activeLoans)

  if ((dto as any).loanType !== undefined)
    $set.loanType = this.normLoanType((dto as any).loanType)

  if ((dto as any).hasOverdue !== undefined)
    $set.hasOverdue = Boolean((dto as any).hasOverdue)

  if ((dto as any).hasProperty !== undefined)
    $set.hasProperty = Boolean((dto as any).hasProperty)

  if ((dto as any).propertyValue !== undefined)
    $set.propertyValue = this.toNum((dto as any).propertyValue)

  if ((dto as any).medicalEquipmentValue !== undefined)
    $set.medicalEquipmentValue = this.toNum((dto as any).medicalEquipmentValue)

  if ((dto as any).cibilScore !== undefined) {
    $set.cibilScore =
      (dto as any).cibilScore === null ? null : this.toNum((dto as any).cibilScore)
  }

  if (!Object.keys($set).length && !Object.keys($unset).length) {
    throw new BadRequestException('No fields to update')
  }

  const updateQuery: any = {}
  if (Object.keys($set).length) updateQuery.$set = $set
  if (Object.keys($unset).length) updateQuery.$unset = $unset

  const updated = await this.doctorLeadModel.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  }).lean()

  if (!updated) throw new NotFoundException('Lead not found')

  return updated
}

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')
    const deleted = await this.doctorLeadModel.findByIdAndDelete(id).lean()
    if (!deleted) throw new NotFoundException('Doctor lead not found')
    return { message: 'Doctor lead deleted successfully', deleted }
  }

  private parseFileToRows(file: Express.Multer.File): BulkRow[] {
    const name = (file.originalname || '').toLowerCase()

    if (name.endsWith('.xlsx')) {
      const wb = XLSX.read(file.buffer, { type: 'buffer' })
      const sheetName = wb.SheetNames?.[0]
      if (!sheetName) return []
      const sheet = wb.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      return Array.isArray(json) ? (json as BulkRow[]) : []
    }

    if (name.endsWith('.csv')) {
      const text = file.buffer.toString('utf8')
      const records = csvParse(text, { columns: true, skip_empty_lines: true, trim: true })
      return Array.isArray(records) ? (records as BulkRow[]) : []
    }

    throw new BadRequestException('Only .csv or .xlsx allowed')
  }

  private mapRowToLead(row: BulkRow): { incoming: Partial<DoctorLead> } {
    const profession = this.normProfession(
      row.profession ?? row.Profession ?? row['Professional Type'],
    )

    if (!profession) throw new BadRequestException('profession missing or invalid')

    const fullName = this.cleanStr(row.fullName ?? row.name ?? row['Full Name'] ?? row['Name'])
    const mobileNumber = this.normMobile(row.mobileNumber ?? row.mobile ?? row['Mobile'] ?? row['Phone'])
    const cityOrPinCode = this.cleanStr(row.cityOrPinCode ?? row.city ?? row.pincode ?? row['City/Pin'])

    if (!fullName) throw new BadRequestException('fullName missing')
    if (!mobileNumber) throw new BadRequestException('mobileNumber missing')
    if (!cityOrPinCode) throw new BadRequestException('cityOrPinCode missing')

    const email = this.normEmailOrUndefined(row.email ?? row['Email'])
    const reg = this.normRegNoOrUndefined(row.registrationNumber ?? row.regNo ?? row['Reg No'] ?? row['Registration Number'])
    const panNumber = this.normPANOrUndefined(row.panNumber ?? row.pan ?? row['PAN'] ?? row['Pan Number'])
    const aadharNumber = this.normAadharOrUndefined(row.aadharNumber ?? row.aadhar ?? row['Aadhar'] ?? row['Aadhar Number'] ?? row['AADHAR'])

    const yearsRaw = row.yearsOfPractice ?? row['Years Of Practice'] ?? row.experience
    const yearsOfPractice =
      yearsRaw === undefined || yearsRaw === null || yearsRaw === '' ? undefined : this.toNum(yearsRaw)

    const qualification = this.splitMulti(row.qualification ?? row['Qualification'])
    const practiceType = this.splitMulti(row.practiceType ?? row['Practice Type'])
    const remarks = this.cleanStr(row.remarks ?? row['Remarks'])

    const monthlyGrossIncome = this.toNum(row.monthlyGrossIncome ?? row['Monthly Gross Income'] ?? 0)
    const monthlyNetIncome = this.toNum(row.monthlyNetIncome ?? row['Monthly Net Income'] ?? 0)
    const otherIncomeSources = this.toNum(row.otherIncomeSources ?? row['Other Income'] ?? 0)

    const monthlyEmi = this.toNum(row.monthlyEmi ?? row['Monthly EMI'] ?? 0)
    const activeLoans = this.toNum(row.activeLoans ?? row['Active Loans'] ?? 0)
    const loanType = this.splitMulti(row.loanType ?? row['Loan Type'])

    const hasOverdue = this.safeBool(row.hasOverdue ?? row['Has Overdue'])
    const hasProperty = this.safeBool(row.hasProperty ?? row['Has Property'])
    const propertyValue = this.toNum(row.propertyValue ?? row['Property Value'] ?? 0)
    const medicalEquipmentValue = this.toNum(row.medicalEquipmentValue ?? row['Medical Equipment Value'] ?? 0)

    const cibilRaw = row.cibilScore ?? row.cibil ?? row['CIBIL'] ?? row['Cibil Score']
    const cibilScore = cibilRaw === undefined || cibilRaw === null || cibilRaw === '' ? null : this.toNum(cibilRaw)

    const incoming: Partial<DoctorLead> = {
      profession,
      fullName,
      mobileNumber,
      cityOrPinCode,
      ...(email ? { email } : {}),
      ...(reg ? { registrationNumber: reg } : {}),
      ...(panNumber ? { panNumber } : {}),
      ...(aadharNumber ? { aadharNumber } : {}),
      isVerified: this.computeVerified(reg),

      ...(yearsOfPractice !== undefined ? { yearsOfPractice } : {}),
      ...(qualification.length ? { qualification } : {}),
      ...(practiceType.length ? { practiceType } : {}),
      ...(remarks ? { remarks } : {}),

      monthlyGrossIncome,
      monthlyNetIncome,
      otherIncomeSources,
      monthlyEmi,
      activeLoans,
      ...(loanType.length ? { loanType } : {}),
      hasOverdue: Boolean(hasOverdue),

      hasProperty: Boolean(hasProperty),
      propertyValue,
      medicalEquipmentValue,
      cibilScore,
    }

    return { incoming }
  }

  async bulkSyncFromFile(file: Express.Multer.File) {
    const rows = this.parseFileToRows(file)
    if (!rows.length) throw new BadRequestException('No rows found in file')

    let inserted = 0
    let updated = 0
    let skipped = 0
    const errors: Array<{ rowIndex: number; reason: string }> = []

    const seenKeys = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      try {
        const { incoming } = this.mapRowToLead(rows[i])

        const dedupeKey = `${(incoming as any).profession}__${(incoming as any).mobileNumber}`
        if (seenKeys.has(dedupeKey)) {
          skipped++
          continue
        }
        seenKeys.add(dedupeKey)

        const existing = await this.doctorLeadModel.findOne({
          profession: (incoming as any).profession,
          mobileNumber: incoming.mobileNumber,
        })

        if (!existing) {
          await this.doctorLeadModel.create(incoming)
          inserted++
          continue
        }

        skipped++
      } catch (e: any) {
        errors.push({ rowIndex: i + 2, reason: e?.message || 'Invalid row' })
      }
    }

    return {
      message: 'Bulk sync completed',
      fileName: file.originalname,
      totalRows: rows.length,
      inserted,
      updated,
      skipped,
      errorCount: errors.length,
      errors: errors.slice(0, 50),
    }
  }
async uploadKyc(leadId: string, docType: string, file: Express.Multer.File) {
  if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

  const lead = await this.doctorLeadModel.findById(leadId)
  if (!lead) throw new NotFoundException('Lead not found')

  const key = `kyc/${leadId}/${Date.now()}-${file.originalname}`

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  )

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  await this.doctorLeadModel.findByIdAndUpdate(leadId, {
    $set: {
      [`kyc.${docType}.fileName`]: file.originalname,
      [`kyc.${docType}.s3Key`]: key,
      [`kyc.${docType}.fileUrl`]: fileUrl,
      [`kyc.${docType}.uploadedAt`]: new Date(),
      [`kyc.${docType}.status`]: 'UPLOADED',
    },
  })

  return { message: `${docType} uploaded successfully` }
}

  async verifyKyc(leadId: string, docType: string) {
  if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

  const lead = await this.doctorLeadModel.findById(leadId)
  if (!lead) throw new NotFoundException('Lead not found')

  // ✅ SAFETY FIX
  if (!lead.kyc?.[docType]) {
    throw new BadRequestException('Invalid KYC document type')
  }

  lead.kyc[docType].status = 'VERIFIED'
  lead.kyc[docType].verifiedAt = new Date()

  const panVerified = lead.kyc?.pan?.status === 'VERIFIED'
  const aadharVerified = lead.kyc?.aadhar?.status === 'VERIFIED'
  const regVerified = lead.regVerificationStatus === 'VERIFIED'

  lead.isVerified = panVerified && aadharVerified && regVerified

  await lead.save()

  return { message: `${docType} verified` }
}

async verifyRegistration(leadId: string) {
  if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

  const lead = await this.doctorLeadModel.findById(leadId)
  if (!lead) throw new NotFoundException('Lead not found')

  lead.regVerificationStatus = RegVerificationStatus.VERIFIED

  const panVerified = lead.kyc?.pan?.status === 'VERIFIED'
  const aadharVerified = lead.kyc?.aadhar?.status === 'VERIFIED'
  const regVerified = true

  lead.isVerified = panVerified && aadharVerified && regVerified

  await lead.save()

  return { message: 'Registration verified successfully' }
}

async approveLead(leadId: string) {
  const lead = await this.doctorLeadModel.findById(leadId)

  if (!lead) throw new NotFoundException('Lead not found')

  if (lead.status !== 'PENDING') {
    throw new BadRequestException('Only PENDING leads can be approved')
  }

  lead.status = LeadStatus.APPROVED
  await lead.save()

  return lead
}

async rejectLead(leadId: string) {
  const lead = await this.doctorLeadModel.findById(leadId)

  if (!lead) throw new NotFoundException('Lead not found')

  // ❌ only PENDING can be rejected
  if (lead.status !== LeadStatus.PENDING) {
    throw new BadRequestException(
      `Cannot reject lead with status ${lead.status}`
    )
  }

  lead.status = LeadStatus.REJECTED
  await lead.save()

  return lead
}

async disburseLead(leadId: string) {
  const lead = await this.doctorLeadModel.findById(leadId)

  if (!lead) throw new NotFoundException('Lead not found')

  // ❌ only APPROVED can be disbursed
  if (lead.status !== LeadStatus.APPROVED) {
    throw new BadRequestException(
      `Only APPROVED leads can be disbursed`
    )
  }

  lead.status = LeadStatus.DISBURSED
  await lead.save()

  return lead
}

  async rejectKyc(leadId: string, docType: string, remarks: string) {
    if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

    await this.doctorLeadModel.findByIdAndUpdate(leadId, {
      $set: {
        [`kyc.${docType}.status`]: 'REJECTED',
        [`kyc.${docType}.remarks`]: remarks,
      },
    })

    return { message: `${docType} rejected` }
  }

  async getKyc(leadId: string) {
    if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

    const lead = await this.doctorLeadModel.findById(leadId)
    if (!lead) throw new NotFoundException('Lead not found')

    return lead.kyc
  }

  async getCkycStatus(leadId: string) {
    if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

    const lead = await this.doctorLeadModel.findById(leadId)
    if (!lead) throw new NotFoundException('Lead not found')

    return {
      ckycStatus: lead.ckycStatus,
      kyc: lead.kyc,
    }
  }

  async viewKycFile(leadId: string, docType: string, res: any) {
    if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

    const lead = await this.doctorLeadModel.findById(leadId)
    if (!lead) throw new NotFoundException('Lead not found')

    const key = lead?.kyc?.[docType]?.s3Key
    if (!key) throw new NotFoundException('File not found')

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    })

    const file = await s3.send(command)
    const stream = file.Body as any
    stream.pipe(res)
  }

async downloadKycFile(leadId: string, docType: string) {
  const lead = await this.doctorLeadModel.findById(leadId);
  if (!lead) throw new NotFoundException('Lead not found');

  const key = lead?.kyc?.[docType]?.s3Key;
  if (!key) throw new NotFoundException('File not found');

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: 'attachment'
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 }) // 15 min

  return { url };
}

  async deleteKyc(leadId: string, docType: string) {
    if (!isValidObjectId(leadId)) throw new BadRequestException('Invalid leadId')

    const lead = await this.doctorLeadModel.findById(leadId)
    if (!lead) throw new NotFoundException('Lead not found')

    const key = lead?.kyc?.[docType]?.s3Key
    if (!key) throw new NotFoundException('File not found')

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
    )

    await this.doctorLeadModel.findByIdAndUpdate(leadId, {
      $unset: {
        [`kyc.${docType}`]: '',
      },
    })

    return { message: `${docType} deleted successfully` }
  }
}