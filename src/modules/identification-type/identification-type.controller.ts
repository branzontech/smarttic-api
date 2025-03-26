import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IdentificationTypeService } from 'src/modules/identification-type/identification-type.service';
import { CreateIdentificationTypeDto } from 'src/modules/identification-type/dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from 'src/modules/identification-type/dto/update-identification-type.dto';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';

@ApiBearerAuth('access-token') 
@Controller('identificationType')
@UseGuards(AuthzGuard)
export class IdentificationTypeController {
  constructor(private readonly identificationTypeService: IdentificationTypeService) {}

  @Post()
  create(@Body() createIdentificationTypeDto: CreateIdentificationTypeDto) {
    return this.identificationTypeService.create(createIdentificationTypeDto);
  }

  @Get()
  findAll() {
    return this.identificationTypeService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.identificationTypeService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIdentificationTypeDto: UpdateIdentificationTypeDto) {
    return this.identificationTypeService.update(id, updateIdentificationTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.identificationTypeService.remove(id);
  }
}
