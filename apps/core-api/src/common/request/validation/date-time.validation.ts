import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { HelperDateService } from "src/common/helper/services/helper.date.service";

@ValidatorConstraint({ name: 'IsDateTimeConstraint', async: false })
@Injectable()
class IsDateTimeConstraint implements ValidatorConstraintInterface {
    constructor(private readonly _helperDateService: HelperDateService = new HelperDateService()){}

    validate(_value: string, _args: ValidationArguments): boolean {

        if (!_value) return false;
        return this._helperDateService.validateDate(_value);
    }

    defaultMessage(_args: ValidationArguments): string {
        return `'${_args.property}' must be in 'YYYY-MM-DD HH:mm:ss' format`;
    }
}

export function IsDateTimeValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsDateTimeValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsDateTimeConstraint,
        });
    };
}