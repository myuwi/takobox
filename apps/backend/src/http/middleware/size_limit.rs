use salvo::{Depot, Request, handler, http::body::Body};

use crate::http::{error::Error, state::AppState};

#[handler]
pub async fn limit_upload_size(req: &mut Request, depot: &mut Depot) -> Result<(), Error> {
    let AppState { settings, .. } = depot.get_typed::<AppState>().unwrap();

    let Some(upper) = req.body().size_hint().upper() else {
        return Err(Error::BadRequest("Request body size is unknown."));
    };

    if upper > settings.max_file_size as u64 {
        return Err(Error::PayloadTooLarge);
    }

    Ok(())
}
