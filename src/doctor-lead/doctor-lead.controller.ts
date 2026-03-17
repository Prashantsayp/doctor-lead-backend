import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { DoctorLeadService } from './doctor-lead.service'
import { CreateDoctorLeadDto } from './dto/create-doctor-lead.dto'
import { UpdateDoctorLeadDto } from './dto/update-doctor-lead.dto'

@Controller('doctor-lead')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }),
)
export class DoctorLeadController {
  constructor(private readonly doctorLeadService: DoctorLeadService) {}

  @Post('create-lead')
  create(@Body() dto: CreateDoctorLeadDto) {
    return this.doctorLeadService.create(dto)
  }

  @Get('get-lead')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('keyword') keyword?: string,
    @Query('query') queryText?: string,
    @Query('verified') verified?: string,
    @Query('profession') profession?: string,
  ) {
    const finalSearch = (search ?? q ?? keyword ?? queryText ?? '').toString().trim()

    return this.doctorLeadService.findAll({
      page,
      limit,
      search: finalSearch || undefined,
      verified,
      profession,
    })
  }

  @Get('count')
  count(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('keyword') keyword?: string,
    @Query('query') queryText?: string,
    @Query('verified') verified?: string,
    @Query('profession') profession?: string,
  ) {
    const finalSearch = (search ?? q ?? keyword ?? queryText ?? '').toString().trim()

    return this.doctorLeadService.count({
      search: finalSearch || undefined,
      verified,
      profession,
    })
  }

  @Get('exists')
  exists(
    @Query('profession') profession?: string,
    @Query('registrationNumber') registrationNumber?: string,
    @Query('panNumber') panNumber?: string,
    @Query('mobileNumber') mobileNumber?: string,
    @Query('email') email?: string,
    @Query('aadharNumber') aadharNumber?: string,
  ) {
    return this.doctorLeadService.exists({
      profession,
      registrationNumber,
      panNumber,
      mobileNumber,
      email,
      aadharNumber,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorLeadService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorLeadDto) {
    return this.doctorLeadService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorLeadService.remove(id)
  }

  @Post('bulk-sync/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const name = (file.originalname || '').toLowerCase()
        const ok = name.endsWith('.csv') || name.endsWith('.xlsx')
        if (!ok) return cb(new BadRequestException('Only .csv or .xlsx allowed'), false)
        cb(null, true)
      },
    }),
  )
  uploadDoctorLeads(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required (field name: file)')
    return this.doctorLeadService.bulkSyncFromFile(file)
  }
}