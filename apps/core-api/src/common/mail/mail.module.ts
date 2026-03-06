import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import * as path from 'path';

@Global()
@Module({
  controllers: [],
  providers: [MailService],
  exports: [MailService],
  imports: [MailerModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_EMAIL,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        dir: path.join(__dirname,"templates"),
        adapter: new EjsAdapter({
          inlineCssEnabled : false
        }),
        options: {
          strict: false,
        },
      },
    })
  })]

})
export class MailModule {
}
