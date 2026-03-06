import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ACTIVITYLOG_COLLECTION_META_KEY, ACTIVITYLOG_METHOD_NAME } from '../constants/activity-log.constant';
import { ActivityLogInterceptor } from '../interceptors/activity-log.interceptor';
import { AdminActivitylogInterceptor } from '../interceptors/admin.activitylog.interceptor';


export function ActivityLog(methodName: string, collectionName?: string): MethodDecorator {
    return applyDecorators(
        UseInterceptors(ActivityLogInterceptor),
        SetMetadata(ACTIVITYLOG_METHOD_NAME, methodName),
        SetMetadata(ACTIVITYLOG_COLLECTION_META_KEY, collectionName)
    );
}

export function AdminActivityLog(methodName?: string, collectionName?: string): MethodDecorator {
    return applyDecorators(
        UseInterceptors(AdminActivitylogInterceptor),
        SetMetadata(ACTIVITYLOG_METHOD_NAME, methodName),
        SetMetadata(ACTIVITYLOG_COLLECTION_META_KEY, collectionName)
    );
}