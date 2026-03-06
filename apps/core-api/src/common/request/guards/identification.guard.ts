import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CUSTOMERMASTER } from 'src/common/database/constants/collection.constant';
import { MasterQueriesDatabaseService } from 'src/common/database/services/masterQueries.database.service';

@Injectable()
export class IdentificationGuard implements CanActivate {

  constructor(
      private readonly _masterQueriesService: MasterQueriesDatabaseService,
    ) {
  
    }
  canActivate( context: ExecutionContext, ): boolean | Promise<boolean> | Observable<boolean> {
    
    const {body , params} = context.switchToHttp().getRequest();
    const request = context.switchToHttp().getRequest();
    if(!body?.email && !params?.customerId){
      return true;  
    }
    return this._masterQueriesService.findOne(CUSTOMERMASTER, {$or : [{users: body?.email}, {_id: params?.customerId}]})
          .then((customer) => {
            if (customer.length) {
              request.tenantId = customer[0].tenantId
              return true; 
            }
            return true;
          })
  }
}
