APP_NAME=crr_poc
ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
BUILD_DIR_APP=${ROOT_DIR}/build/${APP_NAME}
BUILD_FILES=${ROOT_DIR}/build/${APP_NAME}/files
SRC_DIR_APP=${ROOT_DIR}/${APP_NAME}
SRC_DIR_SERVER=${ROOT_DIR}/server
SRC_DIR_SWS=${ROOT_DIR}/static-web-server
SRC_DIR_WASM=${ROOT_DIR}/web-server-wasm
TPL_DIR=${ROOT_DIR}/tpl
PEM_FILE=$(realpath ${ROOT_DIR}/../tmahmood.pem)
BUILD_WEB_APP=${ROOT_DIR}/build/app

mk_build_dir:
	mkdir -p ${BUILD_FILES}
	mkdir -p ${BUILD_WEB_APP}

build_server: mk_build_dir
	cd ${SRC_DIR_SERVER} && cargo build --release
	cp ${SRC_DIR_SERVER}/target/release/server ${BUILD_FILES}

build_static_web_server:
	@killall sws || echo "Not running"
	@if [ -d ${SRC_DIR_SWS} ]; then\
	  cd ${SRC_DIR_SWS} && git checkout master && git pull;\
	else\
	  git clone https://github.com/static-web-server/static-web-server/; \
	fi
	cd ${SRC_DIR_SWS} && cargo build --release

copy_tpl: mk_build_dir build_static_web_server
	cp -r ${TPL_DIR}/* ${BUILD_DIR_APP}
	mv ${BUILD_DIR_APP}/entry_point.sh ${BUILD_FILES}

build_crr_poc: mk_build_dir build_server build_static_web_server copy_tpl
	rm -rf ${BUILD_DIR_APP}/www
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_FILES}/sws
	cd ${SRC_DIR_APP} && npm run build && cp -r dist ${BUILD_FILES}/www

upload_crr_poc: build_crr_poc
	@echo "!! UPLOADING TO PRODUCTION SERVER !! WILL WAIT FOR 5 secs, Ctrl + C to cancel"
	@echo ${PEM_FILE}
	sleep 5
	rsync -e 'ssh -i ${PEM_FILE}' -arz ${BUILD_DIR_APP}/ ubuntu@godly.dev:todo-in-browser

# Building WASM
build_wasm:
	cd ${SRC_DIR_WASM}; \
	@rm pkg/* || echo "nothing here"; \
	RUST_BACKTRACE=1 wasm-pack build --target no-modules --release

build_wasm_web_app: build_static_web_server build_sw_poc
	rm -rf ${BUILD_WEB_APP} || echo "Not found"
	mkdir ${BUILD_WEB_APP}
	cp -r sw_poc/dist ${BUILD_WEB_APP}/public
	cp -r sw/dist/sw.js ${BUILD_WEB_APP}/public
	cp ${SRC_DIR_WASM}/pkg/{web_server_wasm.js,web_server_wasm_bg.wasm} ${BUILD_WEB_APP}/public/assets/
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_WEB_APP}/sws
	cp ${SRC_DIR_WASM}/sws.toml ${BUILD_WEB_APP}/

build_sw: build_wasm
	cd sw; tsc
	cd sw/dist; csplit --quiet --prefix=outfile sw.js "/\/\/___WASM_REPLACEMENT___/+1" "{*}"; cat outfile00 ${SRC_DIR_WASM}/pkg/web_server_wasm.js outfile01 > sw.js
	sed -i "s/export {};//g" sw/dist/sw.js

	cp sw/dist/sw.js sw_poc/

build_sw_poc: build_sw
	cd sw_poc; npm run build


run_sw_service:
	@killall sws || echo "not running"
	cd ${BUILD_WEB_APP}; ./sws -w sws.toml

