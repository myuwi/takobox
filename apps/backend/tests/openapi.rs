use takobox::openapi;

#[test]
fn the_committed_spec_matches_the_routes() {
    let generated = openapi().to_pretty_json().unwrap();
    let committed = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/openapi.json"));

    assert_eq!(
        generated.trim(),
        committed.trim(),
        "openapi.json is out of date, run `bun run generate`"
    );
}
