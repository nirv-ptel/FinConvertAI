import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'IsMacValidConstraint', async: false })
@Injectable()
class IsMacValidConstraint implements ValidatorConstraintInterface {
    validate(_value: string, _args: ValidationArguments): boolean {

        if (!_value) return false;

        return /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(_value);
    }

    defaultMessage(_args: ValidationArguments): string {
        return `invalid MAC address`;
    }
}

export function IsMacValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsMacValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsMacValidConstraint,
        });
    };
}