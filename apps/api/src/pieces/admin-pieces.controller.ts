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
import type { Request } from "express";
import { PiecesService } from "./pieces.service";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { CurrentAdmin } from "../admin/auth/decorators/current-admin.decorator";
import type { AdminSession } from "@dadan/types";
import { getClientIp } from "../common/constants";
import { PaginationQueryDto } from "../common/dto/pagination.dto";
import { RegisterPieceDto } from "./dto/register-piece.dto";
import { UpdatePieceDto } from "./dto/update-piece.dto";
import { AssignPieceDto } from "./dto/assign-piece.dto";

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
  list(@Query() query: PaginationQueryDto) {
    return this.pieces.listPieces(query.page, query.limit);
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
