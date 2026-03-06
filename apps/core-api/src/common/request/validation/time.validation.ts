import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { HelperDateService } from "src/common/helper/services/helper.date.service";

@ValidatorConstraint({ name: 'IsTimeValidConstraint', async: false })
@Injectable()
class IsTimeValidConstraint implements ValidatorConstraintInterface {

    constructor(private readonly _helperDateService: HelperDateService = new HelperDateService()){}
    validate(_value: string, _args: ValidationArguments): boolean {

        if (!_value) return false;

        return this._helperDateService.validateTime(_value) == 1 ? true : false;
    }

    defaultMessage(_args: ValidationArguments): string {
        return `'${_args.property}' must be in HH:mm:ss format`;
    }
}

export function IsTimeValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsTimeValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsTimeValidConstraint,
        });
    };
}