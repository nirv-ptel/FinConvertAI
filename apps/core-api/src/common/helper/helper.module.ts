import { Global, Module } from '@nestjs/common';
import { HelperDateService } from './services/helper.date.service';
import { HelperUtilService } from './services/helper.util.service';
import { UploadService } from './services/upload.service';

@Global()
@Module({
  providers: [HelperDateService,HelperUtilService,UploadService],
  exports:[HelperDateService,HelperUtilService,UploadService]
})
export class HelperModule {}
