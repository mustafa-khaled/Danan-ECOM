import { Injectable } from "@nestjs/common";
import {
  ADMIN_ONLY_VISIBILITY_GROUP,
  hasVisibilityAccess,
  normalizeVisibilityGroup,
} from "@dadan/utils";

/** The `visibilityGroups` shape shared by Collection, Design and Client. */
export interface VisibilityWhere {
  NOT: { visibilityGroups: { has: string } };
  OR: [
    { visibilityGroups: { isEmpty: true } },
    { visibilityGroups: { hasSome: string[] } },
  ];
}

@Injectable()
export class VisibilityService {
  normalizeGroups(groups: string[]): string[] {
    return groups.map(normalizeVisibilityGroup);
  }

  /**
   * The `canAccess` rule expressed as a Prisma `where` fragment, so catalog
   * queries can be filtered and paginated in the database instead of loading
   * every row and filtering in memory.
   *
   * Group names are normalised on every write path, so this matches
   * `canAccess` exactly. Where they could ever disagree it is stricter, which
   * fails closed.
   */
  prismaFilter(clientGroups: string[]): VisibilityWhere {
    return {
      NOT: { visibilityGroups: { has: ADMIN_ONLY_VISIBILITY_GROUP } },
      OR: [
        { visibilityGroups: { isEmpty: true } },
        { visibilityGroups: { hasSome: this.normalizeGroups(clientGroups) } },
      ],
    };
  }

  canAccess(clientGroups: string[], itemGroups: string[]): boolean {
    return hasVisibilityAccess(clientGroups, itemGroups);
  }

  filterByVisibility<T extends { visibilityGroups: string[] }>(
    items: T[],
    clientGroups: string[],
  ): T[] {
    return items.filter((item) => this.canAccess(clientGroups, item.visibilityGroups));
  }
}
