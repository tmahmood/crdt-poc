build:
	rm pkg/* || echo "nothing here"
	echo building wasm ...
	RUST_BACKTRACE=1 wasm-pack build --target no-modules
