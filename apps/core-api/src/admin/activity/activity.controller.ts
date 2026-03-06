import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { CreateActivityDto } from './dto/create.activity.dto';
import { IResponse } from 'src/common/response/interface/response.interface';
import { AUDITLOG, CUSTOMERMASTER, ERRORLOG } from 'src/common/database/constants/collection.constant';
import * as fs from 'fs';
import * as path from 'path';
import { DocAuth } from 'src/common/doc/decorators/doc.decorator';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuthJwtAccessProtected } from 'src/common/auth/decorators/auth.jwt.decorator';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { Response } from 'src/common/response/decorators/response.decorator';
import { ICustomer } from 'src/modules/customer/interface/customer.interface';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { Parser } from 'json2csv';

@ApiTags('admin/activity')
@Controller('activity')
export class ActivityController {
  constructor(
    private readonly _queriesDatabaseService: QueriesDatabaseService,
    private readonly _helperDateService: HelperDateService,
    private readonly _masterQueriesService: MasterQueriesDatabaseService,
  ) { }

  @AdminAuthJwtAccessProtected()
  @ApiCreatedResponse({ description: 'ActivityLog List' })
  @Response("Report exported successfully.", HttpStatus.OK)
  @Post()
  async generateCsvFile(@Body() body: CreateActivityDto) {

    const { customerId, from, to }: CreateActivityDto = body;
    let file_name: string = Date.now().toString();
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.find(CUSTOMERMASTER, { _id: customerId }, { _id: 1, name: 1, email: 1, company: 1, tenantId: 1 });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: 'customer not found',
          }, HttpStatus.NOT_FOUND);
        }
        let query = [
          {
            $match: {
              created: {
                $gte: this._helperDateService.parseToDbDate(from),
                $lt: this._helperDateService.parseToDbDate(to),
              }
            }
          },
          {
            $project: {
              OwnerId: "$ownerId",
              CustomerId: "$userId",
              Email: "$email",
              Name: "$name",
              Company: "$company",
              Activity: "$methodName",
              Ip: "$publicIp",
              Created: "$created"
            }
          }
        ];
        return this._queriesDatabaseService.aggregation(_customer[0].tenantId, AUDITLOG, query);
      })
      .then((activityLog) => {
        const json2csvParser = new Parser({ fields: ["OwnerId", "CustomerId", "Email", "Name", "Company", "Activity", "Ip", "Created"] });
        const csv = json2csvParser.parse(activityLog);
        let filePath = path.join(process.cwd(), 'src/admin/activity/csv', file_name);
        fs.writeFileSync(filePath, csv, 'utf8');
        return filePath;
        // return activityLog
      })
      .then((filePath) => {
        return { data: filePath, ext: 'csv', fileName: file_name };
      })
  }

  @AdminAuthJwtAccessProtected()
  @ApiCreatedResponse({ description: 'ActivityLog List' })
  @Response("Report exported successfully.", HttpStatus.OK)
  @Post("/error-log")
  async generateErrorLogFile(@Body() body: CreateActivityDto) {

    const { customerId, from, to }: CreateActivityDto = body;
    let file_name: string = Date.now().toString();
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.find(CUSTOMERMASTER, { _id: customerId }, { _id: 1, name: 1, email: 1, company: 1, tenantId: 1 });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: 'customer not found',
          }, HttpStatus.NOT_FOUND);
        }
        let query = [
          {
            $match: {
              created: {
                $gte: this._helperDateService.parseToDbDate(from),
                $lt: this._helperDateService.parseToDbDate(to),
              }
            }
          },
          {
            $project: {
              OwnerId: "$customerId",
              CustomerId: "$userId",
              Email: "$email",
              Name: "$name",
              Company: "$company",
              Message: "$message",
              Status: "$statusCode",
              Ip: "$publicIp",
              Created: "$created"
            }
          }
        ];
        return this._queriesDatabaseService.aggregation(_customer[0].tenantId, ERRORLOG, query);
      })
      .then((activityLog) => {
        const json2csvParser = new Parser({ fields: ["OwnerId", "CustomerId", "Email", "Name", "Company", "Message", "Status", "Ip", "Created"] });
        const csv = json2csvParser.parse(activityLog);
        let filePath = path.join(process.cwd(), 'src/admin/activity/csv', file_name);
        fs.writeFileSync(filePath, csv, 'utf8');
        return filePath;
        // return activityLog
      })
      .then((filePath) => {
        return { data: filePath, ext: 'csv', fileName: file_name }
      })
  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'customer list' })
  @Response("Customer list get successfully")
  @AdminAuthJwtAccessProtected()
  @Get('owner')
  async superCustomerList(): Promise<IResponse> {
    let customers: Record<string, any>[] = [];
    const find: Record<string, any> = {
      isActive: true,
      isDeleted: false
    };
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.find(CUSTOMERMASTER, find, { name: 1 });
      })
      .then((customer) => {
        if (!customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: 'customer not found',
          }, HttpStatus.NOT_FOUND);
        }
        customers = customer;
      })
      .then(() => {
        return Promise.resolve({ data: customers });
      })
  }
}
