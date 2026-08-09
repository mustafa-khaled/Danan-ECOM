import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
import { PaginationQueryDto } from "../common/dto/pagination.dto";
import { CurrentLocale } from "../common/i18n/locale";
import type { ClientSession, Locale } from "@dadan/types";

@Controller("client")
@UseGuards(ClientGuard)
export class ClientCollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get("collections")
  list(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
  ) {
    return this.collections.getVisibleCollections(
      client.visibilityGroups,
      locale,
    );
  }

  @Get("collections/:slug")
  getCollection(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Param("slug") slug: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.collections.getCollectionBySlug(
      slug,
      client.visibilityGroups,
      query.page,
      query.limit,
      locale,
    );
  }

  @Get("designs/:slug")
  getDesign(
    @CurrentClient() client: ClientSession,
    @CurrentLocale() locale: Locale,
    @Param("slug") slug: string,
  ) {
    return this.collections.getDesignBySlug(
      slug,
      client.visibilityGroups,
      locale,
      client.clientId,
    );
  }
}
