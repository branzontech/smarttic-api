import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssignedTicketDetailFileService } from './assigned-ticket-detail-file.service';
import { CreateAssignedTicketDetailFileDto } from './dto/create-assigned-ticket-detail-file.dto';
import { UpdateAssignedTicketDetailFileDto } from './dto/update-assigned-ticket-detail-file.dto';

@Controller('assigned-ticket-detail-file')
export class AssignedTicketDetailFileController {
  constructor(private readonly assignedTicketDetailFileService: AssignedTicketDetailFileService) {}

  @Post()
  create(@Body() createAssignedTicketDetailFileDto: CreateAssignedTicketDetailFileDto) {
    return this.assignedTicketDetailFileService.create(createAssignedTicketDetailFileDto);
  }

  @Get()
  findAll() {
    return this.assignedTicketDetailFileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.assignedTicketDetailFileService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignedTicketDetailFileDto: UpdateAssignedTicketDetailFileDto) {
    // return this.assignedTicketDetailFileService.update(+id, updateAssignedTicketDetailFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.assignedTicketDetailFileService.remove(+id);
  }
}
