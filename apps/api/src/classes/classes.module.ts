import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin/auth/admin-auth.module";
import { AdminClassesController } from "./admin-classes.controller";
import { ClassesService } from "./classes.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
