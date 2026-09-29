import { Module } from "@nestjs/common";
import { CollectionAccessSyncService } from "./collection-access-sync.service";

/**
 * Standalone so both `CollectionsModule` and `ClientsModule` can depend on the
 * sync without importing each other's controllers.
 */
@Module({
  providers: [CollectionAccessSyncService],
  exports: [CollectionAccessSyncService],
})
export class CollectionAccessSyncModule {}
