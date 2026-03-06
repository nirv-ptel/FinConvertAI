import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiSecurity } from "@nestjs/swagger";


export function DocAuth(): MethodDecorator{
    return applyDecorators(
        ApiBearerAuth('access-token'),
        // ApiSecurity('x-tenant-id')
    )
}

export function DocQueryList(): MethodDecorator {
    return applyDecorators(
        ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
        ApiQuery({ name: 'page', required: false, type: Number, example: 0 }),
        ApiQuery({ name: 'order', required: false, type: Number, example: 1 }),
        ApiQuery({ name: 'orderBy', required: false, type: String, example: '' }),
        ApiQuery({ name: 'search', required: false, type: String, example: '' }),
        ApiQuery({ name: 'searchby', required: false, type: String, example: '' }),
        ApiQuery({ name: 'fields', required: false, type: String, example: '' })
    );
}