mkdir -p $PWD/develop/mongodb
podman run -d \
  --name gem-next-mongodb \
  --volume $PWD/develop/mongodb:/data/db:rw \
  -p 127.0.0.1:27017:27017 \
  w5ccbqcv.mirror.aliyuncs.com/library/mongo:4.4.6
