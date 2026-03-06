import { ISetting } from './setting.interface';

export interface ICustomer {
    _id?: string;
    ownerId?: string;
    tenantId?: string;

    name?: string;
    email?: string;
    password?: string;
    mobile?: string;
    address?: string;
    company?: string;
    isAuthenticated?: boolean;
    secretKey?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    isEmailVerified?: boolean;
    setting?: ISetting;
    token?: string;
    users?: string[];
}


export interface IMFAAuth {
    enableMFA: boolean;
    isAuthenticated: boolean;
    secretKey: string;
    authQRCode: string;
    tenantId?: string;
}
export interface IAccessToken {
    _id: string;
    insertedId: string;
    user?: string;
    userId: string;
    ttl: number;
    created?: Date;
    modified?: Date;
}