import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_META_KEY, RESPONSE_STATUS_META_KEY } from '../constants/response.constant';
import { IResponse } from '../interface/response.interface';
import { HelperUtilService } from 'src/common/helper/services/helper.util.service';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  constructor(private reflector: Reflector) { }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (res: Promise<Record<string, any>>) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request: Request = ctx.getResponse();

        let messageRes = this.reflector.get<string>(RESPONSE_MESSAGE_META_KEY, context.getHandler());
        let statusCodeMeta = this.reflector.get<number>(RESPONSE_STATUS_META_KEY, context.getHandler());

        // set default response
        // let httpStatus: HttpStatus = response.statusCode;
        let statusCode: number = response.statusCode;
        let message: string;
        let data: Record<string, any> = undefined;
        let pagination: Record<string, any> = undefined;

        // response
        const responseData = (await res) as IResponse;

        if(statusCodeMeta){
          statusCode = statusCodeMeta;
        }
        if (messageRes) {
          message = messageRes;
        }

        if (responseData && responseData.data) {
          data = responseData.data;
        }
        if (responseData && responseData.message) {
          message = responseData.message;
        }
        if (responseData && responseData.status) {
          statusCode = responseData.status;
        }

        if (responseData && responseData.pagination) {
          pagination = responseData.pagination;
        }
        response.status(statusCode);
        response.data = data;
        return {
          path: request.url,
          statusCode,
          message,
          pagination,
          data,
        };
      })
    );
  }
}
