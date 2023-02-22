UUID:=$(shell uuidgen)
ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
SRC_DIR_SWS=${ROOT_DIR}/static-web-server
TPL_DIR=${ROOT_DIR}/tpl
PEM_FILE=$(realpath ${ROOT_DIR}/../tmahmood.pem)

APP_NAME=crr_poc
BUILD_DIR_CRR_POC=${ROOT_DIR}/build/${APP_NAME}
BUILD_FILES=${ROOT_DIR}/build/${APP_NAME}/files
SRC_DIR_APP=${ROOT_DIR}/${APP_NAME}
SRC_DIR_SERVER=${ROOT_DIR}/server

SRC_DIR_WASM=${ROOT_DIR}/web-server-wasm
SRC_DIR_SW=${ROOT_DIR}/sw
SRC_DIR_SW_POC=${ROOT_DIR}/sw_poc
BUILD_WEB_APP=${ROOT_DIR}/build/sw-db-poc

build_crr_poc: clear_crr_poc mk_build_dir build_server build_static_web_server copy_tpl_crr_poc
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_FILES}/sws
	cd ${SRC_DIR_APP} && npm run build && cp -r dist ${BUILD_FILES}/public

mk_build_dir:
	mkdir -p ${BUILD_FILES}

build_static_web_server:
	@killall sws || echo "Not running"
	@if [ -d ${SRC_DIR_SWS} ]; then\
	  cd ${SRC_DIR_SWS} && git checkout master && git pull;\
	else\
	  git clone https://github.com/static-web-server/static-web-server/; \
	fi
	cd ${SRC_DIR_SWS} && cargo build --release

build_server: mk_build_dir
	cd ${SRC_DIR_SERVER} && cargo build --release
	cp ${SRC_DIR_SERVER}/target/release/server ${BUILD_FILES}

copy_tpl_crr_poc: mk_build_dir build_static_web_server
	cp -r ${TPL_DIR}/crr_poc/* ${BUILD_DIR_CRR_POC}
	cp ${TPL_DIR}/build.sh ${BUILD_DIR_CRR_POC}
	sed -i "s/__APP_NAME__/todo-in-browser/g" ${BUILD_DIR_CRR_POC}/build.sh
	sed -i "s/__PORTS__/-p 80 -p 9000/g" ${BUILD_DIR_CRR_POC}/build.sh
	mv ${BUILD_DIR_CRR_POC}/{sws.toml,entry_point.sh} ${BUILD_FILES}

clear_crr_poc:
	rm -rf ${BUILD_DIR_CRR_POC}

upload_crr_poc: build_crr_poc
	@echo "!! UPLOADING TO PRODUCTION SERVER !! WILL WAIT FOR 5 secs, Ctrl + C to cancel"
	@echo ${PEM_FILE}
	sleep 5
	rsync -e 'ssh -i ${PEM_FILE}' -arz ${BUILD_DIR_CRR_POC}/ ubuntu@godly.dev:todo-in-browser

run_crr_poc: copy_tpl_crr_poc
	@killall sws || echo "not running"
	cd ${BUILD_DIR_CRR_POC}/files; ./sws -w ../sws_dev.toml

# Building WASM
build_wasm: build_sw_poc
	cd ${SRC_DIR_WASM};
	cd ${SRC_DIR_WASM}; rm pkg/* || echo "nothing here"; RUST_BACKTRACE=1 wasm-pack build --target no-modules

build_sw_poc:
	cd ${SRC_DIR_SW_POC}; npm run build
	cd ${SRC_DIR_SW_POC}/dist/assets; cat *.js > ${SRC_DIR_WASM}/index.js
	cd ${SRC_DIR_SW_POC}/dist/assets; cat *.css > ${SRC_DIR_WASM}/index.css
	cd ${SRC_DIR_SW_POC}/dist/; find assets/* > ${SRC_DIR_WASM}/files.txt

build_sw: build_wasm
	cd ${SRC_DIR_SW}; tsc
	sed -i "s/export {};//g" ${SRC_DIR_SW}/dist/sw.js

build_wasm_web_app: build_static_web_server build_sw
	rm -rf ${BUILD_WEB_APP} || echo "Not found"
	mkdir ${BUILD_WEB_APP}
	cp -r ${SRC_DIR_SW_POC}/dist ${BUILD_WEB_APP}/public
	cp ${SRC_DIR_WASM}/pkg/{web_server_wasm_bg.wasm,web_server_wasm.js} ${BUILD_WEB_APP}/public/assets/
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_WEB_APP}/sws
	cp ${SRC_DIR_SW}/dist/sw.js ${BUILD_WEB_APP}/public

run_sw_service: copy_tpl_wasm
	@killall sws || echo "not running"
	cd ${BUILD_WEB_APP}; ./sws -w sws_dev.toml

copy_tpl_wasm: build_wasm_web_app
	cp -r ${TPL_DIR}/sw-db-poc/* ${BUILD_WEB_APP}
	cp ${TPL_DIR}/build.sh ${BUILD_WEB_APP}
	sed -i "s/__APP_NAME__/sw-db-poc/g" ${BUILD_WEB_APP}/build.sh
	sed -i "s/__PORTS__/-p 80/g" ${BUILD_WEB_APP}/build.sh
