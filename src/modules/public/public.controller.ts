import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('public') 
export class PublicController {
  @Get('users/image/:filename')
  async servePublicImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '..', '..', '..', 'uploads/users/profiles', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.sendFile(filePath);
  }

  @Get('file/download/:filename')
    @ApiOperation({ summary: 'Descargar o visualizar archivo cargado' })
    @ApiParam({
      name: 'filename',
      type: String,
      description: 'Nombre del archivo a descargar',
    })
    @ApiResponse({ status: 200, description: 'Archivo descargado correctamente' })
    async downloadFile(
      @Param('filename') filename: string,
      @Res() res: Response,
    ) {
      const filePath = join(__dirname, '..', '..', '..', 'uploads', filename);
  
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Archivo no encontrado');
      }
  
      return res.download(filePath);
    }
  
    @Get('file/view/:filename')
    @ApiOperation({ summary: 'Ver o descargar archivo asociado a una respuesta' })
    @ApiParam({ name: 'filename', type: String, description: 'Nombre del archivo' })
    async serveFile(@Param('filename') filename: string, @Res() res: Response) {
      const filePath = join(__dirname, '..', '..', '..', 'uploads', filename);
  
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Archivo no encontrado');
      }
  
      // Solo visualiza en el navegador
      return res.sendFile(filePath);
    }
}
