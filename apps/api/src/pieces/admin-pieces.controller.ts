import {
  Body,
  Controller,
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
import { PiecesService } from "./pieces.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { AdminPieceQueryDto } from "./dto/admin-piece-query.dto";
import { RegisterPieceDto } from "./dto/register-piece.dto";
import { UpdatePieceDto } from "./dto/update-piece.dto";
import { AssignPieceDto } from "./dto/assign-piece.dto";
import { BulkSpecsDto } from "../collections/dto/spec-item.dto";

@Controller("admin/pieces")
@UseGuards(AdminGuard)
export class AdminPiecesController {
  constructor(private readonly pieces: PiecesService) {}

  @Post()
  register(
    @CurrentAdmin() admin: AdminSession,
    @Body() dto: RegisterPieceDto,
    @Req() req: Request,
  ) {
    return this.pieces.registerPiece(admin.adminId, dto, getClientIp(req));
  }

  @Get()
  list(@Query() query: AdminPieceQueryDto) {
    return this.pieces.listPieces(query.page, query.limit, {
      collectionId: query.collectionId,
      status: query.status,
      isActive: query.isActive,
      q: query.q,
    });
  }

  @Get("stats")
  stats(@Query() query: AdminPieceQueryDto) {
    return this.pieces.getPieceStats(query.collectionId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.pieces.getPieceById(id);
  }

  @Patch(":id")
  update(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: UpdatePieceDto,
    @Req() req: Request,
  ) {
    return this.pieces.updatePiece(admin.adminId, id, dto, getClientIp(req));
  }

  @Post(":id/assign")
  assign(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: AssignPieceDto,
    @Req() req: Request,
  ) {
    return this.pieces.assignPiece(admin.adminId, id, dto, getClientIp(req));
  }

  @Post(":id/images")
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
    return this.pieces.uploadPieceImage(
      admin.adminId,
      id,
      file.buffer,
      file.mimetype,
      getClientIp(req),
    );
  }

  @Post(":id/specifications")
  upsertSpecs(
    @CurrentAdmin() admin: AdminSession,
    @Param("id") id: string,
    @Body() dto: BulkSpecsDto,
    @Req() req: Request,
  ) {
    return this.pieces.upsertSpecifications(
      admin.adminId,
      id,
      dto.specifications,
      getClientIp(req),
    );
  }
}
