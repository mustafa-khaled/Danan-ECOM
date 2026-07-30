import { Module } from "@nestjs/common";
import { HomeService } from "./home.service";
import { ClientHomeController } from "./client-home.controller";
import { AuthModule } from "../auth/auth.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [ClientHomeController],
  providers: [HomeService],
})
export class HomeModule {}
