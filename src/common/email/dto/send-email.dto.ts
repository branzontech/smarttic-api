// src/modules/auth/dto/send-email.dto.ts
import { IsEmail, IsOptional, IsString, IsObject } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsOptional()
  to: string = 'palaciodimasluisenrique@gmail.com';

  @IsString()
  @IsOptional()
  subject: string = 'Correo de prueba';

  @IsString()
  @IsOptional()
  templateName: string = 'email-template.html';

  @IsObject()
  @IsOptional()
  context: Record<string, any> = {
    "estado": "ABIERTO",
    "numeroTicket": "Luigi 12345",
    "asunto": "Problema con la impresora",
    "departamento": "Contabilidad",
    "prioridad": "Media",
    "fechaCreacion": "08/04/2025 10:30",
    "fechaActualizacion": "08/04/2025 14:15",
    "comentarioTecnico": "He revisado el problema. Se necesitará reemplazar el cartucho de tóner. Visitaré su departamento mañana a las 10:00 AM para realizar el cambio.",
    "urlDetalle": "https://smarttic.com/tickets/12345",
    "logoUrl": "https://smarttic.com/assets/logo.png",
    "nombreEmpresa": "SMART TIC",
    "firmaSoporte": "Equipo de Soporte Técnico",
    "anio": "2025",
    "nombreEmpresaLegal": "Branzon Tech",
    "ciudad": "Cartagena, Colombia"
  };
}
