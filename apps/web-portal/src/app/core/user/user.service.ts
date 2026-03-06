import { Injectable } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private _user: User | null = null;

  get user(): User | null {
    return this._user;
  }

  set user(value: User | null) {
    this._user = value;
  }
}
