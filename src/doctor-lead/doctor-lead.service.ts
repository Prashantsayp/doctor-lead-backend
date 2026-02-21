import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, isValidObjectId } from 'mongoose'
import { CreateDoctorLeadDto } from './dto/create-doctor-lead.dto'
import { UpdateDoctorLeadDto } from './dto/update-doctor-lead.dto'
import { DoctorLead, DoctorLeadDocument } from './schemas/doctor-lead.schema'

import * as XLSX from 'xlsx'
import { parse as csvParse } from 'csv-parse/sync'

type BulkRow = Record<string, any>

@Injectable()
export class DoctorLeadService {
  constructor(
    @InjectModel(DoctorLead.name)
    private readonly doctorLeadModel: Model<DoctorLeadDocument>,
  ) {}


  private cleanStr(v: any) {
    return String(v ?? '').trim()
  }

  private toNum(v: any, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  private normEmail(v: any) {
    return this.cleanStr(v).toLowerCase()
  }

  private normMobile(v: any) {
    // keep digits only (handles +91 etc)
    return this.cleanStr(v).replace(/\D/g, '')
  }

  private normRegNo(v: any) {
    return this.cleanStr(v).toUpperCase()
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

  // ✅ SIMPLE: normalize loanType to string[]
  private normLoanType(v: any): string[] {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
    const s = String(v ?? '').trim()
    if (!s) return []
    return s.split(/[,|;]/g).map((x) => x.trim()).filter(Boolean)
  }

  // =========================
  // ✅ CRUD
  // =========================

  async create(dto: CreateDoctorLeadDto) {
    const payload: Partial<DoctorLead> = {
      fullName: this.cleanStr(dto.fullName),
      mobileNumber: this.cleanStr(dto.mobileNumber),
      email: this.normEmail(dto.email),
      cityOrPinCode: dto.cityOrPinCode ? this.cleanStr(dto.cityOrPinCode) : undefined,

      registrationNumber: this.cleanStr(dto.registrationNumber).toUpperCase(),

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

      remarks: dto.remarks ? this.cleanStr(dto.remarks) : '',

      consent: Boolean(dto.consent),

      // ✅ Income
      monthlyGrossIncome: dto.monthlyGrossIncome !== undefined ? this.toNum(dto.monthlyGrossIncome) : 0,
      monthlyNetIncome: dto.monthlyNetIncome !== undefined ? this.toNum(dto.monthlyNetIncome) : 0,
      otherIncomeSources: dto.otherIncomeSources !== undefined ? this.toNum(dto.otherIncomeSources) : 0,

      // ✅ Obligations
      monthlyEmi: dto.monthlyEmi !== undefined ? this.toNum(dto.monthlyEmi) : 0,
      activeLoans: dto.activeLoans !== undefined ? this.toNum(dto.activeLoans) : 0,

      // ✅ loanType as array
      loanType: this.normLoanType((dto as any).loanType),

      hasOverdue: Boolean(dto.hasOverdue),

      // ✅ Assets
      hasProperty: Boolean(dto.hasProperty),
      propertyValue: dto.propertyValue !== undefined ? this.toNum(dto.propertyValue) : 0,
      medicalEquipmentValue: dto.medicalEquipmentValue !== undefined ? this.toNum(dto.medicalEquipmentValue) : 0,

      // ✅ Credit
      cibilScore: dto.cibilScore === undefined ? null : dto.cibilScore,
    }

    const created = await this.doctorLeadModel.create(payload)
    return created.toObject()
  }

  async findAll(query?: { page?: any; limit?: any; search?: any }) {
    const page = Math.max(1, Number(query?.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)))
    const skip = (page - 1) * limit

    const search = this.cleanStr(query?.search)
    const filter: any = {}

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { loanType: { $elemMatch: { $regex: search, $options: 'i' } } },
      ]
    }

    const [items, total] = await Promise.all([
      this.doctorLeadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.doctorLeadModel.countDocuments(filter),
    ])

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')

    const lead = await this.doctorLeadModel.findById(id).lean()
    if (!lead) throw new NotFoundException('Doctor lead not found')
    return lead
  }


  async count(query?: { search?: any }) {
  const search = this.cleanStr(query?.search)

  const baseFilter: any = {}
  let searchFilter: any = {}

  if (search) {
    searchFilter = {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { loanType: { $elemMatch: { $regex: search, $options: 'i' } } },
      ],
    }
  }

  const [totalDoctors, searchTotal] = await Promise.all([
    this.doctorLeadModel.countDocuments(baseFilter),   // ✅ overall total
    search
      ? this.doctorLeadModel.countDocuments(searchFilter) // ✅ filtered total
      : Promise.resolve(null),
  ])

  return {
    totalDoctors,              // 📊 Total in DB
    searchTotal: searchTotal ?? totalDoctors, // 🔎 If search, return filtered else total
  }
}
  async update(id: string, dto: UpdateDoctorLeadDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')

    const updateData: any = {}

    if (dto.fullName !== undefined) updateData.fullName = this.cleanStr(dto.fullName)
    if (dto.mobileNumber !== undefined) updateData.mobileNumber = this.cleanStr(dto.mobileNumber)
    if (dto.email !== undefined) updateData.email = this.normEmail(dto.email)
    if (dto.cityOrPinCode !== undefined) updateData.cityOrPinCode = this.cleanStr(dto.cityOrPinCode)

    if (dto.registrationNumber !== undefined) {
      updateData.registrationNumber = this.cleanStr(dto.registrationNumber).toUpperCase()
    }

    if (dto.yearsOfPractice !== undefined) {
      updateData.yearsOfPractice = dto.yearsOfPractice === null ? null : this.toNum(dto.yearsOfPractice)
    }

    if (dto.qualification !== undefined) {
      updateData.qualification = Array.isArray(dto.qualification)
        ? dto.qualification.map((x) => this.cleanStr(x)).filter(Boolean)
        : []
    }

    if (dto.practiceType !== undefined) {
      updateData.practiceType = Array.isArray(dto.practiceType)
        ? dto.practiceType.map((x) => this.cleanStr(x)).filter(Boolean)
        : []
    }

    if (dto.remarks !== undefined) {
      updateData.remarks = dto.remarks === null ? '' : this.cleanStr(dto.remarks)
    }

    if (dto.consent !== undefined) updateData.consent = Boolean(dto.consent)

    // ✅ Income
    if (dto.monthlyGrossIncome !== undefined) updateData.monthlyGrossIncome = this.toNum(dto.monthlyGrossIncome)
    if (dto.monthlyNetIncome !== undefined) updateData.monthlyNetIncome = this.toNum(dto.monthlyNetIncome)
    if (dto.otherIncomeSources !== undefined) updateData.otherIncomeSources = this.toNum(dto.otherIncomeSources)

    // ✅ Obligations
    if (dto.monthlyEmi !== undefined) updateData.monthlyEmi = this.toNum(dto.monthlyEmi)
    if (dto.activeLoans !== undefined) updateData.activeLoans = this.toNum(dto.activeLoans)

    if ((dto as any).loanType !== undefined) updateData.loanType = this.normLoanType((dto as any).loanType)

    if (dto.hasOverdue !== undefined) updateData.hasOverdue = Boolean(dto.hasOverdue)

    // ✅ Assets
    if (dto.hasProperty !== undefined) updateData.hasProperty = Boolean(dto.hasProperty)
    if (dto.propertyValue !== undefined) updateData.propertyValue = this.toNum(dto.propertyValue)
    if (dto.medicalEquipmentValue !== undefined) updateData.medicalEquipmentValue = this.toNum(dto.medicalEquipmentValue)

    // ✅ Credit
    if (dto.cibilScore !== undefined)
      updateData.cibilScore = dto.cibilScore === null ? null : this.toNum(dto.cibilScore)

    const updated = await this.doctorLeadModel.findByIdAndUpdate(id, updateData, { new: true }).lean()
    if (!updated) throw new NotFoundException('Doctor lead not found')
    return updated
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')

    const deleted = await this.doctorLeadModel.findByIdAndDelete(id).lean()
    if (!deleted) throw new NotFoundException('Doctor lead not found')

    return { message: 'Doctor lead deleted successfully', deleted }
  }

  // =========================
  // ✅ BULK METHODS
  // =========================

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
      const records = csvParse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
      return Array.isArray(records) ? (records as BulkRow[]) : []
    }

    throw new BadRequestException('Only .csv or .xlsx allowed')
  }

  /**
   * ✅ mapRow returns:
   * - incoming: partial lead fields (only present values)
   * - orFilters: lookup filters by whichever identifiers exist
   * - canInsert: true only if schema required fields are present
   */
private mapRowToLead(row: BulkRow): {
  incoming: Partial<DoctorLead>
  orFilters: any[]
  canInsert: boolean
} {
  const fullName = this.cleanStr(row.fullName ?? row.name ?? row['Full Name'] ?? row['Name'])
  const mobileNumber = this.normMobile(row.mobileNumber ?? row.mobile ?? row['Mobile'] ?? row['Phone'])
  const email = this.normEmail(row.email ?? row['Email'])
  const registrationNumber = this.normRegNo(
    row.registrationNumber ?? row.regNo ?? row['Reg No'] ?? row['Registration Number'],
  )

  const cityOrPinCode = this.cleanStr(row.cityOrPinCode ?? row.city ?? row.pincode ?? row['City/Pin'])

  // ✅ REQUIRED checks (as per your rule)
  if (!fullName) throw new BadRequestException('fullName missing')
  if (!mobileNumber) throw new BadRequestException('mobileNumber missing')
  if (!cityOrPinCode) throw new BadRequestException('cityOrPinCode missing')

  // ✅ build OR filters only for keys that exist
  const orFilters: any[] = []
  if (mobileNumber) orFilters.push({ mobileNumber }) // required anyway
  if (registrationNumber) orFilters.push({ registrationNumber })
  if (email) orFilters.push({ email })

  const yearsRaw = row.yearsOfPractice ?? row['Years Of Practice'] ?? row.experience
  const yearsOfPractice =
    yearsRaw === undefined || yearsRaw === null || yearsRaw === '' ? undefined : this.toNum(yearsRaw)

  const qualification = this.splitMulti(row.qualification ?? row['Qualification'])
  const practiceType = this.splitMulti(row.practiceType ?? row['Practice Type'])
  const remarks = this.cleanStr(row.remarks ?? row['Remarks'])
  const consent = row.consent ?? row['Consent']

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
  const cibilScore =
    cibilRaw === undefined || cibilRaw === null || cibilRaw === '' ? null : this.toNum(cibilRaw)

  // ✅ INSERT condition updated (email + regNo NOT required)
  const canInsert = Boolean(fullName && mobileNumber && cityOrPinCode)

  const incoming: Partial<DoctorLead> = {
    fullName,
    mobileNumber,
    cityOrPinCode,

    ...(email ? { email } : {}),
    ...(registrationNumber ? { registrationNumber } : {}),

    ...(yearsOfPractice !== undefined ? { yearsOfPractice } : {}),
    ...(qualification.length ? { qualification } : {}),
    ...(practiceType.length ? { practiceType } : {}),
    ...(remarks ? { remarks } : {}),
    ...(consent !== undefined ? { consent: Boolean(this.safeBool(consent)) } : {}),

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

  return { incoming, orFilters, canInsert }
}


  private buildEnrichedUpdate(existing: any, incoming: Partial<DoctorLead>) {
    const upd: any = {}

    const setIfExistingEmpty = (key: keyof DoctorLead) => {
      const inc: any = (incoming as any)[key]
      if (inc === undefined) return
      const ex: any = existing?.[key]

      if (Array.isArray(inc)) {
        const merged = Array.from(new Set([...(Array.isArray(ex) ? ex : []), ...inc].filter(Boolean)))
        upd[key] = merged
        return
      }

      if (typeof inc === 'number') {
        if (Number.isFinite(inc)) upd[key] = inc
        return
      }

      if (inc === null) {
        upd[key] = null
        return
      }

      const exEmpty =
        ex === undefined ||
        ex === null ||
        (typeof ex === 'string' && ex.trim() === '') ||
        (Array.isArray(ex) && ex.length === 0)

      if (exEmpty) upd[key] = inc
    }

    // basic
    setIfExistingEmpty('fullName')
    setIfExistingEmpty('mobileNumber')
    setIfExistingEmpty('email')
    setIfExistingEmpty('registrationNumber')
    setIfExistingEmpty('cityOrPinCode')
    setIfExistingEmpty('yearsOfPractice')
    setIfExistingEmpty('qualification')
    setIfExistingEmpty('practiceType')
    setIfExistingEmpty('remarks')
    setIfExistingEmpty('consent')

    // Income
    setIfExistingEmpty('monthlyGrossIncome')
    setIfExistingEmpty('monthlyNetIncome')
    setIfExistingEmpty('otherIncomeSources')

    // Obligations
    setIfExistingEmpty('monthlyEmi')
    setIfExistingEmpty('activeLoans')
    setIfExistingEmpty('loanType')
    setIfExistingEmpty('hasOverdue')

    // Assets
    setIfExistingEmpty('hasProperty')
    setIfExistingEmpty('propertyValue')
    setIfExistingEmpty('medicalEquipmentValue')

    // Credit
    setIfExistingEmpty('cibilScore')

    return upd
  }

async bulkSyncFromFile(file: Express.Multer.File) {
  const rows = this.parseFileToRows(file)
  if (!rows.length) throw new BadRequestException('No rows found in file')

  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ rowIndex: number; reason: string }> = []

  const seenMobile = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    try {
      const { incoming } = this.mapRowToLead(rows[i]) // ✅ will throw if name/mobile/city missing

      // ✅ file-level duplicate by mobile
      const mob = String((incoming as any).mobileNumber || '')
      if (seenMobile.has(mob)) {
        skipped++
        continue
      }
      seenMobile.add(mob)

      // ✅ dedupe in DB by mobile (since mobile is mandatory)
      const existing = await this.doctorLeadModel.findOne({ mobileNumber: incoming.mobileNumber })

      if (!existing) {
        await this.doctorLeadModel.create(incoming)
        inserted++
        continue
      }

      const upd = this.buildEnrichedUpdate(existing, incoming)
      if (!Object.keys(upd).length) {
        skipped++
        continue
      }

      await this.doctorLeadModel.updateOne({ _id: existing._id }, { $set: upd })
      updated++
    } catch (e: any) {
      const msg = String(e?.message || '')

      // ✅ if regNo unique index enabled and duplicate happens
      if (msg.includes('E11000') && msg.toLowerCase().includes('registrationnumber')) {
        errors.push({ rowIndex: i + 2, reason: 'Duplicate registrationNumber' })
      } else {
        errors.push({ rowIndex: i + 2, reason: e?.message || 'Invalid row' })
      }
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

}
