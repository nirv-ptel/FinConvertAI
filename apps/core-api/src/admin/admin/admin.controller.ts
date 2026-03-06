import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DocAuth } from 'src/common/doc/decorators/doc.decorator';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interface/response.interface';
import { ACCESSTOKEN, ADMINSDS } from 'src/common/database/constants/collection.constant';
import { HelperUtilService } from 'src/common/helper/services/helper.util.service';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { AuthService } from 'src/common/auth/auth.service';
import { AuthJwtAccessProtected, AuthJwtPayload } from 'src/common/auth/decorators/auth.jwt.decorator';
import { ISession } from 'src/common/auth/interface/auth.interface';
import { CreateAdminDto, } from './dto/create.admin.dto';
import { LoginAdminDto } from './dto/login.admin.dto';

@ApiTags('admin/auth')
@Controller('auth')
export class AdminController {
  constructor(
    private readonly _masterQueriesService: MasterQueriesDatabaseService,
    private readonly _helperUtilService: HelperUtilService,
    private readonly _authService: AuthService,
    private readonly _helperDateService: HelperDateService,
  ) { }

  @ApiCreatedResponse({ description: 'Singup Success' })
  @Response("Singup Successfully")
  @Post('singup')
  async singup(@Body() body: CreateAdminDto): Promise<IResponse> {

    const { email, name, mobile, password }: CreateAdminDto = body;

    return Promise.resolve()
      .then(() => {
        let data: Record<string, any> = {
          name: name,
          email: email,
          mobile: mobile,
        };
        return this._masterQueriesService.insert(ADMINSDS, { ...data, password: this._helperUtilService.MD5(password) });
      })
      .then(() => {
        return { data: [] }
      })
  }

  @ApiCreatedResponse({ description: 'Login Success' })
  @Response("Login Successfully")
  @Post('login')
  async login(@Body() body: LoginAdminDto): Promise<IResponse> {

    const { email, password }: LoginAdminDto = body;
    let admin: Record<string, any> = {};

    return Promise.resolve()
      .then(() => {
        let project: Record<string, any> = {
          _id: 1,
          role: 1,
          email: 1,
          mobile: 1,
          address: 1,
          created: 1,
          modified: 1,
        };
        return this._masterQueriesService.find(ADMINSDS, { 'email': email, 'password': this._helperUtilService.MD5(password) }, project);
      })
      .then((user) => {
        if (!user.length) {
          throw new HttpException({
            status: HttpStatus.NOT_FOUND,
            error: 'Invalid email or password',
          }, HttpStatus.NOT_FOUND);
        }
        admin = user[0];

        let token: Record<string, any> = {
          user: "admin",
          userId: admin._id,
          ttl: this._authService.getAccessTokenExpirationTime(),
          created: this._helperDateService.dbDate()
        };
        return this._masterQueriesService.insert(ACCESSTOKEN, token);
      })
      .then((token: any) => {
        let tokenInfo: Record<string, any> = {
          user: "admin",
          userId: admin._id,
          tokenId: token.insertedId,
        };
        if (this._authService.isPayloadEncrypt) {
          admin.token = this._authService.aes256Encrypt(tokenInfo);
          return { token: admin.token };
        }
        return tokenInfo;
      })
      .then((token: any | { token: string }) => {

        return this._authService.createAccessToken(token);
      })
      .then((token) => {
        admin.token = token;
        delete admin.password;
        return { data: admin };
      })
  }

  @DocAuth()
  @ApiCreatedResponse({ description: 'logout user successfully' })
  @Response("logout successfully")
  @AuthJwtAccessProtected()
  @Get('/logout')
  async logout(@AuthJwtPayload() session: ISession): Promise<IResponse> {
    return Promise.resolve().then(() => {
      return this._masterQueriesService.delete(ACCESSTOKEN, { _id: session.tokenId });
    })
      .then(() => {
        return { data: [] };
      })
  }

}
