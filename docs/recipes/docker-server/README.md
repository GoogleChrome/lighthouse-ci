# Docker-based LHCI Server

## Overview

The LHCI server can be run in any node environment with persistent disk storage or network access to a postgres database. Docker can help encapsulate the server setup details for an instant custom server.

## Building Locally

_NOTE: commands below were tested with Docker 18.09.2_

```bash
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

## Deployment

### Google Cloud Kubernetes

You can deploy your own server instance to Google Cloud Platform without ever installing Docker or ssh'ing into any machines.

```bash
# Configure the gcloud utility
PROJECT_ID="<your GCP project id here>"
COMPUTE_ZONE="<your zone here, e.g. us-central1-a>"
gcloud config set project $PROJECT_ID
gcloud config set compute/zone $COMPUTE_ZONE

# Create our Kubernetes cluster for LHCI
gcloud container clusters create lhci-cluster --num-nodes=1

# Deploy the LHCI server pod
kubectl apply -f ./kubernetes/lhci-data-claim.yml
kubectl apply -f ./kubernetes/lhci-pod.yml

# Make sure our pod was created successfully
kubectl get pods

# Expose LHCI to the internet
kubectl expose pod lhci-pod --type=LoadBalancer --port 80 --target-port 9001 --name=lhci-server

# Check the IP of your LHCI server installation!
kubectl get service

# lhci-server's EXTERNAL-IP is your `LHCI_SERVER_BASE_URL`
# NAME          TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)        AGE
# kubernetes    ClusterIP      10.X.X.X       <none>         443/TCP        9m
# lhci-server   LoadBalancer   10.X.X.X       X.X.X.X        80:XXXXX/TCP   2m
```

Note that the server has no authentication mechanisms and that anyone with HTTP access to the server will be able to view and create data. If your server contains sensitive information, consider protecting it within a firewall that is only accessible to your internal network.
