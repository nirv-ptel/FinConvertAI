import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { ACTIVITYLOG_COLLECTION_META_KEY, ACTIVITYLOG_METHOD_NAME } from '../constants/activity-log.constant';
import { IResponse } from 'src/common/response/interface/response.interface';
import { AUDITLOG } from 'src/common/database/constants/collection.constant';


@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
    constructor(
        private readonly _queriesDatabaseService: QueriesDatabaseService,
        private reflector: Reflector
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const request = ctx.getRequest();
        const collectionName = this.reflector.get<string>(ACTIVITYLOG_COLLECTION_META_KEY, context.getHandler());
        const { method, params, body,tenantId } = request;
        let beforeData = null;
        if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && params['id']){
            beforeData = await this._queriesDatabaseService.findOne(tenantId,collectionName, {_id:params['id']}); 
        }else if((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && body['id']){
            beforeData = await this._queriesDatabaseService.findOne(tenantId,collectionName, {_id: body['id']});
        }else if((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && body['_id']){
            beforeData = await this._queriesDatabaseService.findOne(tenantId,collectionName, {_id: body['_id']});
        }

        return next.handle().pipe(
            map(async (res: Promise<any>) => {
                    const ctx: HttpArgumentsHost = context.switchToHttp();
                    const _res = ctx.getResponse();
                    const request = ctx.getRequest();
                    const { user, url, method, body, params, query } = request;
                    let tenantId = request['tenantId'];
                    const response = (await res) as IResponse;

                    const methodName = this.reflector.get<string>(ACTIVITYLOG_METHOD_NAME, context.getHandler());
                    const audit_log : Record<string, any> = {
                        ownerId: user?.ownerId || "",
                        userId: user?.userId || "",
                        tenantId: tenantId || "",
                        name: user?.name || "",
                        email: user?.email || "",
                        company: user?.company || "",
                        methodName: methodName,
                        method: method,
                        originalUrl: url,
                        params: JSON.stringify(params),
                        query: JSON.stringify(query),
                        payload: JSON.stringify(body),
                        before : beforeData ? beforeData : "",
                        after : body,
                        publicIp: request.headers.ip ? request.headers.ip : "",                    
                        responseStatus: _res.statusCode
                    };

                    if(!collectionName || collectionName == undefined){
                        return response;
                    }
                    await this._queriesDatabaseService.find(tenantId,collectionName, {_id:params['id']}).then((response)=>{
                        audit_log['after'] =  response.length ? response[0] : "";
                    });
                    if(["reset_password"].includes(methodName)){
                        tenantId= response.tenantId;
                        delete response.tenantId
                    }
                    await this._queriesDatabaseService.insert(tenantId,AUDITLOG, audit_log);
                    return response;
                }),
            );
    }
}
