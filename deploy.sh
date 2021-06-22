export PLAYCANVAS_TARGET_DIR=$(pwd)/dist
export PLAYCANVAS_BAD_FILE_REG="^\\.|~$|jsconfig.json" 
export PLAYCANVAS_BAD_FOLDER_REG="^\\.|typings" 

node playcanvas-sync/pcsync.js pushAll
