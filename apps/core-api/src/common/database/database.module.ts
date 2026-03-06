import { Global, Module } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { DatabaseService } from 'src/common/database/services/database.service';
import { QueriesDatabaseService } from './services/queries.database.service';
import { MasterQueriesDatabaseService } from './services/masterQueries.database.service';
import { LocalQueriesService } from './services/local.queries.service';

@Global()
@Module({
  providers: [
    {
      provide: 'MONGO_CLIENT',
      useFactory: async (): Promise<MongoClient> => {
        return MongoClient.connect(process.env.DATABASE_HOST, {
          minPoolSize: 5,
          maxPoolSize: 50,
          maxIdleTimeMS: 30000,
        });
      },
    },
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (client: MongoClient): Db => {
        return client.db(process.env.DATABASE_NAME);
      },
      inject: ['MONGO_CLIENT'],
    },

    DatabaseService,
    QueriesDatabaseService,
    MasterQueriesDatabaseService,
    LocalQueriesService,
  ],
  exports: [
    'MONGO_CLIENT',
    'DATABASE_CONNECTION',
    DatabaseService,
    QueriesDatabaseService,
    MasterQueriesDatabaseService,
    LocalQueriesService,
  ],
})
export class DatabaseModule {}
