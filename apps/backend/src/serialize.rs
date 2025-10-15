use time::{OffsetDateTime, format_description::well_known::Rfc3339};

pub fn serialize_timestamp<S>(
    timestamp: &i64,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    let datetime_string = OffsetDateTime::from_unix_timestamp(*timestamp)
        .map_err(serde::ser::Error::custom)
        .and_then(|dt| dt.format(&Rfc3339).map_err(serde::ser::Error::custom))?;
    serializer.serialize_str(&datetime_string)
}
