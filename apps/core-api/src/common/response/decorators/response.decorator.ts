import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { RESPONSE_MESSAGE_META_KEY, RESPONSE_STATUS_META_KEY } from '../constants/response.constant';

export function Response<T>(message?:string,statusCode?:number): MethodDecorator {
    return applyDecorators(
        UseInterceptors(ResponseInterceptor<T>),
        SetMetadata(RESPONSE_MESSAGE_META_KEY,message),
        SetMetadata(RESPONSE_STATUS_META_KEY,statusCode)
    );
}



