import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ACCESSTOKEN, CUSTOMER, CUSTOMERMASTER, OTP, ROLE } from 'src/common/database/constants/collection.constant';
import { Response } from 'src/common/response/decorators/response.decorator';
import { LoginCustomerDto } from '../dto/login.customer.dto';
import { IResponse } from 'src/common/response/interface/response.interface';
import { ICustomer } from '../interface/customer.interface';
import { ISession } from 'src/common/auth/interface/auth.interface';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';
import { QueriesDatabaseService } from 'src/common/database/services/queries.database.service';
import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { HelperUtilService } from 'src/common/helper/services/helper.util.service';
import { AuthService } from 'src/common/auth/auth.service';
import { MailService } from 'src/common/mail/mail.service';
import { DocAuth } from 'src/common/doc/decorators/doc.decorator';
import { AuthJwtAccessProtected, AuthJwtPayload } from 'src/common/auth/decorators/auth.jwt.decorator';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordWithToken } from '../dto/reset-password-with-token.customer.dto';
import { ActivityLog } from 'src/common/activity-log/decorator/activity-log.decorator';
import { IdentificationGuard } from 'src/common/request/guards/identification.guard';
import { CreateUserDto } from '../dto/create.customer.dto';
import { VerifyOtpDto } from '../dto/verify-otp.customer.dto';
import { ResendOtpDto } from '../dto/resend-otp.customer.dto';
import { Db, MongoClient } from 'mongodb';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        @Inject('MONGO_CLIENT') private client: MongoClient,
        private readonly _authService: AuthService,
        private readonly _helperUtilService: HelperUtilService,
        private readonly _helperDateService: HelperDateService,
        private readonly _databaseService: DatabaseService,
        private readonly _queriesDatabaseService: QueriesDatabaseService,
        private readonly _masterQueriesService: MasterQueriesDatabaseService,
        private readonly _mailService: MailService,
    ) { }

    /** Generate a 6-digit numeric OTP */
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /** Save OTP to the master DB (Otp collection) and send email */
    private async sendOtpEmail(email: string, name: string): Promise<string> {
        const otp = this.generateOtp();
        const now = this._helperDateService.dbDate();

        // Check if OTP doc already exists for this email
        const existingOtp = await this._masterQueriesService.findOne(OTP, { email: email });

        if (existingOtp.length) {
            // Update existing OTP
            await this._masterQueriesService.update(OTP, { email: email }, {
                otp: otp,
                isUsed: false,
                createdAt: now,
                ttl: 10 * 60 * 1000,
            });
        } else {
            // Insert new OTP doc
            await this._masterQueriesService.insert(OTP, {
                email: email,
                otp: otp,
                isUsed: false,
                createdAt: now,
                ttl: 10 * 60 * 1000,
            }, '', false);
        }

        // Send OTP email (non-blocking — failure won't throw)
        this._mailService.sendMail(
            email,
            'Verify Your Email - Repotics',
            './otpMail',
            { name: name, otp: otp }
        );

        return otp;
    }

    @ApiCreatedResponse({ description: 'success' })
    @Response('OTP sent to your email. Please verify to complete registration.', HttpStatus.OK)
    @Post('signup')
    async signup(@Body() body: CreateUserDto): Promise<IResponse> {

        return Promise.resolve()
            .then(() => {
                // Check if already registered in CUSTOMERMASTER
                return this._masterQueriesService.findOne(CUSTOMERMASTER, {
                    $or: [{ email: body.email }, { mobile: body.mobile }]
                });
            })
            .then((_exist: ICustomer[]) => {
                if (_exist.length > 0 && _exist[0].email == body.email) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Email already exists',
                    }, HttpStatus.BAD_REQUEST);
                }
                if (_exist.length > 0 && _exist[0].mobile == body.mobile) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Mobile already exists',
                    }, HttpStatus.BAD_REQUEST);
                }
                // Also check if pending OTP signup exists
                return this._masterQueriesService.findOne(OTP, { email: body.email, isPendingRegistration: true, isUsed: false });
            })
            .then((otpDocs: any[]) => {
                // If already pending, just update OTP and resend
                const now = this._helperDateService.dbDate();
                const otp = this.generateOtp();
                const tenantId = this._databaseService.getUUID();
                const customerId = this._databaseService.getInsertId();

                const otpData: Record<string, any> = {
                    email: body.email,
                    name: body.name,
                    mobile: body.mobile,
                    password: this._helperUtilService.MD5(body.password),
                    tenantId: tenantId,
                    customerId: customerId,
                    otp: otp,
                    isUsed: false,
                    isPendingRegistration: true,
                    createdAt: now,
                    ttl: 10 * 60 * 1000,
                };

                if (otpDocs.length) {
                    // Update existing pending record
                    return this._masterQueriesService.update(OTP, { email: body.email }, otpData)
                        .then(() => ({ otp, name: body.name, email: body.email }));
                } else {
                    // Insert new OTP record
                    return this._masterQueriesService.insert(OTP, otpData, '', false)
                        .then(() => ({ otp, name: body.name, email: body.email }));
                }
            })
            .then(({ otp, name, email }) => {
                // Send OTP email
                this._mailService.sendMail(email, 'Verify Your Email - Repotics', './otpMail', { name, otp });
                return { data: { message: 'OTP sent to your email. Please verify to complete registration.' } };
            })
            .catch((error) => {
                if (error instanceof HttpException) return Promise.reject(error);
                throw new HttpException({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Signup failed. Please try again.',
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            });
    }


    @ApiCreatedResponse({ description: 'Email verified and account created successfully' })
    @Response('Email verified successfully. You are now logged in.', HttpStatus.OK)
    @Post('verify-otp')
    async verifyOtp(@Body() body: VerifyOtpDto): Promise<IResponse> {
        const { email, otp } = body;
        let otpDoc: any;

        return Promise.resolve()
            .then(() => {
                // Find the pending OTP record (which holds all signup details)
                return this._masterQueriesService.findOne(OTP, { email: email });
            })
            .then((otpDocs: any[]) => {
                otpDoc = otpDocs[0];
                if (!otpDoc) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'OTP not found. Please signup first.',
                    }, HttpStatus.BAD_REQUEST);
                }
                if (otpDoc.isUsed) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'OTP already used. Please login.',
                    }, HttpStatus.BAD_REQUEST);
                }
                const createdAt = new Date(otpDoc.createdAt).getTime();
                if (Date.now() > createdAt + otpDoc.ttl) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'OTP expired. Please resend OTP.',
                    }, HttpStatus.BAD_REQUEST);
                }
                if (otpDoc.otp !== otp) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Invalid OTP. Please try again.',
                    }, HttpStatus.BAD_REQUEST);
                }
                // OTP valid — mark as used
                return this._masterQueriesService.update(OTP, { email: email }, { isUsed: true });
            })
            .then(() => {
                // Now create the user in CUSTOMERMASTER
                const userDoc: Record<string, any> = {
                    name: otpDoc.name,
                    email: otpDoc.email,
                    mobile: otpDoc.mobile,
                    password: otpDoc.password,
                    tenantId: otpDoc.tenantId,
                    isActive: true,
                    isDeleted: false,
                    isEmailVerified: true,
                };
                return this._masterQueriesService.insert(CUSTOMERMASTER, userDoc, otpDoc.customerId);
            })
            .then(() => {
                // Also create user in tenant DB
                const tenantDoc: Record<string, any> = {
                    _id: otpDoc.customerId,
                    name: otpDoc.name,
                    email: otpDoc.email,
                    mobile: otpDoc.mobile,
                    password: otpDoc.password,
                    tenantId: otpDoc.tenantId,
                    isActive: true,
                    isDeleted: false,
                    isEmailVerified: true,
                    created: this._helperDateService.dbDate(),
                    modified: this._helperDateService.dbDate(),
                };
                return this.client.db(otpDoc.tenantId).collection(CUSTOMER).insertOne(tenantDoc);
            })
            .then(() => {
                // Generate access token
                const tokenId = this._databaseService.getInsertId();
                const tokenDoc = {
                    user: 'customer',
                    userId: otpDoc.customerId,
                    ttl: this._authService.getAccessTokenExpirationTime(),
                    created: this._helperDateService.dbDate(),
                };
                return this.client.db(otpDoc.tenantId).collection(ACCESSTOKEN).insertOne({ ...tokenDoc, _id: tokenId as any })
                    .then(() => tokenId);
            })
            .then((tokenId: string) => {
                const tokenInfo: ISession = {
                    userId: otpDoc.customerId,
                    tokenId: tokenId,
                    email: otpDoc.email,
                    name: otpDoc.name,
                    mobile: otpDoc.mobile,
                    tenantId: otpDoc.tenantId,
                };
                return this._authService.createAccessToken(tokenInfo);
            })
            .then((token: string) => {
                return { data: { token, tenantId: otpDoc.tenantId } };
            });
    }


    @ApiCreatedResponse({ description: 'OTP resent successfully' })
    @Response('OTP sent successfully. Please check your email.', HttpStatus.OK)
    @Post('resend-otp')
    async resendOtp(@Body() body: ResendOtpDto): Promise<IResponse> {
        const { email } = body;

        return Promise.resolve()
            .then(() => {
                // Check OTP collection for pending signup
                return this._masterQueriesService.findOne(OTP, { email: email, isPendingRegistration: true });
            })
            .then((otpDocs: any[]) => {
                if (!otpDocs.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: 'No pending signup found for this email.',
                    }, HttpStatus.NOT_FOUND);
                }
                const pendingUser = otpDocs[0];
                if (!pendingUser.isPendingRegistration) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Email already verified. Please login.',
                    }, HttpStatus.BAD_REQUEST);
                }
                const otp = this.generateOtp();
                const now = this._helperDateService.dbDate();
                return this._masterQueriesService.update(OTP, { email: email }, {
                    otp: otp,
                    isUsed: false,
                    createdAt: now,
                    ttl: 10 * 60 * 1000,
                }).then(() => ({ otp, name: pendingUser.name }));
            })
            .then(({ otp, name }) => {
                this._mailService.sendMail(email, 'Verify Your Email - Repotics', './otpMail', { name, otp });
                return { data: [] };
            });
    }


    @ApiCreatedResponse({ description: 'success' })
    @ActivityLog('signed_in', CUSTOMER)
    @Response('login success', HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginCustomerDto): Promise<IResponse> {
        let user: Partial<ICustomer> = {};
        let email: string = body.email;
        let password: string = body.password;

        return Promise.resolve()
            .then(() => {
                // Check if email has a pending OTP signup (not yet verified)
                return this._masterQueriesService.findOne(OTP, { email: body.email, isPendingRegistration: true, isUsed: false });
            })
            .then((pendingOtp: any[]) => {
                if (pendingOtp.length) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Please verify your email OTP before logging in.',
                    }, HttpStatus.BAD_REQUEST);
                }
                // Find user in CUSTOMERMASTER by email
                return this._masterQueriesService.findOne(CUSTOMERMASTER, { email: body.email }, { email: 1, tenantId: 1, isActive: 1, isEmailVerified: 1 });
            })
            .then((_user: ICustomer[]) => {
                if (!_user.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: 'Invalid username or password',
                    }, HttpStatus.NOT_FOUND);
                }
                if (_user[0].isActive == false) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: 'Please contact your admin to activate your account',
                    }, HttpStatus.NOT_FOUND);
                }
                user['tenantId'] = _user[0].tenantId;

                return this._queriesDatabaseService.findOne(_user[0].tenantId, CUSTOMER, { email: email, password: this._helperUtilService.MD5(password) }, { created: 0, modified: 0, users: 0 },);
            })
            .then((subcustomer: ICustomer[]) => {
                if (!subcustomer.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: 'Invalid username or password',
                    }, HttpStatus.NOT_FOUND);
                }
                let customer = subcustomer[0];
                if (!customer.isActive) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: 'Please contact your admin to activate your account',
                    }, HttpStatus.NOT_FOUND,);
                }
                user = { ...user, ...customer };
            })
            .then(() => {
                //insert token token
                let token: Record<string, any> = {
                    user: 'customer',
                    userId: user._id,
                    ttl: this._authService.getAccessTokenExpirationTime(),
                    created: this._helperDateService.dbDate(),
                };
                token['_id'] = this._databaseService.getInsertId();
                return this._queriesDatabaseService.insert(user.tenantId, ACCESSTOKEN, token);
            })
            .then((token: any) => {
                let tokenInfo: ISession = {
                    userId: user._id,
                    ownerId: user.ownerId,
                    tokenId: token.insertedId,
                    email: user.email,
                    name: user.name,
                    mobile: user.mobile,
                    tenantId: user.tenantId,
                };

                if (this._authService.isPayloadEncrypt) {
                    user.token = this._authService.aes256Encrypt(tokenInfo);
                    return { token: user.token };
                }
                return tokenInfo;
            })
            .then((token: ISession | { token: string }) => {
                return this._authService.createAccessToken(token);
            })
            .then((token: string) => {
                user.token = token;
                return { data: { token: user.token, tenantId: user.tenantId } };
            });
    }


    @DocAuth()
    @ApiCreatedResponse({ description: 'logout user successfully' })
    @ActivityLog('signed_out', CUSTOMER)
    @Response('logout user successfully')
    @AuthJwtAccessProtected()
    @Get('logout')
    async logout(@AuthJwtPayload() session: ISession): Promise<IResponse> {
        return Promise.resolve()
            .then(() => {
                return this._queriesDatabaseService.delete(session.tenantId, ACCESSTOKEN, { _id: session.tokenId });
            })
            .then(() => {
                return { data: [] };
            });
    }

    @ApiCreatedResponse({ description: 'Reset password link sent to your email. Expires in 15 minutes.' })
    @ActivityLog("forgot_password", CUSTOMER)
    @UseGuards(IdentificationGuard)
    @Response("Reset password link sent to your email. Expires in 15 minutes.")
    @Post('forgot-password')
    async forgotPassword(@Body() body: ForgotPasswordDto): Promise<any> {
        /* ------------Param Define------------- */
        let forgotPassword: Record<string, any> = {};
        const email: string = body.email;
        let customer: Record<string, any> = {};
        let user: Record<string, any> = {};
        let tokenInfo: Record<string, any> = {}
        let tenantId: string
        let encryptToken: any
        /* ------------------------------------- */
        return Promise.resolve().then(() => {
            return this._masterQueriesService.findOne(CUSTOMERMASTER, { users: { $in: [email] }, isActive: true, isDeleted: false }, { _id: 1, tenantId: 1, name: 1 });
        })
            .then((_customer: ICustomer[]) => {
                if (!_customer.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: "email is invalid",
                    }, HttpStatus.NOT_FOUND);
                }
                customer = _customer[0];
                tenantId = customer.tenantId
                return this._queriesDatabaseService.findOne(tenantId, CUSTOMER, { email: email, isActive: true, isDeleted: false });
            })
            .then((_user: Record<string, any>[]) => {
                if (!_user.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: "email is not exist",
                    }, HttpStatus.NOT_FOUND);
                }
                tokenInfo = {
                    email: _user[0].email,
                    tenantId: tenantId
                }
                encryptToken = this._authService.aes256Encrypt(tokenInfo);
                user = _user[0];

                if (_user[0].forgotPassword && _user[0].forgotPassword.ttl) {
                    let t: number = this._helperDateService.timeBetween(_user[0].forgotPassword.created, _user[0].forgotPassword.ttl)
                    if (t == 1) {
                        throw new HttpException({
                            status: HttpStatus.BAD_REQUEST,
                            error: "Reset password link already sent.Try again in 15 minutes",
                        }, HttpStatus.BAD_REQUEST);
                    }

                }
                forgotPassword = {
                    token: encryptToken,
                    ttl: 1000 * 60 * 15, // 15 min to valid
                    isUsed: false,
                    created: this._helperDateService.dbDate()
                };

                return this._queriesDatabaseService.update(tenantId, CUSTOMER, { email: email }, { forgotPassword, modified: this._helperDateService.dbDate() });
            })
            .then(() => {
                let encodedToken = encodeURIComponent(forgotPassword?.token);
                let body: Record<string, any> = {
                    name: user?.name,
                    link: `${process.env.WEB_PORTAL_URL}/reset-password?token=${encodedToken}`
                }
                return this._mailService.sendMail(email, "Forgot Password", "./resetPasswordCustomerMail", body)
            })
            .then(() => {
                return { data: [] };
            })
    }

    @Response("Password Changed Successfully ")
    @ActivityLog("reset_password", CUSTOMER)
    @Post('reset-password')
    async changePasswordByResetToken(@Body() body: ResetPasswordWithToken, @Req() req): Promise<IResponse> {

        const { password, token }: ResetPasswordWithToken = body
        let customer: ICustomer = {};
        let user: Record<string, any> = {};
        let tokenInfo: Record<string, any> = {}
        const encryptedPassword = this._helperUtilService.MD5(password)
        return Promise.resolve()
            .then(() => {
                tokenInfo = this._authService.aes256Decrypt(token);
                if (!tokenInfo) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: "Something went wrong",
                    }, HttpStatus.NOT_FOUND);
                }

                req['tenantId'] = tokenInfo.tenantId;
                return this._masterQueriesService.find(CUSTOMERMASTER, { tenantId: tokenInfo.tenantId, users: { $in: [tokenInfo.email] }, isActive: true });
            })
            .then((_customer: ICustomer[]) => {
                if (!_customer.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: "Something went wrong",
                    }, HttpStatus.NOT_FOUND);
                }
                customer = _customer[0];

                return this._queriesDatabaseService.findOne(customer.tenantId, CUSTOMER, { 'forgotPassword.token': token, isActive: true });
            })
            .then((_user: Record<string, any>[]) => {
                if (!_user.length) {
                    throw new HttpException({
                        status: HttpStatus.NOT_FOUND,
                        error: "Something went wrong",
                    }, HttpStatus.NOT_FOUND);
                }
                if (_user[0].forgotPassword && _user[0].forgotPassword.ttl) {
                    let t: number = this._helperDateService.timeBetween(_user[0].forgotPassword.created, _user[0].forgotPassword.ttl)
                    if (t != 1) {
                        throw new HttpException({
                            status: HttpStatus.BAD_REQUEST,
                            error: "token has been expired or used.",
                        }, HttpStatus.BAD_REQUEST);
                    }
                    if (_user[0].forgotPassword.isUsed) {
                        throw new HttpException({
                            status: HttpStatus.BAD_REQUEST,
                            error: "Already reset password with this token.",
                        }, HttpStatus.BAD_REQUEST);
                    }
                }
                user = _user;
                return this._queriesDatabaseService.update(customer.tenantId, CUSTOMER, { email: tokenInfo.email }, { 'forgotPassword.isUsed': true, password: encryptedPassword, modified: this._helperDateService.dbDate() });
            })
            .then(() => {
                if (user._id == customer.ownerId) {
                    return this._masterQueriesService.update(CUSTOMERMASTER, { _id: customer._id }, { password: encryptedPassword, modified: this._helperDateService.dbDate() });
                }
            })
            .then(() => {
                return { data: [], tenantId: customer.tenantId };
            })
    }
}
