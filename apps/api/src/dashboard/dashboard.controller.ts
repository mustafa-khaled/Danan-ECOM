import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/auth/guards/admin.guard";
import { RequireAdminArea } from "../admin/auth/decorators/require-admin-area.decorator";
import { AdminArea } from "../admin/auth/admin-permissions";
import { DashboardService } from "./dashboard.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@Controller("admin")
@UseGuards(AdminGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("overview")
  @RequireAdminArea(AdminArea.OVERVIEW)
  overview() {
    return this.dashboard.getOverview();
  }

  @Get("analytics")
  @RequireAdminArea(AdminArea.ANALYTICS)
  analytics(@Query() query: AnalyticsQueryDto) {
    return this.dashboard.getAnalytics(query.period ?? "12m");
  }
}
