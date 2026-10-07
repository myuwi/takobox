//! Responses with a status other than the default 200. Each type sets its status and documents it in
//! the OpenAPI schema, so handlers don't need `status_codes(...)` or `responses(...)` annotations.

use salvo::{
    http::header,
    oapi::{
        BasicType, Components, Content, EndpointOutRegister, Header, Object, Operation, ToSchema,
        response::Response as OpenApiResponse,
    },
    prelude::*,
};
use serde::Serialize;

use crate::http::error::Error;

/// A response body with OpenAPI content metadata.
/// Writing must preserve the success status unless an error occurs.
pub trait ResponseBody: Writer + Send {
    fn content(components: &mut Components) -> (&'static str, Content);
}

impl<T: Serialize + ToSchema + Send> ResponseBody for Json<T> {
    fn content(components: &mut Components) -> (&'static str, Content) {
        ("application/json", Content::new(T::to_schema(components)))
    }
}

/// 201 Created, with a `Location` header pointing to the new resource.
pub struct Created<B> {
    location: String,
    body: B,
}

impl<B> Created<B> {
    pub fn new(location: impl Into<String>, body: B) -> Self {
        Self {
            location: location.into(),
            body,
        }
    }
}

#[async_trait]
impl<B: ResponseBody> Writer for Created<B> {
    async fn write(self, req: &mut Request, depot: &mut Depot, res: &mut Response) {
        if let Err(err) = res.add_header(header::LOCATION, self.location, true) {
            Error::internal("failed to set the Location header", err)
                .write(req, depot, res)
                .await;
            return;
        }

        res.status_code(StatusCode::CREATED);
        self.body.write(req, depot, res).await;
    }
}

impl<B: ResponseBody> EndpointOutRegister for Created<B> {
    fn register(components: &mut Components, operation: &mut Operation) {
        let (content_type, content) = B::content(components);
        let location = Header::new(Object::with_type(BasicType::String))
            .description("The URL of the created resource.");

        operation.responses.insert(
            "201",
            OpenApiResponse::new("Created")
                .add_content(content_type, content)
                .add_header("Location", location),
        );
    }
}

/// 204 No Content.
pub struct NoContent;

impl Scribe for NoContent {
    fn render(self, res: &mut Response) {
        res.status_code(StatusCode::NO_CONTENT);
    }
}

impl EndpointOutRegister for NoContent {
    fn register(_components: &mut Components, operation: &mut Operation) {
        operation
            .responses
            .insert("204", OpenApiResponse::new("No Content"));
    }
}
