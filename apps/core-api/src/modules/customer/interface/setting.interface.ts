
export interface ISetting {
    _id?: string;
    customerId?: string;
    dashExport?: string;
    groupExport?: string;
    pdf?: string;
    excel?: string;
    csv?: string;
    dateTimeFormat?: string;
    startOfWeek?: number;
    decimalSymbol?: string;
    thousandSymbol?: string;
    predictiveAnalytics?: string;
    modified?: Date;
    created?: Date;
}