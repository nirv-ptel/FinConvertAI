import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { HelperDateService } from "src/common/helper/services/helper.date.service";

@ValidatorConstraint({ name: 'IsISODateValidConstraint', async: false })
@Injectable()
class IsISODateValidConstraint implements ValidatorConstraintInterface {

    constructor(private readonly _helperDateService: HelperDateService = new HelperDateService()){}
    validate(_value: string, _args: ValidationArguments): boolean {

        if (!_value) return false;

        return (typeof _value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/.test(_value) && !isNaN(Date.parse(_value)));
    }

    defaultMessage(_args: ValidationArguments): string {
        return `'${_args.property}' must be a valid ISO 8601 datetime string`;
    }
}

export function IsISODateValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsISODateValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsISODateValidConstraint,
        });
    };
}