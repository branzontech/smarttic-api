import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { SurveyCalificationService } from 'src/modules/survey-calification/survey-calification.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly surveyCalificationService: SurveyCalificationService,
  ) {}

  private readonly defaultLogoPath = path.join(
    __dirname,
    '..',
    'assets',
    'images',
    'logo',
    'logo.png',
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
    survey: boolean = false,
    options: {
      attachments?: nodemailer.Attachment[];
      baseUrl?: string;
    } = {},
  ): Promise<void> {

    try {
      const baseUrl = options.baseUrl || process.env.FRONTEND_URL;
      let ratingButtonsHtml = '';
      
      if (survey) {
        const calificationResponse = this.surveyCalificationService.findAll();
        const calificationData = (await calificationResponse).data;
        ratingButtonsHtml = calificationData
          .map((item) => {
            const surveyData = {
              ticketId: context.ticketId,
              userId: context.userId,
              surveyCalificationId: item.id,
            };
            const encodedData = Buffer.from(
              JSON.stringify(surveyData),
            ).toString('base64');
            const url = `${baseUrl}/surveyResponse/${encodedData}`;

            return `
              <a class="feedback-button" href="${url}">                
                <span style="vertical-align: middle;">${item.title}</span>
              </a>
            `;
          })
          .join('');

        // startRatingsHtml = calificationData
        // .map((item, index) => {
        //   const surveyData = {
        //     ticketId: context.ticketId || '',
        //     userId: context.userId || '',
        //     surveyCalificationId: item.id
        //   };
        //   const encodedData = Buffer.from(JSON.stringify(surveyData)).toString('base64');
        //   const url = `${baseUrl}/surveyResponse/${encodedData}`;
        //   return `
        //   <a href="${url}" class="star-rating" data-rating="${index+1}">★</a>
        //   `;
        // })
        // .join('');
      }
      const fullContext = { ...context, baseUrl, ratingButtonsHtml };
      const html = this.renderTemplate(templateName, fullContext);
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
