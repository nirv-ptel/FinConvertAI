import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Db, MongoClient, ClientSession } from 'mongodb';
import { DatabaseService } from 'src/common/database/services/database.service';
import { CreateCustomerDto } from './dto/create.customer.dto';
import { ACCESSTOKEN, ALERTLOG, CUSTOMER, CUSTOMERMASTER, SETTING } from 'src/common/database/constants/collection.constant';
import { HelperUtilService } from 'src/common/helper/services/helper.util.service';
import { DocAuth, DocQueryList } from 'src/common/doc/decorators/doc.decorator';
import { ApiCreatedResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'src/common/response/decorators/response.decorator';
import { AdminAuthJwtAccessProtected } from 'src/common/auth/decorators/auth.jwt.decorator';
import { AdminPaginationQuery } from 'src/common/pagination/decorators/pagination.decorator';
import { MASTER_DEFAULT_CUSTOMER_AVAILABLE_LIST, MASTER_DEFAULT_CUSTOMER_AVAILABLE_SEARCH, MASTER_DEFAULT_USER_AVAILABLE_LIST, MASTER_DEFAULT_USER_AVAILABLE_SEARCH, ROLES } from './constant/customer.list.constant';
import { PaginationListDto } from 'src/common/pagination/dto/pagination.list.dto';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { UpdateCustomerDto } from './dto/update.customer.dto';
import { IResponse } from 'src/common/response/interface/response.interface';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { ICustomer } from 'src/modules/customer/interface/customer.interface';
import { MailService } from 'src/common/mail/mail.service';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { AuthService } from 'src/common/auth/auth.service';
import { UpdateSettingDto } from './dto/setting.customer.dto';
import { MongoIdValidationPipe } from 'src/common/request/pipes/mongoId.validation.pipe';
import { ChangePasswordDto } from './dto/change-password.customer.dto';


@ApiTags('admin/customer')
@Controller('customer')
export class CustomerController {
  constructor(
    @Inject('MONGO_CLIENT') private client: MongoClient,
    private readonly _databaseService: DatabaseService,
    private readonly _helperUtilService: HelperUtilService,
    private readonly _helperDateService: HelperDateService,
    private readonly _masterQueriesService: MasterQueriesDatabaseService,
    private readonly _queriesDatabaseService: QueriesDatabaseService,
    private readonly _authService: AuthService
  ) { }

  @DocAuth()
  @DocQueryList()
  @ApiCreatedResponse({ description: 'customer list' })
  @Response("customer list")
  @AdminAuthJwtAccessProtected()
  @Get('list')
  async customerList(
    @AdminPaginationQuery({ availableSearch: MASTER_DEFAULT_CUSTOMER_AVAILABLE_SEARCH, availableList: MASTER_DEFAULT_CUSTOMER_AVAILABLE_LIST })
    { _search, _limit, _offset, _order, _project, _page }: PaginationListDto): Promise<IResponse> {
    let customers: Record<string, any>[] = [];
    const find: Record<string, any> = {
      isDeleted: false,
      ..._search,
    };
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.find(CUSTOMERMASTER, find, _project, _order, _limit, _offset);
      })
      .then((customer: ICustomer[]) => {
        customers = customer
      })
      .then(() => {
        return this._masterQueriesService.count(CUSTOMERMASTER, find);
      })
      .then((customerCount) => {
        let pagination = {
          total: customerCount,
          page: _page - 1,
          limit: _limit
        }
        return { data: customers, pagination };
      })
  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'Customer created successfully' })
  @Response("Customer created successfully")
  @AdminAuthJwtAccessProtected()
  @Post()
  async create(@Body() body: CreateCustomerDto): Promise<IResponse> {

    const { name, email, mobile, }: CreateCustomerDto = body;

    const customerId: string = this._databaseService.getInsertId();
    let customerDataBase: Db;
    const password: string = this._authService.getWelcomePassword.trim();
    let session: ClientSession;

    let customer: Record<string, any> = {
      // ...body,
      name: name.trim(),
      tenantId: this._databaseService.getUUID(),
      email: email,
      password: this._helperUtilService.MD5(password),
      mobile: mobile,
      isActive: true,
      isDeleted: false,
    };

    return Promise.resolve()
      .then(() => {
        session = this.client.startSession();
        session.startTransaction();
      })
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { $or: [{ email: customer.email }, { mobile: customer.mobile }], isDeleted: false });
      })
      .then((exist: ICustomer[]) => {
        if (exist.length === 1 && exist[0].email === customer.email) {
          throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            error: 'Email already exists',
          }, HttpStatus.BAD_REQUEST);
        }
        if (exist.length === 1 && exist[0].mobile === customer.mobile) {
          throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            error: 'Mobile already exists',
          }, HttpStatus.BAD_REQUEST);
        }
        
        return this._masterQueriesService.insertWithSession(CUSTOMERMASTER, customer, session, customerId);
      })
      .then(() => {
        customer['_id'] = customerId;
        return this.client.db(customer.tenantId);
      })
      .then((database: Db) => {
        customerDataBase = database;
        delete customer.users;

        return customerDataBase.collection(CUSTOMER).insertOne(customer, { session });
      })
      .then(async () => {
        await session.commitTransaction();
        session.endSession();
      })
      // .then(() => {
      //   return this._mailService.sendMail(email, "Welcome to repotics", "./welcomeCustomerMail", { name: name, password: password, url: process.env.WEB_PORTAL_URL });
      // })
      .then(() => {
        return { data: [] };
      })
      .catch(async (error) => {

        if (session.inTransaction()) {
          await session.abortTransaction();
        }

        session.endSession();
        // await session.abortTransaction();
        // session.endSession();
        if (error instanceof HttpException) {
          return Promise.reject(error)
        } else {
          throw new HttpException({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Customer creation failed. Please try again',
          }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      });
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'customer updated successfully' })
  @Response("customer updated successfully")
  @AdminAuthJwtAccessProtected()
  @Patch(':id')
  async update(@Param('id', MongoIdValidationPipe) id: string, @Body() body: UpdateCustomerDto): Promise<IResponse> {
    const { name, email, mobile, isActive, isResetPassword, password }: UpdateCustomerDto = body;
    let customer: ICustomer = {};

    let update: Record<string, any> = {
      name: name,
      email: email,
      mobile: mobile,
      isActive: isActive,
      modified: this._helperDateService.dbDate()
    }

    if (isResetPassword) {
      update['password'] = this._helperUtilService.MD5(password)
    }
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Something went wrong",
          }, HttpStatus.NOT_FOUND);
        }
        customer = _customer[0];
        if (customer.email !== email) {
          return this._masterQueriesService.find(CUSTOMERMASTER, { email: email })
            .then((exist: ICustomer[]) => {
              if (exist.length) {
                throw new HttpException({
                  status: HttpStatus.BAD_REQUEST,
                  error: 'email is already existing',
                }, HttpStatus.BAD_REQUEST);
              }
            })
        }
      })
      .then(() => {
        return this._masterQueriesService.update(CUSTOMERMASTER, { _id: id }, update);
      })
      .then(() => {
        if (customer.email !== email) {
          return this._masterQueriesService.update(CUSTOMERMASTER, { _id: id }, { $pull: { users: customer.email } })
            .then(() => {
              return this._masterQueriesService.update(CUSTOMERMASTER, { _id: id }, { $addToSet: { users: email } })
            })
        }
      })
      .then(() => {
        return this._queriesDatabaseService.update(customer.tenantId, CUSTOMER, { _id: id }, update);
      })
      .then(() => {
        if (isResetPassword)
          return this._queriesDatabaseService.delete(customer.tenantId, ACCESSTOKEN, { userId: id }, 1);
      })
      .then(() => {
        if (body.isResetPassword) {
          let response: Record<string, any> = {
            message: "Your password has been updated.Please login again",
            data: customer._id
          }
        }

      })
      .then(() => {
        if (!body.isActive) {
          let response: Record<string, any> = {
            message: "Your account is no longer active. You have been signed out. Please contact your admin to activate your account",
            data: customer._id
          }
          return this._queriesDatabaseService.find(customer.tenantId, CUSTOMER, { $or: [{ ownerId: customer._id, isActive: true }, { _id: customer._id }] }, { _id: 1, name: 1 })
            .then((users: ICustomer[]) => {
              users.forEach((user: ICustomer) => {
                console.log("Socket -----", user.name, user._id);
                response['data'] = user._id;
              });
            })
        }
      })
      .then(() => {
        return { data: [] };
      })

  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'customer delete successfully' })
  @Response("customer delete successfully")
  @AdminAuthJwtAccessProtected()
  @Delete(':id')
  async delete(@Param('id', MongoIdValidationPipe) id: string): Promise<IResponse> {

    let customer: any;
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id, isDeleted: false });
      })
      .then((_customer) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Customer not found",
          }, HttpStatus.NOT_FOUND);
        }
        if (_customer[0]?.isActive) {
          throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            error: "You cannot delete an active customer",
          }, HttpStatus.BAD_REQUEST);
        }
        customer = _customer[0];
        return this._masterQueriesService.update(CUSTOMERMASTER, { _id: id }, { isDeleted: true, isActive: false, modified: this._helperDateService.dbDate() });
      })
      .then(() => {
        return this._queriesDatabaseService.update(customer.tenantId, CUSTOMER, { _id: id }, { isDeleted: true, isActive: false, modified: this._helperDateService.dbDate() });
      })
      .then(() => {
        return this._queriesDatabaseService.delete(customer.tenantId, ACCESSTOKEN, { userId: id }, 1);
      })
      .then(() => {
        return { data: [] };
      })
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'Setting get successfully' })
  @Response("Setting get successfully")
  @AdminAuthJwtAccessProtected()
  @Get('setting/:id')
  async setting(@Param('id', MongoIdValidationPipe) id: string): Promise<IResponse> {
    let customer: any = {}
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id, isActive: true, isDeleted: false });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Customer not found.",
          }, HttpStatus.NOT_FOUND);
        }
        customer = _customer[0];
      })
      .then(() => {

        return this._queriesDatabaseService.findOne(customer.tenantId, SETTING, { customerId: customer._id })
      })
      .then((data) => {
        return Promise.resolve({ data: data[0] })
      })
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'Setting updated successfully' })
  @Response("Setting updated successfully")
  @AdminAuthJwtAccessProtected()
  @Patch('setting/:id')
  async settingUpdate(@Param('id', MongoIdValidationPipe) id: string, @Body() body: UpdateSettingDto): Promise<IResponse> {
    let customer: ICustomer = {}
    const { dashExport, groupExport, pdf, excel, csv, startOfWeek, predictiveAnalytics }: UpdateSettingDto = body
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id, isActive: true, isDeleted: false });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Customer not found.",
          }, HttpStatus.NOT_FOUND);
        }
        customer = _customer[0];
      })
      .then(() => {

        const update: Record<string, any> = {
          dashExport: dashExport,
          groupExport: groupExport,
          pdf: pdf,
          excel: excel,
          csv: csv,
          startOfWeek: startOfWeek,
          predictiveAnalytics: predictiveAnalytics,
          modified: this._helperDateService.dbDate()
        }
        return this._queriesDatabaseService.update(customer.tenantId, SETTING, { customerId: customer._id }, update);
      })
      .then(() => {
        return { data: [] }
      })
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'Customer list successfully' })
  @Response("Customer list successfully")
  @AdminAuthJwtAccessProtected()
  @Get('user/:id')
  async userList(@Param('id', MongoIdValidationPipe) id: string,
    @AdminPaginationQuery({ availableSearch: MASTER_DEFAULT_USER_AVAILABLE_SEARCH, availableList: MASTER_DEFAULT_USER_AVAILABLE_LIST })
    { _search, _limit, _offset, _order, _project, _page }: PaginationListDto): Promise<IResponse> {

    let customer: ICustomer = {};
    const find = { isDeleted: false, ..._search };
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id });
      })
      .then((_customer: ICustomer[]) => {
        if (!_customer.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Customer not found",
          }, HttpStatus.NOT_FOUND);
        }
        customer = _customer[0];
      })
      .then(() => {
        return this._queriesDatabaseService.find(customer.tenantId, CUSTOMER, find, _project, _order, _limit, _offset);
      })
      .then((_customers) => {
        let customers = _customers.filter((item: any) => item.email != customer.email);
        let pagination = {
          total: customers.length,
          page: _page - 1,
          limit: _limit
        }

        return { data: customers, pagination };
      });
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'customer password updated successfully' })
  @Response("customer password updated successfully")
  @AdminAuthJwtAccessProtected()
  @Patch('change-password/:id')
  async userChangePassword(@Param('id', MongoIdValidationPipe) id: string, @Body() body: ChangePasswordDto): Promise<IResponse> {
    let customer: ICustomer = {};
    const { userId, password } = body
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id });
      })
      .then((custom: ICustomer[]) => {
        if (!custom.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Customer not found",
          }, HttpStatus.NOT_FOUND);
        }
        customer = custom[0];

        return this._queriesDatabaseService.update(customer.tenantId, CUSTOMER, { _id: userId }, { password: this._helperUtilService.MD5(password) });
      })
      .then(() => {
        return this._queriesDatabaseService.delete(customer.tenantId, ACCESSTOKEN, { userId: userId }, 1);
      })
      .then(() => {
        let response: Record<string, any> = {
          message: "Your password has been updated.Please login again",
          data: userId
        }
        // return this._queriesDatabaseService.delete(customer.tenantId, ACCESSTOKEN, { userId: userId }, 1);
      })
      .then(() => {
        return { data: [] };
      })
  }

  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'customer get successfully' })
  @Response("customer get successfully")
  @AdminAuthJwtAccessProtected()
  @Get(':id')
  async findOne(@Param('id', MongoIdValidationPipe) id: string): Promise<IResponse> {

    return Promise.resolve().then(() => {
      return this._masterQueriesService.findOne(CUSTOMERMASTER, { _id: id }, { password: 0, tenantId: 0, isAuthenticated: 0, secretKey: 0, roleId: 0, roleName: 0 });
    })
      .then((data: ICustomer[]) => {
        return { data: data[0] };
      })
  }

}
