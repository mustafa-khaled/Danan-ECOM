import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { OwnershipService } from "./ownership.service";
import { AdminOwnershipQueryDto } from "./dto/admin-ownership-query.dto";

@Controller("admin/ownership")
@UseGuards(AdminGuard)
export class OwnershipController {
  constructor(private readonly ownership: OwnershipService) {}

  @Get()
  list(@Query() query: AdminOwnershipQueryDto) {
    return this.ownership.list(query.page, query.limit, {
      q: query.q,
      status: query.status,
      collectionId: query.collectionId,
    });
  }

  @Get("stats")
  stats() {
    return this.ownership.stats();
  }

  @Get(":pieceId")
  getOne(@Param("pieceId") pieceId: string) {
    return this.ownership.getByPieceId(pieceId);
  }
}
