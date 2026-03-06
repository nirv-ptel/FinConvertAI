import { Injectable, NestMiddleware, Logger, UnauthorizedException, HttpStatus, } from '@nestjs/common';
import { NextFunction } from 'express';
import { AuthService } from 'src/common/auth/auth.service';
import { CUSTOMERMASTER } from 'src/common/database/constants/collection.constant';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {

  private readonly logger = new Logger(TenantMiddleware.name);
  constructor(
    private readonly _authService: AuthService,
    private readonly _masterQueriesDatabaseService: MasterQueriesDatabaseService
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const { headers } = req;

    let tenantId: string = headers['X-TENANT-ID'] || headers['x-tenant-id'] || (headers as any)['tenant-id'] || (headers as any)['Tenant-Id'];

    if (!tenantId && headers['authorization']) {
      const token = headers['authorization'].split(' ');
      if (token[0] !== 'Bearer' || token.length == 2) {
        let decoded = this._authService.jwtDecrypt(token[1]);
        if (decoded) {
          if (this._authService.isPayloadEncrypt) {
            decoded = this._authService.aes256Decrypt(decoded.token);
          }
          if (decoded && decoded.tenantId) {
            req['tenantId'] = decoded.tenantId;
            tenantId = decoded.tenantId;
          }
        }
      }
    }
    if (!tenantId) {
      this.logger.error('`X-TENANT-ID` not provided');
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized"
      });
    }

    return this._masterQueriesDatabaseService.findOne(CUSTOMERMASTER, { tenantId })
      .then((isExist) => {
        if (!isExist.length) {
          this.logger.error('`X-TENANT-ID` Invalid');
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: "Unauthorized"
          });
        }
        if (isExist[0].isActive == false) {
          this.logger.error('Inactive Customer by system');
          // throw new UnauthorizedException('Inactive Customer by system');
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'Customer is inactive and cannot access the system'
          });
        }
        // console.warn(`Request TENANT ID => ${tenantId}`);
        req['tenantId'] = tenantId;
        next();
        return;
      })
  }
}