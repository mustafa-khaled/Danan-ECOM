import { Controller, Get, UseGuards } from "@nestjs/common";
import { HomeService } from "./home.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client/home")
@UseGuards(ClientGuard)
export class ClientHomeController {
  constructor(private readonly home: HomeService) {}

  @Get("selected-pieces")
  getSelectedForYou(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.home.getSelectedForYou(client.clientId, client.visibilityGroups, locale);
  }
}
