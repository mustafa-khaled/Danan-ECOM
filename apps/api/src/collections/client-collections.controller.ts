import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { ClientGuard } from "../auth/guards/client.guard";
import { CurrentClient } from "../auth/decorators/current-client.decorator";
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
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.collections.getCollectionBySlug(
      slug,
      client.visibilityGroups,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
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
    );
  }
}
