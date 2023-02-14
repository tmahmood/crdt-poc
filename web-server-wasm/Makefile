build:
	rm pkg/* || echo "nothing here"
	echo building wasm ...
	RUST_BACKTRACE=1 wasm-pack build --target no-modules
	cp pkg/{web_server_wasm_bg.wasm,web_server_wasm.js} ../crr_poc/public/

run:
	cd pkg; ./sws --port 8787 --root ./ -w sws.toml

all: build run