import { Injectable } from '@nestjs/common';
import  moment  from 'moment';

@Injectable()
export class HelperDateService {
  constructor() { }

  //UTC Date
  dbDate() {
    //YYYY-MM-DD HH:mm:ss.SSS
    return new Date(moment().utc().toISOString());
  }

  //Convert date string into a date
  //input = "2021-06-01T00:00:00.000Z", output = 2021-06-01T00:00:00.000Z
  toDate(date: string): Date {
    return new Date(date);
  }

  //Convert date into a Moment
  getMomentDate(date: Date | string): moment.Moment {
    return moment(date)
  }

  //Convert date into a Moment with format 
  getFormateDate(date: Date | string | moment.Moment | number, format: string): string {
    return moment(date).format(format)
  }

  //Convert date into a  format
  //this._helperDateService.getFormateDayMonth("2025-01-23", "YYYY-MM-DD", "YYYY-MM");
  //input = "2025-01-23", output = "2025-01"
  getFormateDayMonth(date: Date | string, momentFormat: string, format: string): string {
    return moment(date, momentFormat).format(format)
  }

  //Convert number into a time
  //input = "25200", output = 0 or 1
  validateTime(time: string): number {
    if (moment(time, "HH:mm:ss").format("HH:mm:ss") == time) {
      return 1;
    }
    return 0;
  };

  isBeforeValidation(from: string, to: string, format: string = "HH:mm:ss"): boolean {
    const _from = moment(from, format);
    const _to = moment(to, format);
    if (_from.isBefore(_to)) {
      return true;
    }
    return false;
  };

  isSameBeforeValidation(from: string, to: string, format: string = "HH:mm:ss"): boolean {
    const _from = moment(from, format);
    const _to = moment(to, format);
    if (_from.isSameOrBefore(_to)) {
      return true;
    }
    return false;
  };

  //Convert time into a  format
  //this._helperDateService.getFormateTime("01:00:00", "HH:mm:ss", "HH:mm");
  //input = "01:00:00", output = "01:00"
  getFormateTime(time: string, momentFormat: string, format: string): string {
    return moment(time, momentFormat).format(format)
  };

  //Check if the date is valid
  validateDate(date: string): boolean {
    if (moment(date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") == date) {
      return true;
    }
    return false;
  };

  //Convert date to number
  //input = "2021-06-01", output = 73261
  getTimeStampFromTime(date: string): number {
    return moment.utc("1970-01-01 " + date, "YYYY-MM-DD HH:mm:ss").unix();
  };

  //String date convert to date
  //input = "2021-06-01", output = 2021-06-01T00:00:00.000Z
  parseToDbDate(date: string | Date | moment.Moment): Date {
    //.format("YYYY-MM-DD HH:mm:ss.SSS");
    return new Date(moment.utc(date, "YYYY-MM-DD HH:mm:ss").toISOString());
  };

  //Check time between two times
  timeBetween(created: Date, ttl: number): number {
    let _ttl = moment(moment(created).utc().valueOf() + ttl).utc();
    let _created = moment(created).utc();
    if (moment().utc().isBetween(_created, _ttl)) {
      return 1;
    }
    return 0;
  };

  //Convert date to utc date
  parseIsoToUtc(date: any): string {
    return moment(date).utc().format("YYYY-MM-DD HH:mm:ss")
  };

  //Convert date to utc date, subtract 1 day if isBeforeDay is true 
  dbDateToUtc(date: any, isBeforeDay: boolean = false): moment.Moment {
    if (isBeforeDay) {
      return moment.utc(date, "YYYY-MM-DD HH:mm:ss").subtract(1, 'day');
    } else {
      return moment.utc(date, "YYYY-MM-DD HH:mm:ss");
    }
  };

  //Get time from date
  //input = "2021-06-01T00:00:00.000Z", output = 00:00:00
  getTimeFromDate(date: any): string {
    if (typeof date != 'string') {
      try {
        let d = date.toISOString();
        date = d;
      } catch (e) { }
    }

    return moment(date, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]").format("HH:mm:ss");
  };

  //Get day of the week from date
  //input = "2025-01-26T12:12:00", output = "7"
  getDayOfWeekFromDate(date: Date | moment.Moment | string): string {
    return moment.utc(date).format('E');
  };

  //Check to date greater than from date
  validateFromToDate(from: moment.Moment | string, to: moment.Moment | string): boolean {
    from = moment(from);
    to = moment(to);
    if (from < to) {
      return true;
    }
    return false;
  };

  //Check how many day difference between two dates
  //input = "2025-01-26T12:12:00", "2025-01-27T12:12:00", output = 1
  //input = "2025-01-26T12:12:00", "2025-01-25T12:12:00", output = -1
  customTimeFrame(from: string, to: string): number {
    let mFrom = moment(from).valueOf();
    let mTo = moment(to).valueOf();
    return (mTo - mFrom) / (1000 * 60 * 60 * 24); //in days
  }

  //Previous year date show
  //input = "2025-01-26T12:12:00", output = "2024-01-26T12:12:00"
  parseDateToPreviusYear(date: Date): string {
    return moment.utc(date, "YYYY-MM-DD HH:mm:ss").subtract(1, 'years').format("YYYY-MM-DD HH:mm:ss");
  };

  //Get start of the day from date and format
  //getStartOfDay(new Date('2025-01-26T12:12:00'), months,  "YYYY-MM-DD HH:mm:ss") output = "2025-01-01 00:00:00"  (Same also year, week)
  getStartOfDay(date?: Date | string, start?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).startOf(start).format(format);//"YYYY-MM-DD HH:mm:ss"
  }

  //Get end of the day from date and format
  getEndOfDay(date: Date | string = undefined, end: moment.unitOfTime.Base, format: string): string {
    return moment(date).endOf(end).format(format);
  }

  //Parse date check from date beetween to date and return true or false
  dateBetween(date: Date | moment.Moment, from: Date | moment.Moment, to: Date | moment.Moment): boolean {
    return moment(date).isBetween(moment(from), moment(to))
  }

  //Subtract date from date and return date 
  getSubtractDate(date: Date, subtractAmount: number, subtractUnit: moment.unitOfTime.Base): Date {
    return moment(date).subtract(subtractAmount, subtractUnit).toDate();
  }

  //Convert date to moment
  convertDate(date: Date, format: string) {
    return moment(date, format);
  };

  //get first date of year
  getFirstDateOfYear(year: number): moment.Moment {
    let start: Date = new Date("1/1/" + year);
    return moment(start.valueOf());
  }

  //Get first day of the month, yer, week etc
  getStart(date?: Date | string | undefined, start?: moment.unitOfTime.Base): moment.Moment {
    return moment(date).startOf(start);
  }

  //Get end day of the month, yer, week etc
  getEnd(date: Date | string, end: moment.unitOfTime.Base): moment.Moment {
    return moment(date).endOf(end);
  }

  // Add day, month, year etc to date
  addDate(date: Date | moment.Moment | string, number: number, unit: moment.unitOfTime.Base): moment.Moment {
    return moment(date).add(number, unit);
  }

  //Add day, month, year etc format wise
  addDateWithUnitFormat(date: Date | string | moment.Moment, iFormat: string, duration: number, unit: moment.unitOfTime.Base, oFormat: string): string {
    return moment(date, iFormat).add(duration, unit).format(oFormat);
  }

  //Get subtract day, month, year etc and return date start of unit
  getSubtractStartDate(date?: Date | moment.Moment | string, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, start?: moment.unitOfTime.Base): moment.Moment {
    return moment(date).subtract(subtractAmount, subtractUnit).startOf(start);
  }

  //Get subtract day, month, year etc format wise
  getSubtractFormateDate(date?: Date | moment.Moment | string, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).subtract(subtractAmount, subtractUnit).format(format);
  }

  //Get subtract day, month, year and return end of day // Moment<2025-08-10T23:59:59+05:30>
  getSubtractEndDate(date?: Date | moment.Moment | string, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, end?: moment.unitOfTime.Base): moment.Moment {
    return moment(date).subtract(subtractAmount, subtractUnit).endOf(end);
  }

  //Get day of last week parsed to date any and return end of week day (saturday is end of week)
  getDayOfLastWeek(date: Date, addAmount: number, addUnit: moment.unitOfTime.Base, endUnit: moment.unitOfTime.Base): moment.Moment {
    return moment(date).add(addAmount, addUnit).endOf(endUnit);
  }

  //Get start day, month, year and return start of day, month, year
  getStartOfFormatDate(date?: Date | moment.Moment | string, start?: moment.unitOfTime.Base, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).startOf(start).subtract(subtractAmount, subtractUnit).format(format);
  }

  //Get end day, month, year and return end of day, month, year
  getEndOfformatDate(date?: Date | moment.Moment | string, start?: moment.unitOfTime.Base, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).endOf(start).subtract(subtractAmount, subtractUnit).format(format);
  }

  //Get start of year, month and day and return start of year, month and day
  // input = ( new Date(("2025-01-24")), "month", 5, "month", 2, "year", "YYYY-MM-DD HH:mm:ss" ), return = "2022-08-01 00:00:00"
  getStartOfFormatYear(date?: Date | moment.Moment, start?: moment.unitOfTime.Base, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, subtractAmountYear?: number, subtractUnitYear?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).startOf(start).subtract(subtractAmount, subtractUnit).subtract(subtractAmountYear, subtractUnitYear).format(format);
  }

  //Get end of year, month and day and return end of year, month and day
  // input = ( new Date(("2025-01-24")), "month", 5, "month", 2, "year", "YYYY-MM-DD HH:mm:ss" ), return = "2022-08-31 23:59:59"
  getEndOfFormatYear(date?: Date | moment.Moment, start?: moment.unitOfTime.Base, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, subtractAmountYear?: number, subtractUnitYear?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).endOf(start).subtract(subtractAmount, subtractUnit).subtract(subtractAmountYear, subtractUnitYear).format(format);
  }

  //Get start of month, year and day and return start of month, year and day
  //input = (new Date(("2025-01-24")), 1, "month", "year", "YYYY-MM-DD HH:mm:ss" ), output = "2024-01-01 00:00:00" 
  getStartOfFormatMonth(date?: Date | moment.Moment | string, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, start?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).subtract(subtractAmount, subtractUnit).startOf(start).format(format);
  }

  //Get end of day, month, year and return end of day, month, year
  //input = (new Date(("2025-01-24")), 1, "month", "year", "YYYY-MM-DD HH:mm:ss" ), output = "2024-12-31 23:59:59"
  getEndOfFormatMonth(date?: Date | moment.Moment | string, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, start?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).subtract(subtractAmount, subtractUnit).endOf(start).format(format);
  }

  //Get start of day, month, year and return start of day, month, year format wise
  //input = (new Date(("2025-01-24")), 1, "month", "year", 1, "month",  "YYYY-MM-DD HH:mm:ss" ), output = "2023-12-01 00:00:00"
  getStartOfFormatLastMonth(date?: Date | moment.Moment, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, start?: moment.unitOfTime.Base, subtractAmountYear?: number, subtractUnitYear?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).subtract(subtractAmount, subtractUnit).startOf(start).subtract(subtractAmountYear, subtractUnitYear).format(format);
  }

  //Get end of day, month, year and return end of day, month, year format wise
  //input = (new Date(("2025-01-24")), 1, "month", "year", 1, "month",  "YYYY-MM-DD HH:mm:ss" ), output = "2024-11-30 23:59:59"
  getEndOfFormatLastMonth(date?: Date | moment.Moment, subtractAmount?: number, subtractUnit?: moment.unitOfTime.Base, start?: moment.unitOfTime.Base, subtractAmountYear?: number, subtractUnitYear?: moment.unitOfTime.Base, format?: string): string {
    return moment(date).subtract(subtractAmount, subtractUnit).endOf(start).subtract(subtractAmountYear, subtractUnitYear).format(format);
  }

  //Set local time zone to date
  //input = (new Date(("2025-01-24")), "+10:00", "YYYY-MM-DDTHH:mm:ss.SSS" ), output = "2025-01-24T10:00:00.000Z"
  parseTimeZoneToUserTZ(dateTime: Date | string, utcOffSet: number | string = "+00:00", format: string): string {
    let a = moment.utc(dateTime).utcOffset(utcOffSet).format(format);
    return a + "Z";
  }

  // Show difference between two dates
  getDiff(to: Date | string | undefined, from: Date | string | undefined, unit: moment.unitOfTime.Base, format : string =''): number {
    if(format){
      return moment(to,format).diff(moment(from,format), unit);
    }
    return moment(to).diff(moment(from), unit);
  }

  //Get milliseconds from date
  getMilliseconds(date: Date | string): number {
    return moment(date).milliseconds()
  }

  //Get unix from date
  //input = "2025-01-24T12:12:00", output = 174000000
  getUnixDate(date: Date | string): number {
    return moment(date).unix();
  };

  //Set hour and minute to date
  setHourDate(date: Date | any, hour: number, minute: number): Date {
    return new Date(moment(date).set('hour', hour).set('minute', minute).utc().toISOString());
  }

  //Remove date under specific T 
  //input = "2025-01-24T12:12:00", output = "2025-01-24 12:12:00"
  parseDateStringToIso(date: string): string {
    return date.replace('T', ' ').slice(0, -6);
  };

  parseDateMilisecondsTostring(date: string): string {
    return date.replace('T', ' ').slice(0, -10);
  };

  //Get subtract day, month, year retutn date utc format
  getMomentUtcDate(date: Date | any, subtractAmount: number, subtractUnit?: moment.unitOfTime.Base, format?: string) {
    return moment.utc(date).subtract(subtractAmount, subtractUnit).format(format)
  }

  //Add day, month, year to date
  //input = (new Date("2025-12-23"), 1, "month"), output = 2026-01-23T00:00:00.000Z
  updateNextRunDay(date: Date | undefined | moment.Moment, addAmount: number, addUnit: moment.unitOfTime.Base, hour: number, minute: number): moment.Moment {
    return moment.utc(date).add(addAmount, addUnit).set({ hour, minute, second: 0, millisecond: 0 });
  }

  setValueOfDate(date: Date | any, value: number, unit: moment.unitOfTime.Base): moment.Moment {
    return moment(date).set(unit, value)
  }

  convertToFirstDay(date: Date | any, hour: number, minute: number): Date {
    return new Date(moment(date).set('hour', hour).set('minute', minute).toISOString());
  }

  //Convert number to time format
  //input = 25200, output = 07:40:00
  secondsToHHMMSS(seconds: number): string {
    if (seconds === 0) {
      return '00:00:00';
    }
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);

    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const remainingSeconds = absSeconds % 60;

    const hh = String(hours.toFixed(0)).padStart(2, '0');
    const mm = String(minutes.toFixed(0)).padStart(2, '0');
    const ss = String(remainingSeconds.toFixed(0)).padStart(2, '0');

    return `${isNegative ? '-' : ''}${hh}:${mm}:${ss}`;
  }

  addOffset(date: Date | string | number | undefined, offset: string, format: string): string {
    return moment(date).utcOffset(offset).format(format);
  }

  getTimeDifference(lastCheckedDate: Date, status?: number): string {
    if (status === 1) return '--';

    const lastChecked = lastCheckedDate.getTime();
    const now = Date.now();
    const diffInSeconds = Math.floor((now - lastChecked) / 1000);

    if (diffInSeconds <= 0) return 'Just now';

    const units = [
      { seconds: 60 * 60 * 24 * 365, name: 'year' },
      { seconds: 60 * 60 * 24 * 30, name: 'month' },
      { seconds: 60 * 60 * 24 * 7, name: 'week' },
      { seconds: 60 * 60 * 24, name: 'day' },
      { seconds: 60 * 60, name: 'hour' },
      { seconds: 60, name: 'minute' },
      { seconds: 1, name: 'second' },
    ];

    for (const unit of units) {
      const value = Math.floor(diffInSeconds / unit.seconds);
      if (value >= 1) {
        return `${value} ${unit.name}${value > 1 ? 's' : ''}`;
      }
    }

    return 'Just now';
  }

  //Check date format is valid (only check (yyyy-mm-dd hh:mm) format)
  validDateFormat(date: string): boolean {
    if (date.length !== 16) return false;

    const DATE_FORMAT_REGEX = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

    const match = DATE_FORMAT_REGEX.exec(date);
    if (!match) return false;

    const year = +(date.substring(0, 4));
    const month = +(date.substring(5, 7));
    const day = +(date.substring(8, 10));
    const hour = +(date.substring(11, 13));
    const minute = +(date.substring(14, 16));

    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
      return false;
    }

    const d = new Date(year, month - 1, day);
    return d.getMonth() === month - 1 && d.getDate() === day;
  }

}