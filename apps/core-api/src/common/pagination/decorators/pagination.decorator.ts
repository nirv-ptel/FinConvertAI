import { Query, SetMetadata } from '@nestjs/common';
import { IPaginationQueryOptions } from '../interface/pagination.interface';
import { PaginationSearchPipe } from '../pipes/pagination.search.pipe';
import { PaginationPagingPipe } from '../pipes/pagination.paging.pipe';
import { PaginationOrderPipe } from '../pipes/pagination.order.pipe';
import { PaginationProjectPipe } from '../pipes/pagination.project.pipe';
import { PaginationWherePipe } from '../pipes/pagination.where.pipe';
import { AdminPaginationPagingPipe } from '../pipes/admin.pagination.paging.pipe';

export const Pagination = (...args: string[]) => SetMetadata('pagination', args);

export function PaginationQuery( options?: IPaginationQueryOptions): ParameterDecorator {
    return Query(
        PaginationSearchPipe(options?.availableSearch),
        PaginationPagingPipe(options?.defaultPerPage),
        PaginationOrderPipe( options?.defaultOrderBy, options?.defaultOrderDirection, options.availableList),
        PaginationProjectPipe(options?.availableList),
        PaginationWherePipe(options?.availableList)
    );
}

export function AdminPaginationQuery( options?: IPaginationQueryOptions): ParameterDecorator {
    return Query(
        PaginationSearchPipe(options?.availableSearch),
        AdminPaginationPagingPipe(options?.defaultPerPage),
        PaginationOrderPipe( options?.defaultOrderBy, options?.defaultOrderDirection,options.availableList),
        PaginationProjectPipe(options?.availableList),
        PaginationWherePipe(options?.availableList)
    );
}
