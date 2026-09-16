import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { RequireAdminArea } from "../admin/auth/decorators/require-admin-area.decorator";
import { AdminArea } from "../admin/auth/admin-permissions";
import { OwnershipService } from "./ownership.service";
import { AdminOwnershipQueryDto } from "./dto/admin-ownership-query.dto";

@Controller("admin/ownership")
@UseGuards(AdminGuard)
@RequireAdminArea(AdminArea.OWNERSHIP)
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
  getOne(@Param("pieceId", ParseUUIDPipe) pieceId: string) {
    return this.ownership.getByPieceId(pieceId);
  }
}
