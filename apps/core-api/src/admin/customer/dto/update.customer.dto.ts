import { IsBoolean, IsNotEmpty } from 'class-validator';
import { CreateCustomerDto } from './create.customer.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';

export class UpdateCustomerDto extends PickType(CreateCustomerDto,['name','email','mobile','isResetPassword','password'] as const) {
    
    @ApiProperty({
        type: Boolean,
        example: true,
        required: false
    })
    @IsNotEmpty()
    @IsBoolean()
    readonly isActive: boolean;
}
