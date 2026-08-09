import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import type { ClientSession } from "@dadan/types";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("client/profile")
@UseGuards(ClientGuard)
export class ClientProfileController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  getProfile(@CurrentClient() client: ClientSession) {
    return this.clients.getProfile(client.clientId);
  }

  @Get("summary")
  getProfileSummary(@CurrentClient() client: ClientSession) {
    return this.clients.getProfileSummary(client.clientId);
  }

  @Patch()
  updateProfile(
    @CurrentClient() client: ClientSession,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.clients.updateProfile(client.clientId, dto);
  }
}
