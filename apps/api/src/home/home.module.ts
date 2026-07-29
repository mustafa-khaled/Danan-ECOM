import { Module } from "@nestjs/common";
import { HomeService } from "./home.service";
import { ClientHomeController } from "./client-home.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ClientHomeController],
  providers: [HomeService],
})
export class HomeModule {}
