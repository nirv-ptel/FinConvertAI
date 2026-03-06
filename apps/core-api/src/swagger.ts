import { NestApplication } from "@nestjs/core";
import { ENUM_APP_ENVIROMENT } from "./app/constants/app.enum.constant";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "@nestjs/common";

export default async function (app: NestApplication) {
    const logger = new Logger();
    const documentBuild = new DocumentBuilder()
        .setTitle('Repotics API')
        .setVersion('1.0')
        
        if (process.env.APP_ENV === ENUM_APP_ENVIROMENT.DEVELOPMENT) {
            documentBuild.addServer(`http://${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/`);
            // documentBuild.addServer('https://staging.repotics.online/api');
            // documentBuild.addServer('https://xpandanalytics.com/api');
        }
        //  else if (process.env.APP_ENV === ENUM_APP_ENVIROMENT.STAGING) {
        //     documentBuild.addServer('https://staging.repotics.online/api');
        // } else if (process.env.APP_ENV === ENUM_APP_ENVIROMENT.PRODUCTION) {
        //     documentBuild.addServer('https://xpandanalytics.com/api');
        // }
        documentBuild.addBearerAuth(
             {
                 // I was also testing it without prefix 'Bearer ' before the JWT
                 description: `[just text field] Please enter token in following format: Bearer <JWT>`,
                 name: 'Authorization',
                 bearerFormat: 'Bearer', // I`ve tested not to use this field, but the result was the same
                 scheme: 'Bearer',
                 type: 'http', // I`ve attempted type: 'apiKey' too
                 in: 'Header'
             },
             'access-token'
         )
        const document = SwaggerModule.createDocument(app,  documentBuild.build());
    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true
        },
    });
    logger.log(`Docs will serve on data`, 'NestApplication');
}