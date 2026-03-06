import { Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { ObjectId } from 'mongodb';
import { DatabaseQueryContain } from 'src/common/database/decorators/database.decorator';
import { PaginationService } from 'src/common/pagination/services/pagination.service';

export function PaginationWherePipe(availableList: string[] = []): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationWherePipe implements PipeTransform {

        async transform(value: Record<string, any>): Promise<Record<string, any>> {
            // const where :Record<string,any>= value.where;
            const condition: Record<string, any> = {};
            for (let list of availableList) {
                if (value[list]) {
                    if (value[list] && !isNaN(value[list])) {
                        condition[list] = parseInt(value[list]);
                    }
                    else if (value[list] && value[list].constructor == String && ["true", "false"].includes(value[list].toLowerCase())) {
                        condition[list] = value[list].toLowerCase() === "true" ? true : false;
                    }
                    else if (value[list].constructor == String && !(ObjectId.isValid(value[list] as string))) {
                        Object.assign(condition, DatabaseQueryContain(list, value[list] as string))
                    }
                    else if (value[list].constructor == String && ObjectId.isValid(value[list] as string)) {
                        condition[list] = value[list];
                    }
                    else if (value[list].constructor == Array) {
                        condition[list] = { $in: value[list] };
                    }
                    else if (ObjectId.isValid(value[list])) {
                        condition[list] = { $in: [value[list]] };
                    }
                }
            }

            return {
                ...value,
                _where: condition
            };
        }

    }

    return mixin(MixinPaginationWherePipe);
}
