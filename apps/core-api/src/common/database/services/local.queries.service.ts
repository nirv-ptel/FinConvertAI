import { HttpException, HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { Db, ClientSession } from 'mongodb';
import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { PAGINATION_DEFAULT_LIMIT } from 'src/common/pagination/constants/pagination.constant';

@Injectable()
export class LocalQueriesService{ 
    constructor(
        @Optional() @Inject('LOCAL_CONNECTION') private _db: Db,
        private readonly _databaseService: DatabaseService,
        private readonly _helperDateService: HelperDateService,
    ) { }

    async findOne(collectionName: string, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>) {
        return Promise.resolve().then(() => {
            if (!query) {
                query = {};
            }

            if (!project) {
                project = {};
            }

            let find = this._db.collection(collectionName).find(query).project(project);

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

    async find(collectionName: string, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>, limit?: number, skip?: number) {
        return Promise.resolve().then(() => {
            if (!query) {
                query = {};
            }

            if (!project) {
                project = {};
            }
            // if (!limit) {
            //     limit = PAGINATION_DEFAULT_LIMIT;
            // }
            if (!skip || skip < 0) {
                skip = 0;
            }

            let find = this._db.collection(collectionName).find(query).project(project).skip(skip);

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

    async insert(collectionName: string, data?: Record<string, any>, session?: ClientSession,id = "") {
        return Promise.resolve().then(() => {
            // data['_id'] = this._databaseService.getInsertId();
            if (id) {
                data['_id'] = id;
            }
            data['created'] = this._helperDateService.dbDate();
            data['modified'] = this._helperDateService.dbDate();
            //insert to insertOne
            return this._db.collection(collectionName).insertOne(data, { session });
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async insertMany(collectionName: string, data?: Record<string, any>[], cid = 1){
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
            return this._db.collection(collectionName).insertMany(data);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async update(collectionName: string, condition?: Record<string, any>, update?: Record<string, any>) {
        return Promise.resolve().then(() => {
            if (!('$addToSet' in update) && !('$pull' in update) && !('$inc' in update)) {
                update = { "$set": update };
            }
            return this._db.collection(collectionName).updateMany(condition, update);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async delete(collectionName: string, condition?: Record<string, any>, update?: Record<string, any>, multi: number = 0) {
        return Promise.resolve().then(() => {
            if (!condition) {
                return Promise.reject(1001);
            }
            var action = 'deleteOne';
            if (multi == 1) {
                action = 'deleteMany';
            }
            return this._db.collection(collectionName)[action](condition);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async count(collectionName: string, condition?: Record<string, any>):Promise<number>{
        return Promise.resolve().then(() => {
            if (!condition) {
                condition = {};
            }
            return this._db.collection(collectionName).countDocuments(condition);
        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    };

    async aggregation(collectionName: string, query?: Record<string, any>[]) {
        return Promise.resolve().then(() => {
            if (!query.length) {
                query = [];
            }


            return this._db.collection(collectionName).aggregate(query).toArray();

        }).then((data) => {
            return Promise.resolve(data);
        }).catch(() => {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: "Something went wrong on server",
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        });
    }

    async _find(session?: any, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>, limit: number=PAGINATION_DEFAULT_LIMIT, skip?: number) {
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.find(collectionName, query, project, sort, limit, skip);
    }

    async _findOne(session?: any, query?: Record<string, any>, project?: Record<string, any>, sort?: Record<string, any>) {
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.findOne(collectionName, query, project, sort);
    }

    async _count(session?: any, query?: Record<string, any>){
        let collectionName = "";
        if (typeof session == "object") {
            collectionName = session.collectionName;
        } else {
            collectionName = session;
            session = {};
        }
        return this.count(collectionName, query);
    }
}
