import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { CollectionsService } from "./collections.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { PaginationQueryDto } from "../common/dto/pagination.dto";
import { AdminDesignQueryDto } from "./dto/admin-design-query.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { CreateDesignDto } from "./dto/create-design.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { UpdateDesignDto } from "./dto/update-design.dto";
import { BulkSpecsDto } from "./dto/spec-item.dto";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminCollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get("collections")
  listCollections(@Query() query: PaginationQueryDto) {
    return this.collections.listCollectionsAdmin(query.page, query.limit);
  }

  @Get("collections/:id")
  getCollection(@Param("id") id: string) {
    return this.collections.getCollectionAdmin(id);
  }

  @Get("designs")
  listDesigns(@Query() query: AdminDesignQueryDto) {
    return this.collections.listDesignsAdmin(query.page, query.limit, query.collectionId);
  }

  @Get("designs/:id")
  getDesign(@Param("id") id: string) {
    return this.collections.getDesignAdmin(id);
  }

  @Post("collections")
  createCollection(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateCollectionDto,
    @Req() req: Request,
  ) {
    return this.collections.createCollection(admin.adminId, dto, getClientIp(req));
  }

  @Patch("collections/:id")
  updateCollection(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdateCollectionDto,
    @Req() req: Request,
  ) {
    return this.collections.updateCollection(admin.adminId, id, { ...dto }, getClientIp(req));
  }

  @Delete("collections/:id")
  deleteCollection(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.collections.deleteCollection(admin.adminId, id, getClientIp(req));
  }

  @Post("designs")
  createDesign(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: CreateDesignDto,
    @Req() req: Request,
  ) {
    return this.collections.createDesign(admin.adminId, dto, getClientIp(req));
  }

  @Patch("designs/:id")
  updateDesign(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdateDesignDto,
    @Req() req: Request,
  ) {
    return this.collections.updateDesign(admin.adminId, id, { ...dto }, getClientIp(req));
  }

  @Delete("designs/:id")
  deleteDesign(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.collections.deleteDesign(admin.adminId, id, getClientIp(req));
  }

  @Post("designs/:id/images")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  uploadImage(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: Request,
  ) {
    return this.collections.uploadDesignImage(
      admin.adminId,
      id,
      file.buffer,
      file.mimetype,
      getClientIp(req),
    );
  }

  @Post("designs/:id/specifications")
  upsertSpecs(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: BulkSpecsDto,
    @Req() req: Request,
  ) {
    return this.collections.upsertSpecifications(
      admin.adminId,
      id,
      dto.specifications,
      getClientIp(req),
    );
  }
}
