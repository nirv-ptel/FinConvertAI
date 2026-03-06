import { SetMetadata } from '@nestjs/common';

export const Database = (...args: string[]) => SetMetadata('database', args);

export function DatabaseQueryContain( field: string, value: string ) {

    return {
        [field]: {
            $regex: new RegExp(value),
            $options: 'i',
        },
    };
}


export function DatabaseQueryOr(queries: Record<string, any>[]) {
    return {
        $or: queries,
    };
}
