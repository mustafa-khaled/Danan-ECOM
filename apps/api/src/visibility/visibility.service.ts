import { Injectable } from "@nestjs/common";
import {
  hasVisibilityAccess,
  normalizeVisibilityGroup,
} from "@dadan/utils";

@Injectable()
export class VisibilityService {
  normalizeGroups(groups: string[]): string[] {
    return groups.map(normalizeVisibilityGroup);
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
