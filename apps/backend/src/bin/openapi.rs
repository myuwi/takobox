use takobox::openapi;

fn main() {
    let spec = openapi()
        .to_pretty_json()
        .expect("Failed to serialize OpenAPI spec");
    println!("{spec}");
}
