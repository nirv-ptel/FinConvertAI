import { Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { PaginationService } from 'src/common/pagination/services/pagination.service';
// import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationSearchPipe( availableSearch: string[] = [] ): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationSearchPipe implements PipeTransform {
        constructor(
            // @Inject(REQUEST) protected readonly request: IRequestApp,  
            private readonly paginationService: PaginationService
        ) { }

        async transform(
            value: Record<string, any>
        ): Promise<Record<string, any>> {
            if (availableSearch.length === 0 || !value?.search) {
                return value;
            }

            const search: Record<string, any> = this.paginationService.search(
                value?.search,
                availableSearch
            );
            return {
                ...value,
                _search: search,
                _availableSearch: availableSearch,
            };
        }

        
    }

    return mixin(MixinPaginationSearchPipe);
}
