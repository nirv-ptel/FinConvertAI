import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from "../enums/pagination.enum";


export type IPaginationOrder = Record<
    string,
    ENUM_PAGINATION_ORDER_DIRECTION_TYPE
>;

export interface IPaginationQueryOptions {
    defaultPerPage?: number;
    defaultOrderBy?: string;
    defaultOrderDirection?: ENUM_PAGINATION_ORDER_DIRECTION_TYPE;
    availableOrderBy?: string[];
    availableSearch?: string[];
    availableList?: string[];

}
export interface IPaginationOptions {
    total?: number;
    page?: number;
    limit?: number;
}