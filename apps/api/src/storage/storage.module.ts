import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ImageProcessingService } from "./image-processing.service";
import { UploadsController } from "./uploads.controller";

@Global()
@Module({
  controllers: [UploadsController],
  providers: [StorageService, ImageProcessingService],
  exports: [StorageService, ImageProcessingService],
})
export class StorageModule {}
