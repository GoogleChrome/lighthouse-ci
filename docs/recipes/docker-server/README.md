# Docker-based LHCI Server

## Overview

## Building Locally

_NOTE: commands below were tested with Docker 18.09.2_

```bash
# Tested with Docker
docker image build -t lhci .
docker volume create lhci-data
docker container run --publish 9001:9001 --mount='source=lhci-data,target=/data' --detach lhci
open http://localhost:9001/app/
```

This docker image is already published to dockerhub as `patrickhulce/lhci-server` and can be used directly.

```bash
docker volume create lhci-data
docker container run --publish 9001:9001 --mount='source=lhci-data,target=/data' --detach patrickhulce/lhci-server
```

If you make modifications and need to push to your own dockerhub image...

```bash
docker image build -t lhci .
docker tag lhci:latest <your username>/lhci-server:latest
docker push <your username>/lhci-server:latest
```
