import { Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from 'src/common/pagination/constants/pagination.constant';
import { PaginationService } from 'src/common/pagination/services/pagination.service';

export function AdminPaginationPagingPipe(defaultPerPage: number = PAGINATION_DEFAULT_LIMIT): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })

    class MixinPaginationPagingPipe implements PipeTransform {
        constructor(
            private readonly paginationService: PaginationService
        ) { }

        async transform(value: Record<string, any>): Promise<Record<string, any>> {
            const page: number =Number.parseInt(value?.page)  ? Number.parseInt(value?.page) + 1 : PAGINATION_DEFAULT_PAGE;
            const perPage: number = value?.limit == -1 ? 1000: Number.parseInt(value?.limit  ?? defaultPerPage);
            const offset: number = this.paginationService.offset(page, perPage);

            return {
                ...value,
                page,
                perPage,
                _limit: perPage,
                _offset: offset,
                _page : page
            };
        }

    }

    return mixin(MixinPaginationPagingPipe);
}
