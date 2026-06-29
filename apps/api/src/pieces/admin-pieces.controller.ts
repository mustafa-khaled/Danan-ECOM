import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AcquisitionType, PieceStatus } from "@dadan/db";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import type { Request } from "express";
import { PiecesService } from "./pieces.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";

class RegisterPieceDto {
  @IsUUID() designId!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUUID() initialClientId?: string;
}

class UpdatePieceDto {
  @IsOptional() @IsEnum(PieceStatus) status?: PieceStatus;
  @IsOptional() @IsString() notes?: string;
}

class AssignPieceDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsEnum(AcquisitionType) acquisitionType?: AcquisitionType;
  @IsOptional() @IsString() notes?: string;
}

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
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.pieces.listPieces(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
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
}
