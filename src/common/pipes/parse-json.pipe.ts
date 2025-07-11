import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any) {
    try {
      if (value === undefined || value === null) {
        throw new Error('Valor nulo o indefinido');
      }
      
      if (typeof value === 'object' && !(value instanceof Buffer)) {
        return value;
      }
      
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      
      throw new Error('Formato no soportado');
    } catch (e) {
      throw new BadRequestException(`Error al parsear JSON: ${e.message}`);
    }
  }
}