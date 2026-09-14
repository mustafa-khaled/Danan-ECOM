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
import { AdminCollectionQueryDto } from "./dto/admin-collection-query.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

const imageUpload = FileInterceptor("file", {
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminCollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get("collections")
  listCollections(@Query() query: AdminCollectionQueryDto) {
    return this.collections.listCollectionsAdmin(query.page, query.limit, {
      q: query.q,
      isVisible: query.isVisible,
      classId: query.classId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get("collections/stats")
  collectionStats() {
    return this.collections.getCollectionStats();
  }

  @Get("collections/:id")
  getCollection(@Param("id") id: string) {
    return this.collections.getCollectionAdmin(id);
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
    return this.collections.updateCollection(admin.adminId, id, dto, getClientIp(req));
  }

  @Post("collections/:id/cover")
  @UseInterceptors(imageUpload)
  uploadCover(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: Request,
  ) {
    return this.collections.uploadCover(
      admin.adminId,
      id,
      file.buffer,
      file.mimetype,
      getClientIp(req),
    );
  }

  @Post("collections/:id/story-images")
  @UseInterceptors(imageUpload)
  uploadStoryImage(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: Request,
  ) {
    return this.collections.uploadStoryImage(
      admin.adminId,
      id,
      file.buffer,
      file.mimetype,
      getClientIp(req),
    );
  }

  @Delete("collections/:id")
  deleteCollection(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return this.collections.deleteCollection(admin.adminId, id, getClientIp(req));
  }
}
