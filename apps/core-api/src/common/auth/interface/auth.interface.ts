
export interface ISession {
    userId: string;
    ownerId?: string;
    tokenId: string;
    // user: string;
    email: string;
    name?: string;
    mobile: string;
    tenantId?: string;
}


export interface IAdminSession {
    user: string;
    userId: string;
    tokenId: string;
}

