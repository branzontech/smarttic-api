import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  async sendEmail(to: string, subject: string, template: string, context: Record<string, any>): Promise<void> {
    const html = this.renderTemplate(template, context);
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`Correo enviado a ${to} con el asunto "${subject}".`);
  }

  private renderTemplate(template: string, context: Record<string, any>): string {
    // Renderiza la plantilla reemplazando las variables {{key}} con los valores del contexto
    return template.replace(/{{(\w+)}}/g, (_, key) => context[key] || '');
  }
}