import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ShortcutsService } from './shortcuts.service';
import { CreateShortcutDto } from './dto/create-shortcut.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { userSession } from 'src/common/types';
import { AuthzGuard } from 'src/common/guards/authz/authz.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Shortcuts')
@ApiBearerAuth('access-token')
@UseGuards(AuthzGuard)
@Controller('shortcuts')
export class ShortcutsController {
  constructor(private readonly shortcutsService: ShortcutsService) {}

  @Post()
  @ApiOperation({
    summary: 'Asignar shortcuts del usuario',
    description:
      'Reemplaza todos los shortcuts previos con los nuevos enviados en `menuIds`.',
  })
  @ApiBody({ type: CreateShortcutDto })
  @ApiResponse({
    status: 201,
    description: 'Shortcuts asignados correctamente.',
  })
  async assignShortcuts(
    @Body() dto: CreateShortcutDto,
    @CurrentUser() user: userSession,
  ) {
    return this.shortcutsService.assignShortcuts(user, dto.menuIds);
  }
}
