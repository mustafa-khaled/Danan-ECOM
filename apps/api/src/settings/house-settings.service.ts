import { Injectable, NotFoundException } from "@nestjs/common";
import { ActorType, Prisma } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateHouseSettingsDto } from "./dto/update-house-settings.dto";

const DEFAULT_ID = "default";

const DEFAULT_NOTIFICATIONS = {
  ownershipTransferRequest: true,
  transferCompleted: true,
  newMemberInvitation: true,
  certificateIssued: true,
  accessRequest: true,
  paymentCompleted: true,
  paymentFailed: true,
};

@Injectable()
export class HouseSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const settings = await this.prisma.db.houseSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (!settings) throw new NotFoundException("errors.HOUSE_SETTINGS_NOT_FOUND");
    return settings;
  }

  async update(adminId: string, dto: UpdateHouseSettingsDto, ipAddress?: string) {
    const existing = await this.get();
    const notificationPrefs = dto.notificationPrefs
      ? {
          ...(typeof existing.notificationPrefs === "object" && existing.notificationPrefs
            ? existing.notificationPrefs
            : DEFAULT_NOTIFICATIONS),
          ...dto.notificationPrefs,
        }
      : undefined;

    const updated = await this.prisma.db.houseSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...dto,
        notificationPrefs: notificationPrefs as Prisma.InputJsonValue | undefined,
      },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "HOUSE_SETTINGS_UPDATED",
      targetType: "HouseSettings",
      targetId: DEFAULT_ID,
      ipAddress,
    });

    return updated;
  }
}
