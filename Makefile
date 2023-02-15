APP_NAME=crr_poc
ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
BUILD_DIR_APP=${ROOT_DIR}/build/${APP_NAME}
BUILD_FILES=${ROOT_DIR}/build/${APP_NAME}/files
SRC_DIR_APP=${ROOT_DIR}/${APP_NAME}
SRC_DIR_SERVER=${ROOT_DIR}/server
SRC_DIR_SWS=${ROOT_DIR}/static-web-server
TPL_DIR=${ROOT_DIR}/tpl
PEM_FILE=$(realpath ${ROOT_DIR}/../tmahmood.pem)

mk_build_dir:
	mkdir -p ${BUILD_FILES}

build_server: mk_build_dir
	cd ${SRC_DIR_SERVER} && cargo build --release
	cp ${SRC_DIR_SERVER}/target/release/server ${BUILD_FILES}

build_static_web_server: mk_build_dir
	@if [ -d ${SRC_DIR_SWS} ]; then\
	  cd ${SRC_DIR_SWS} && git checkout master && git pull;\
	else\
	  git clone https://github.com/static-web-server/static-web-server/; \
	fi
	cd ${SRC_DIR_SWS} && cargo build --release
	cp ${SRC_DIR_SWS}/target/release/static-web-server ${BUILD_FILES}/sws

copy_tpl: mk_build_dir
	cp -r ${TPL_DIR}/* ${BUILD_DIR_APP}
	mv ${BUILD_DIR_APP}/entry_point.sh ${BUILD_FILES}

build_crr_poc: mk_build_dir build_server build_static_web_server copy_tpl
	echo ${APP_NAME}
	echo ${ROOT_DIR}
	echo ${BUILD_DIR_APP}
	rm -rf ${BUILD_DIR_APP}/www
	cd ${SRC_DIR_APP} && npm run build && cp -r dist ${BUILD_FILES}/www

upload:
	@echo "!! UPLOADING TO PRODUCTION SERVER !!"
	@echo ${PEM_FILE}
	rsync -e 'ssh -i ${PEM_FILE}' -arz ${BUILD_DIR_APP}/ ubuntu@godly.dev:todo-in-browser
