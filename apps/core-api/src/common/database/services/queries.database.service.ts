
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AggregateOptions, BulkWriteOptions, InsertOneResult } from 'mongodb';
import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';


@Injectable()
export class QueriesDatabaseService {
    constructor(
        // @Inject('CONNECTION') private _db: Db,
        private readonly _databaseService: DatabaseService,
        private readonly _helperDateService: HelperDateService,
    ) {
    }

    async findOne(tenantId: string, collectionName: string, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>) {
        return Promise.resolve().then(() => {
            if (!query) {
                query = {};
            }

            if (!project) {
                project = {};
            }

            let find = this._databaseService.getConnetionTenant(tenantId).collection(collectionName).find(query).project(project);

            if (sort) {
                find = find.sort(sort);
            }
            return find.limit(1).toArray();
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    }

    async find(tenantId: string, collectionName: string, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>, limit?: number, skip?: number) {
        return Promise.resolve()
            .then(() => {
                if (!query) {
                    query = {};
                }

                if (!project) {
                    project = {};
                }
                // if (!limit) {
                //     limit = PAGINATION_DEFAULT_LIMIT;
                // }
                if (!skip) {
                    skip = 0;
                }

                let find = this._databaseService.getConnetionTenant(tenantId).collection(collectionName).find(query).project(project).skip(skip);

                if (sort) {
                    find = find.sort(sort);
                }
                if (limit) {
                    find = find.limit(limit);
                }
                return find.toArray();
            }).then((data) => {
                return Promise.resolve(data);
            }).catch(() => {
                throw new HttpException({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: "Something went wrong on server",
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            });
    }

    async insert(tenantId: string, collectionName: string, data?: Record<string, any>, id: string = '', includeTimestamps: boolean = true) {
        return Promise.resolve().then(() => {
            if (id) {
                data['_id'] = id;
            } else {
                data['_id'] = this._databaseService.getInsertId();
            }
            if (includeTimestamps) {
                data['created'] = this._helperDateService.dbDate();
                data['modified'] = this._helperDateService.dbDate();
            }
            //insert to insertOne
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).insertOne(data);
        }).then((data: InsertOneResult) => {
            return Promise.resolve(data);
        }).catch((err) => {
            console.log("insert err", err);
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async insertMany(tenantId: string, collectionName: string, data?: Record<string, any>[], cid = 1) {
        return Promise.resolve().then(() => {
            if (!data.length) {
                throw new HttpException({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: "Something went wrong on server",
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            if (cid == 1) {
                for (var i = 0; i < data.length; i++) {
                    data[i]._id = this._databaseService.getInsertId();
                }
            }
            //insert to insertMany
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).insertMany(data);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async update(tenantId: string, collectionName: string, condition?: Record<string, any>, update?: Record<string, any>) {
        return Promise.resolve().then(() => {
            if (!('$addToSet' in update) && !('$pull' in update) && !('$inc' in update) && !('$unset' in update)) {
                update = { "$set": update };
            }
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).updateOne(condition, update);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch((err) => {
            console.log("update err", err);

            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
    async updateMany(tenantId: string, collectionName: string, condition?: Record<string, any>, update?: Record<string, any>) {
        return Promise.resolve().then(() => {
            if (!('$addToSet' in update) && !('$pull' in update) && !('$inc' in update)) {
                update = { "$set": update };
            }
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).updateMany(condition, update);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
    async delete(tenantId: string, collectionName: string, condition?: Record<string, any>, multi: number = 0) {
        return Promise.resolve().then(() => {
            if (!condition) {
                return Promise.reject(1001);
            }
            var action = 'deleteOne';
            if (multi == 1) {
                action = 'deleteMany';
            }
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName)[action](condition);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async count(tenantId: string, collectionName: string, condition?: Record<string, any>): Promise<number> {
        return Promise.resolve().then(() => {
            if (!condition) {
                condition = {};
            }
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).countDocuments(condition);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async aggregation(tenantId: string, collectionName: string, query?: Record<string, any>[], options?: AggregateOptions) {
        return Promise.resolve().then(() => {
            if (!query.length) {
                query = [];
            }
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).aggregate(query, options).toArray();
        }).then((data) => {
            return Promise.resolve(data);
        }).catch((err) => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    }

    async _find(tenantId: string, session?: any, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>, limit?: number, skip?: number) {
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.find(tenantId, collectionName, query, project, sort, limit, skip);
    }

    async _findOne(tenantId: string, session?: any, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>) {
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.findOne(tenantId, collectionName, query, project, sort);
    }

    async _count(tenantId: string, session?: any, query?: Record<string, any>) {
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.count(tenantId, collectionName, query);
    }

    async bulkWrite(tenantId: string, collectionName: string, data?: any, options?: BulkWriteOptions) {
        return Promise.resolve().then(() => {
            return this._databaseService.getConnetionTenant(tenantId).collection(collectionName).bulkWrite(data, options);
        }).then((data: any) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };
}
