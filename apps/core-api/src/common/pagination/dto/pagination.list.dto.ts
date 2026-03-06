
import { IsOptional } from 'class-validator';
import { IPaginationOrder } from '../interface/pagination.interface';

export class PaginationListDto {

    _search: Record<string, any>;

    _limit: number;

    _offset: number;
   
    _order: IPaginationOrder;

    @IsOptional()
    orderBy?: string;

     @IsOptional()
    _project?: Record<string, any>;

    @IsOptional()
    _where?: Record<string, any>;

    _page?: number;    

}
