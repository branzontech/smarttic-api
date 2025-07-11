// src/modules/auth/dto/send-email.dto.ts
import { IsEmail, IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsOptional()
  to: string = 'palaciodimasluisenrique@gmail.com';

  @IsString()
  @IsOptional()
  subject: string = 'Correo de prueba';

  @IsString()
  @IsOptional()
  templateName: string = 'email-template-closet.html';

  @IsObject()
  @IsOptional()
  context: Record<string, any> = {
    fullname: `Usuario Prueba`,
    ticketState: 'CERRADO',
    prefix: 'prefix',
    ticketId: 'idticketPrueba',
    userId: 'idUserPrueba',
    ticketNumber: 2,
    ticketTitle: 'titulo de prueba',
    ticketPriority: 'alta',
    ticketCreatedAt: '30-05-2025',
  };

  @IsBoolean()
  @IsOptional()
  survey:boolean = true;
}
