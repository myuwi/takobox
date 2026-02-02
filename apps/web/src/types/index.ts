import type { components } from "./api.gen.ts";

export type AuthPayload = components["schemas"]["takobox.routes.auth.AuthPayload"];
export type CollectionDto = components["schemas"]["takobox.models.collection.Collection"];
export type FileDto = components["schemas"]["takobox.models.file.File"];
export type FileWithCollectionsDto =
  components["schemas"]["takobox.models.file.FileWithCollections"];
export type SettingsDto = components["schemas"]["takobox.models.settings.Settings"];
export type UserDto = components["schemas"]["takobox.models.user.User"];
