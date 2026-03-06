import { Injectable } from '@nestjs/common';
import { PAGINATION_DEFAULT_AVAILABLE_ORDER_BY, PAGINATION_DEFAULT_ORDER_BY, PAGINATION_DEFAULT_ORDER_DIRECTION } from '../constants/pagination.constant';
import { DatabaseQueryContain, DatabaseQueryOr } from 'src/common/database/decorators/database.decorator';
import { IPaginationOrder } from '../interface/pagination.interface';

@Injectable()
export class PaginationService {

    offset(page: number, perPage: number): number {
        const offset: number = (page - 1) * perPage;
        return offset;
    }

    order(orderByValue = PAGINATION_DEFAULT_ORDER_BY, orderDirectionValue = PAGINATION_DEFAULT_ORDER_DIRECTION, availableOrderBy = PAGINATION_DEFAULT_AVAILABLE_ORDER_BY): IPaginationOrder {


        const orderBy: string = availableOrderBy.includes(orderByValue) ? orderByValue : PAGINATION_DEFAULT_ORDER_BY;

        return { [orderBy]: orderDirectionValue };
    }

    search(searchValue: string, availableSearch: string[]): Record<string, any> {
        if (
            !searchValue ||
            searchValue === '' ||
            availableSearch.length === 0
        ) {
            return;
        }
        searchValue = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return DatabaseQueryOr(availableSearch.map(val => DatabaseQueryContain(val, searchValue)));
    }

    project(listValue: string, availableField: string[]): Record<string, any> {
        let project = {};
        if (!listValue || listValue === '') {
            availableField.forEach(v => {
                project[v] = 1;
            });
            return project;
        }

        let fields: string[] = listValue.split(',');
        if (fields.length) {
            availableField.forEach(v => {
                if (fields.includes(v)) {
                    project[v] = 1;
                }
            });
        }
        return project;
    }
}
