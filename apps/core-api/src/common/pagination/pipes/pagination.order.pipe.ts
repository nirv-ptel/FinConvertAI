import { Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import {
    PAGINATION_DEFAULT_ORDER_BY,
    PAGINATION_DEFAULT_ORDER_DIRECTION,
} from 'src/common/pagination/constants/pagination.constant';
import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from 'src/common/pagination/enums/pagination.enum';
import { PaginationService } from 'src/common/pagination/services/pagination.service';

export function PaginationOrderPipe( defaultOrderBy: string = PAGINATION_DEFAULT_ORDER_BY, defaultOrderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE = PAGINATION_DEFAULT_ORDER_DIRECTION, availableList: string[] = []): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationOrderPipe implements PipeTransform {
        constructor(            
            private readonly paginationService: PaginationService
        ) {}

        async transform(
            value: Record<string, any>
        ): Promise<Record<string, any>> {
            const orderBy: string = value?.orderBy ?? defaultOrderBy;
            const orderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE = Number(value?.order ?? +defaultOrderDirection);
            const order: Record<string, any> = this.paginationService.order( orderBy, orderDirection, availableList );

            return {
                ...value,
                _order: order
            };
        }

    }

    return mixin(MixinPaginationOrderPipe);
}
