import { Controller, Get, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client/notifications")
@UseGuards(ClientGuard)
export class ClientNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.notifications.list(client.clientId, locale);
  }
}
