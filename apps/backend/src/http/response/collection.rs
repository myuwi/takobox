use salvo::oapi::ToSchema;
use serde::Serialize;

use crate::{http::serialize::serialize_timestamp, models::collection::Collection, types::NanoId};

#[derive(Clone, Debug, Serialize, ToSchema)]
#[salvo(schema(name = Collection))]
#[serde(rename_all = "camelCase")]
pub struct CollectionResponse {
    pub id: NanoId,
    pub name: String,
    #[salvo(schema(value_type = String))]
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl From<Collection> for CollectionResponse {
    fn from(collection: Collection) -> Self {
        Self {
            id: collection.public_id,
            name: collection.name,
            created_at: collection.created_at,
        }
    }
}
