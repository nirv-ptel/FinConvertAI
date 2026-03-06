import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { Reflector } from '@nestjs/core';
import { ACTIVITYLOG_COLLECTION_META_KEY, ACTIVITYLOG_METHOD_NAME } from '../constants/activity-log.constant';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { IResponse } from 'src/common/response/interface/response.interface';
import { AUDITLOG, CUSTOMER, CUSTOMERMASTER } from 'src/common/database/constants/collection.constant';

@Injectable()
export class AdminActivitylogInterceptor implements NestInterceptor {

  constructor(
    private readonly _masterQueriesService: MasterQueriesDatabaseService,
    private readonly _queriesDatabaseService: QueriesDatabaseService,
    private reflector: Reflector
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const now = Date.now();
    const ctx: HttpArgumentsHost = context.switchToHttp();
    const request = ctx.getRequest();
    const collectionName = this.reflector.get<string>(ACTIVITYLOG_COLLECTION_META_KEY, context.getHandler());
    const { method, params, body } = request;
    let beforeData = null;
    if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && params['id']) {
      beforeData = await this._masterQueriesService.findOne(collectionName, { _id: params['id'] });
    } else if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && body['id']) {
      beforeData = await this._masterQueriesService.findOne(collectionName, { _id: body['id'] });
    } else if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'POST') && collectionName && body['_id']) {
      beforeData = await this._masterQueriesService.findOne(collectionName, { _id: body['_id'] });
    }

    return next.handle().pipe(
      map(async (res: Promise<any>) => {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const _res = ctx.getResponse();
        const request = ctx.getRequest();
        const { user, url, method, body, params, query, tenantId } = request;
        const response = (await res) as IResponse;

        const methodName = this.reflector.get<string>(ACTIVITYLOG_METHOD_NAME, context.getHandler());
        const logData: Record<string, any> = {
          ownerId: user?.ownerId || null,
          userId: user?.userId,
          tenantId: tenantId || null,
          name: user?.name || null,
          email: user?.email || null,
          company: user?.company || null,
          methodName: methodName,
          method: method,
          originalUrl: url,
          params: JSON.stringify(params),
          query: JSON.stringify(query),
          payload: JSON.stringify(body),
          publicIp: request.headers.ip ? request.headers.ip : "",
          before: beforeData,
          after: body,
          responseStatus: _res.statusCode
        };

        if (!collectionName || collectionName == undefined) {
          return response;
        }

        if (collectionName == CUSTOMERMASTER) {
          await this._masterQueriesService.find(CUSTOMERMASTER, { _id: user?.userId }, { tenantId: 1 })
            .then((customer) => {
              return this._queriesDatabaseService.find(customer[0].tenantId, CUSTOMER, { _id: user?.userId })
                .then((response) => {
                  logData['after'] = response.length ? response[0] : "";
                })
            });
        } else {
          await this._masterQueriesService.find(collectionName, { _id: params['id'] }).then((response) => {
            logData['after'] = response.length ? response[0] : "";
          });
        }
        await this._masterQueriesService.insert(AUDITLOG, logData);
        return response;
      }),
    );
  }
}
