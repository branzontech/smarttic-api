import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  // Ruta relativa desde email.service.ts hasta la imagen del logo
  private readonly defaultLogoPath = path.join(
    __dirname,
    '..',
    'assets',
    'images',
    'logo',
    'logo_white.png',
  );

  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
    options: {
      attachments?: nodemailer.Attachment[];
      baseUrl?: string;
    } = {},
  ): Promise<void> {
    // Configuración de valores por defecto
    const baseUrl = options.baseUrl || process.env.FRONTEND_URL;
    const fullContext = { ...context, baseUrl };
    const html = this.renderTemplate(templateName, fullContext);

    try {
      // Adjuntos por defecto (logo)
      const defaultAttachments = [];

      if (fs.existsSync(this.defaultLogoPath)) {
        defaultAttachments.push({
          filename: 'logo.png',
          path: this.defaultLogoPath,
          cid: 'logo',
        });
      } else {
        console.warn(`Logo no encontrado en: ${this.defaultLogoPath}`);
      }

      // Combinar adjuntos (por defecto + personalizados)
      const attachments = options.attachments
        ? [...defaultAttachments, ...options.attachments]
        : defaultAttachments;
      to = 'PalacioDimasLuisEnrique@gmail.com';
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        html,
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`Error al enviar el correo a ${to}:`, error.message);
      throw new HttpException(
        'No se pudo enviar el correo. Intenta más tarde o contacta al soporte.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const fileName = templateName.endsWith('.html')
      ? templateName
      : `${templateName}.html`;
    const templatePath = path.join(__dirname, 'templates', fileName);

    if (!fs.existsSync(templatePath)) {
      throw new HttpException(
        `La plantilla ${fileName} no existe en templates.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    return template.replace(/{{(\w+)}}/g, (_, key) => context[key] || '');
  }
}
