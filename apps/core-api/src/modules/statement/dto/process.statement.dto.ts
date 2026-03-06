import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProcessStatementDto {
    @ApiProperty({
        type: String,
        description: 'Password for encrypted PDF bank statements',
        example: 'mysecretpassword123',
        required: false,
    })
    @IsOptional()
    @IsString()
    password: string = '';
}
