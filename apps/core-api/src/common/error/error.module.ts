import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ErrorHttpFilter } from './filters/error.http.filter';
import { ValidationError, ValidatorOptions } from 'class-validator';
import { ErrorService } from './error.service';


@Global()
@Module({
    providers: [
        ErrorService,
         {
            provide: APP_PIPE,
            useFactory: (service: ErrorService) =>
                new ValidationPipe({
                    transform: true,
                    // whitelist: true,
                    skipNullProperties: false,
                    skipUndefinedProperties: false,
                    skipMissingProperties: false,
                    forbidUnknownValues: false,
                    exceptionFactory: (errors: ValidationError[]) => {
                        return service.extractFirstError(errors)
                    },
                }),
            inject: [ErrorService]
        },
        {
            provide: APP_FILTER,
            useClass: ErrorHttpFilter
        },
    ]
})
export class ErrorModule { }
