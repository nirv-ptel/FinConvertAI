import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly mailerService: MailerService) { }

  async sendMail(to: string, subject: string, template: string, context: Record<string, any>, attachments = [], cc: string = "", bcc: string = ""): Promise<boolean> {
    // return Promise.resolve(true);
    return this.mailerService.sendMail({
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      template: template,
      context: context,
      attachments: attachments
    }).then(() => {
      return true;
    }).catch((err) => {
      this.logger.error(err);
      return false;
    })
  }
}
