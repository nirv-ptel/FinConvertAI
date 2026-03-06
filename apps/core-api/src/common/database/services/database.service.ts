import { Inject, Injectable } from '@nestjs/common';
import { Db, MongoClient, ObjectId } from 'mongodb';
import * as crypto from 'crypto'

@Injectable()
export class DatabaseService {
  private _db: Db;
  private _tenantId: string;
  constructor(
    @Inject('MONGO_CLIENT') private client: MongoClient
  ) { }

  
  get getTenantId(): string {
    return this._tenantId;
  }

  set setTenantId(id:string) {
    this._tenantId = id;
  }

  get getConnetionString(): Db {
    return this._db;
  }

  set setConnetionString(db: Db) {
    this._db = db;
  }

  getInsertId(): string {
    return new ObjectId().toHexString();
  }

  getUUID(): string {
    return crypto.randomUUID().toUpperCase();
  }

  getConnetionTenant(tenantId: string): Db {
    return this.client.db(tenantId);
  }

  async createDatabaseConnetion() {
    return Promise.resolve().then(() => {
      return MongoClient.connect(process.env.DATABASE_HOST,
        {
          auth: {
            username: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
          }
        }
      )
    })
  }

}
