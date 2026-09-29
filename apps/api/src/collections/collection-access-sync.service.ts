import { Injectable, Logger } from "@nestjs/common";
import {
  ActorType,
  Prisma,
  StaffRequestStatus,
  StaffRequestType,
} from "@dadan/db";

const OPEN_STATUSES = [
  StaffRequestStatus.PENDING,
  StaffRequestStatus.UNDER_REVIEW,
] as const;

/**
 * Keeps `StaffRequest` ACCESS_REQUEST rows in step with the access a member
 * actually has.
 *
 * Collection access is granted by linking a collection to a class
 * (`CollectionClass`), which can happen in three places: approving the request
 * itself, editing a collection's classes, or moving a member to another class.
 * Only the first one used to close the request, so a member could hold access
 * while their request sat at `PENDING` forever.
 *
 * Every method takes the caller's transaction so the request state and the grant
 * commit together. The sync is deliberately one-directional: revoking access does
 * not reopen a request that an admin already closed.
 */
@Injectable()
export class CollectionAccessSyncService {
  private readonly logger = new Logger(CollectionAccessSyncService.name);

  /**
   * Call after a collection's class links have been rewritten. Closes requests
   * for this collection whose requester now sits in one of the granted classes.
   */
  async syncForCollectionClasses(
    tx: Prisma.TransactionClient,
    collectionId: string,
    grantedClassIds: string[],
    adminId: string,
  ): Promise<number> {
    if (grantedClassIds.length === 0) return 0;

    return this.complete(
      tx,
      {
        collectionId,
        client: { classId: { in: grantedClassIds } },
      },
      adminId,
    );
  }

  /**
   * Call after a member's class has changed. Closes that member's requests for
   * every collection their new class can already see.
   */
  async syncForClientClass(
    tx: Prisma.TransactionClient,
    clientId: string,
    classId: string,
    adminId: string,
  ): Promise<number> {
    const links = await tx.collectionClass.findMany({
      where: { classId },
      select: { collectionId: true },
    });
    if (links.length === 0) return 0;

    return this.complete(
      tx,
      {
        clientId,
        collectionId: { in: links.map((link) => link.collectionId) },
      },
      adminId,
    );
  }

  private async complete(
    tx: Prisma.TransactionClient,
    scope: Pick<Prisma.StaffRequestWhereInput, "collectionId" | "clientId" | "client">,
    adminId: string,
  ): Promise<number> {
    const satisfied = await tx.staffRequest.findMany({
      where: {
        ...scope,
        type: StaffRequestType.ACCESS_REQUEST,
        status: { in: [...OPEN_STATUSES] },
      },
      select: { id: true, clientId: true, collectionId: true },
    });
    if (satisfied.length === 0) return 0;

    const reviewedAt = new Date();
    await tx.staffRequest.updateMany({
      where: { id: { in: satisfied.map((request) => request.id) } },
      data: {
        status: StaffRequestStatus.COMPLETED,
        reviewedById: adminId,
        reviewedAt,
      },
    });

    // Written on the same transaction so the trail cannot disagree with the state.
    await tx.auditLog.createMany({
      data: satisfied.map((request) => ({
        actorType: ActorType.ADMIN,
        actorId: adminId,
        action: "STAFF_REQUEST_AUTO_COMPLETED",
        targetType: "StaffRequest",
        targetId: request.id,
        metadata: {
          reason: "ACCESS_ALREADY_GRANTED",
          clientId: request.clientId,
          collectionId: request.collectionId,
        },
      })),
    });

    this.logger.log(
      `Auto-completed ${satisfied.length} access request(s) already satisfied by a grant`,
    );
    return satisfied.length;
  }
}
