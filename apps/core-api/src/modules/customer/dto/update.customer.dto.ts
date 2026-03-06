import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create.customer.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class UpdateUserDto extends PickType(CreateUserDto, ['email', 'name', 'mobile', ] as const) {

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isResetPassword: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isActive: boolean;

    @ApiProperty({
        type: String,
        example: "password",
        required: true,
        description: "Password is required only if isResetPassword is true"
    })
    @IsString()
    // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/, {
    //     message: 'Password must be at least 12 characters long and include: one uppercase letter, one lowercase letter, one number, and one special character',
    // })
    @IsNotEmpty()
    @ValidateIf((o) => o.isResetPassword === true)
    readonly password: string;
}
