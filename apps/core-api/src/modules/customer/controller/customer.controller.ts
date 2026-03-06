import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { AuthJwtAccessProtected, AuthJwtPayload } from 'src/common/auth/decorators/auth.jwt.decorator';
import { AuthService } from 'src/common/auth/auth.service';
import { HelperUtilService } from 'src/common/helper/services/helper.util.service';
import { ACCESSTOKEN, ALERTLOG, CUSTOMER, CUSTOMERMASTER, ROLE, SETTING } from 'src/common/database/constants/collection.constant';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { Response } from 'src/common/response/decorators/response.decorator'
import { IResponse } from 'src/common/response/interface/response.interface';
import { AdminPaginationQuery } from 'src/common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from 'src/common/pagination/dto/pagination.list.dto';
import { ISession } from 'src/common/auth/interface/auth.interface';
import { DocAuth, DocQueryList } from 'src/common/doc/decorators/doc.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { UploadService } from 'src/common/helper/services/upload.service';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { MailService } from 'src/common/mail/mail.service';
import { MongoIdValidationPipe } from 'src/common/request/pipes/mongoId.validation.pipe';
import { CreateUserDto } from '../dto/create.customer.dto';
import { ICustomer } from '../interface/customer.interface';
import { UpdateUserDto } from '../dto/update.customer.dto';
import { UpdateProfileDto } from '../dto/update-profile.customer.dto';
import { CUSTOMER_DEFAULT_AVAILABLE_LIST, CUSTOMER_DEFAULT_AVAILABLE_SEARCH } from '../constant/customer.list.constant';
import { ResetPasswordDto } from '../dto/reset-password.customer.dto';
import { ActivityLog } from 'src/common/activity-log/decorator/activity-log.decorator';
import { RolePermission } from 'src/common/auth/decorators/role.permission.decorator';

@ApiTags('customer')
@Controller('customer')
export class CustomerController {

  constructor(
    private readonly _authService: AuthService,
    private readonly _helperUtilService: HelperUtilService,
    private readonly _helperDateService: HelperDateService,
    private readonly _queriesDatabaseService: QueriesDatabaseService,
    private readonly _masterQueriesService: MasterQueriesDatabaseService,
    private readonly _uploadService: UploadService,
  ) { }

  @DocAuth()
  @DocQueryList()
  @ApiCreatedResponse({ description: 'customer list successfully' })
  @Response("customer list successfully")
 @AuthJwtAccessProtected()
  @Get('list')
  async customerList(@AuthJwtPayload() session: ISession, @AdminPaginationQuery({ availableSearch: CUSTOMER_DEFAULT_AVAILABLE_SEARCH, availableList: CUSTOMER_DEFAULT_AVAILABLE_LIST }) { _search, _limit, _offset, _order, _project, _page, _where }: PaginationListDto,): Promise<any> {

    let customers: Record<string, any>[] = [];
    _project['roleName'] = "$roles.roleName";
    let query = [
      {
        $match: {
          ..._search,
          // roleName: { $ne: 'Admin' },
          _id: { $nin: [session.ownerId, session.userId] },
          isDeleted: false,
          ..._where,
        }
      },

      {
        $project: _project
      },
      {
        $sort: _order
      },
      {
        $skip: _offset
      }, {
        $limit: _limit
      },
    ]
    return Promise.resolve()
      .then(() => {
        return this._queriesDatabaseService.aggregation(session.tenantId, CUSTOMER, query);
      })
      .then(async (_customers: ICustomer[]) => {
        customers = _customers;
        let count: Record<string, any>[] = [query[0]]
        return this._queriesDatabaseService.aggregation(session.tenantId, CUSTOMER, count)
          .then((data: ICustomer[]) => {
            return data.length;
          });
      })
      .then((total) => {
        let pagination = {
          total: total,
          page: _page - 1,
          limit: _limit
        }
        return { data: customers, pagination };
      })

  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'Created Succesfully' })
  @ActivityLog("user_created", CUSTOMER)
  @Response("user created successfully.")
  @AuthJwtAccessProtected()
  @Post()
  async create(@Body() body: CreateUserDto, @AuthJwtPayload() session: ISession): Promise<IResponse> {
    const password: string = this._authService.getWelcomePassword.trim();
    return Promise.resolve()
      .then(() => {
        return this._masterQueriesService.findOne(CUSTOMERMASTER, { users: { $in: [body.email] } }, { email: 1, tenantId: 1 })
      })
      .then(async (d: ICustomer[]) => {
        if (d.length && d[0]._id) {
          throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            error: 'email is already existing',
          }, HttpStatus.BAD_REQUEST);
        }
        return this._queriesDatabaseService.findOne(session.tenantId, CUSTOMER, { email: body.email, isDeleted: false }, { email: 1 })
          .then((d: ICustomer[]) => {
            if (d.length == 1) {
              throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'email is already existing',
              }, HttpStatus.BAD_REQUEST);
            }
            return Promise.resolve();
          });
      })
      .then(() => {
        //create new customer
        let customer: Record<string, any> = {
          name: body.name,
          password: this._helperUtilService.MD5(password),
          email: body.email,
          mobile: body.mobile || "",
          isActive: true,
          isDeleted: false,
        };
        return this._queriesDatabaseService.insert(session.tenantId, CUSTOMER, customer);
      })
      .then(() => {
        return this._masterQueriesService.update(CUSTOMERMASTER, { _id: session.ownerId }, { $addToSet: { users: body.email } });
      })
      // .then(() => {
      //   return this._mailService.sendMail(body.email, "Welcome to repotics", "./welcomeCustomerMail", { name: body.name, password: password, url: process.env.WEB_PORTAL_URL });
      // })
      .then(() => {
        return { data: [] };
      })
  }


  @DocAuth()
  @ApiParam({ name: 'id', example: '665fbf16eb7e90f56e9aa85e' })
  @ApiCreatedResponse({ description: 'User deleted successfully' })
  @ActivityLog("user_deleted", CUSTOMER)
  @Response("User deleted successfully")
  @AuthJwtAccessProtected()
  @Delete(':id')
  async deleteCustomer(@Param('id', MongoIdValidationPipe) id: string, @AuthJwtPayload() session: ISession): Promise<IResponse> {
    let user: ICustomer = {};
    return Promise.resolve()
      .then(() => {
        return this._queriesDatabaseService.findOne(session.tenantId, CUSTOMER, { _id: id });
      })
      .then((_user: ICustomer[]) => {
        if (!_user.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "user not found",
          }, HttpStatus.NOT_FOUND);
        }
        user = _user[0];
        if (user._id == user.ownerId) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "user not found",
          }, HttpStatus.NOT_FOUND);
        }
        return this._queriesDatabaseService.delete(session.tenantId, CUSTOMER, { _id: id });
      })
      .then(() => {
        return this._queriesDatabaseService.delete(session.tenantId, ACCESSTOKEN, { userId: id }, 1);
      })
      .then(() => {
        return this._masterQueriesService.update(CUSTOMERMASTER, { _id: session.ownerId }, { $pull: { users: user.email } });
      })
      .then(() => {
        return this._queriesDatabaseService.delete(session.tenantId, ALERTLOG, { userId: id }, 1);
      })
      .then(() => {
        return { data: [] };
      })
  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'Password Changed Successfully' })
  @ActivityLog("user_password_changed", CUSTOMER)
  @Response("Password Changed Successfully")
  @AuthJwtAccessProtected()
  @Patch('change-password')
  async resetPassword(@Body() body: ResetPasswordDto, @AuthJwtPayload() session: ISession): Promise<IResponse> {

    return Promise.resolve()
      .then(() => {
        return this._queriesDatabaseService.findOne(session.tenantId, CUSTOMER, { _id: session.userId, password: this._helperUtilService.MD5(body.oldPassword), isActive: true, isDeleted: false })
      })
      .then((user: ICustomer[]) => {
        if (!user.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Old password does not match",
          }, HttpStatus.NOT_FOUND);
        }
        return this._queriesDatabaseService.update(session.tenantId, CUSTOMER, { _id: session.userId, isActive: true, isDeleted: false }, { password: this._helperUtilService.MD5(body.newPassword), modified: this._helperDateService.dbDate() })
          .then(() => {
            if (session.ownerId === session.userId) {
              return this._masterQueriesService.update(CUSTOMERMASTER, { _id: session.ownerId, isActive: true, isDeleted: false }, { password: this._helperUtilService.MD5(body.newPassword), modified: this._helperDateService.dbDate() });
            }
          })
      })
      .then(() => {
        return { data: [] };
      })
  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'Profile Get Successfully' })
  @ActivityLog("user_get")
  @Response("profile get successfully")
  @AuthJwtAccessProtected()
  @Get('profile')
  async getProfile(@AuthJwtPayload() session: ISession): Promise<IResponse> {
    let user: ICustomer = {};
    return Promise.resolve()
      .then(() => {
        return this._queriesDatabaseService.findOne(session.tenantId, CUSTOMER, { _id: session.userId, isActive: true, isDeleted: false }, { name: 1,  email: 1,  mobile: 1})
      })
      .then((_user: ICustomer[]) => {
        if (!_user.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Something went wrong",
          }, HttpStatus.NOT_FOUND);
        }
        user = _user[0];
        })
      .then(() => {
        return { data: user }
      })


  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'Profile Updated Successfully' })
  @ActivityLog("user_updated", CUSTOMER)
  @Response("profile updated successfully")
  @AuthJwtAccessProtected()
  @Patch('profile')
  async updateProfile(@Body() body: UpdateProfileDto, @AuthJwtPayload() session: ISession): Promise<IResponse> {
    let profile: Record<string, any> = {
      name: body.name,
      email: body.email,
      mobile: body.mobile,
      modified: this._helperDateService.dbDate(),
    }
    return Promise.resolve()
      .then(() => {
        return this._queriesDatabaseService.findOne(session.tenantId, CUSTOMER, { _id: session.userId, isActive: true, isDeleted: false })
      })
      .then((user: ICustomer[]) => {
        if (!user.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: "Something went wrong",
          }, HttpStatus.NOT_FOUND);
        }

        //Both database under check first email and mobile this is baki
        if (session.ownerId === session.userId) {
          return this._masterQueriesService.update(CUSTOMERMASTER, { _id: session.ownerId, isActive: true, isDeleted: false }, profile);
        }
      })
      .then(() => {
        return this._queriesDatabaseService.update(session.tenantId, CUSTOMER, { _id: session.userId, isActive: true, isDeleted: false }, profile);
      })
      .then(() => {
        return { data: [] };
      })
  }

}
