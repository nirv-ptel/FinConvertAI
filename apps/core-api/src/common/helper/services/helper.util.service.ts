import { Injectable } from '@nestjs/common';
import md5 from 'md5';
import * as crypto from 'crypto';

@Injectable()
export class HelperUtilService {

    constructor(

    ) { }

    MD5(str: string): string {
        return md5("some_salt_and_pepper_" + str + "_sds_2017");
    }

    zeroPad(number: number): string | number {
        return number < 10 ? '0' + number : number;
    }

    capitalizeFirstLetter(string: string): string {
        return string[0].toUpperCase() + string.slice(1);
    }


    validateIPv4(ip: string): boolean {
        return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(ip);
    }

    validateMac(mac: string): boolean {
        return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
    }

    normalizeMacAddress(mac: string): string {
        return mac.replace(/-/g, ":").toUpperCase();
    }






    onlyUnique(a: string[]) {
        a = a.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        return a;
    }

    getUUID(): string {
        return crypto.randomUUID();
    }



  




}
