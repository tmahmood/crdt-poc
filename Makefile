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

build_crr_poc: clear_crr_poc mk_build_dir build_server build_static_web_server copy_tpl_crr_poc
	cd ${SRC_DIR_APP} && npm run build && cp -r dist ${BUILD_FILES}/public

mk_build_dir:
	mkdir -p ${BUILD_FILES}

build_static_web_server:
	@killall sws_crr_poc || echo "Not running"
	@if [ -d ${SRC_DIR_SWS} ]; then\
	  cd ${SRC_DIR_SWS} && git checkout master && git pull;\
	else\
	  git clone https://github.com/static-web-server/static-web-server/; \
	fi
	cd ${SRC_DIR_SWS} && cargo build --release
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_FILES}/sws_crr_poc

build_server:
	cd ${SRC_DIR_SERVER} && cargo build --release
	cp ${SRC_DIR_SERVER}/target/release/server ${BUILD_FILES}

copy_tpl_crr_poc: mk_build_dir
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

run_crr_poc: build_crr_poc
	@killall sws_crr_poc || echo "not running"
	cd ${BUILD_FILES}; ./sws_crr_poc -w ../sws_dev.toml
