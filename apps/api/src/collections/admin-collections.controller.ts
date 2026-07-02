import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CollectionsService } from "./collections.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";

class CreateCollectionDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}

class CreateDesignDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsString() collectionId!: string;
  @IsString() @MinLength(1) story!: string;
  @IsString() material!: string;
  @IsNumber() weight!: number;
  @IsString() dimensions!: string;
  @IsNumber() basePrice!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}

export class UpdateCollectionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}

export class UpdateDesignDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() collectionId?: string;
  @IsOptional() @IsString() @MinLength(1) story?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) visibilityGroups?: string[];
}

class SpecItemDto {
  @IsString() key!: string;
  @IsString() value!: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class BulkSpecsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specifications!: SpecItemDto[];
}

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminCollectionsController {
  constructor(private readonly collections: CollectionsService) {}

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
    // Reject oversized uploads during streaming, before buffering in memory.
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024, files: 1 } }),
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
