import { Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { PaginationService } from '../services/pagination.service';

export function PaginationProjectPipe(availableList: string[] = []): Type<PipeTransform> {
  @Injectable({ scope: Scope.REQUEST })
  class MixinPaginationListPipe implements PipeTransform {
    constructor(  
      private readonly paginationService: PaginationService
    ) { }
    async transform(value: Record<string, any>): Promise<Record<string, any>> {
      if (availableList.length === 0 && !value?.fields) {
        return value;
      }

      const project: Record<string, any> = this.paginationService.project( value?.fields, availableList );
      return {
        ...value,
        _project: project,
        _availableList: availableList,
    };

    }
  }
  return mixin(MixinPaginationListPipe);
}
