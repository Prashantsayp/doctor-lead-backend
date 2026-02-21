import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { DoctorLeadService } from './doctor-lead.service'
import { CreateDoctorLeadDto } from './dto/create-doctor-lead.dto'
import { UpdateDoctorLeadDto } from './dto/update-doctor-lead.dto'

@Controller('doctor-lead')
export class DoctorLeadController {
  constructor(private readonly doctorLeadService: DoctorLeadService) {}

  @Post('create-lead')
  create(@Body() dto: CreateDoctorLeadDto) {
    return this.doctorLeadService.create(dto)
  }

  @Get('get-lead')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorLeadService.findAll({ page, limit, search })
  }

@Get('count')
count(@Query('search') search?: string) {
  return this.doctorLeadService.count({ search })
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
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
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
