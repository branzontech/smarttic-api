import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssignedTicketFileService } from './assigned-ticket-file.service';
import { CreateAssignedTicketFileDto } from './dto/create-assigned-ticket-file.dto';
import { UpdateAssignedTicketFileDto } from './dto/update-assigned-ticket-file.dto';

@Controller('assignedTicketFile')
export class AssignedTicketFileController {
  constructor(private readonly assignedticketFileService: AssignedTicketFileService) {}

  @Post()
  create(@Body() createAssignedTicketFileDto: CreateAssignedTicketFileDto) {
    return this.assignedticketFileService.create(createAssignedTicketFileDto);
  }

  @Get()
  findAll() {
    return this.assignedticketFileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.assignedticketFileService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignedTicketFileDto: UpdateAssignedTicketFileDto) {
    // return this.assignedticketFileService.update(id, updateAssignedTicketFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.assignedticketFileService.remove(id);
  }
}
