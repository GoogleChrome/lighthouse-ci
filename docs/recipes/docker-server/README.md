# Docker-based LHCI Server

**NOTE: be sure to read the [Security section](../../server.md#Security) of the server documentation to protect your server properly**

## Overview

The LHCI server can be run in any node environment with persistent disk storage or network access to a postgres/mysql database. Docker can help encapsulate the server setup details for an instant custom server.

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

**WARNING:** GCP pricing changes for Kubernetes cluster management went into effect starting June 6, 2020 that clusters beyond your first now cost \$72/month. We would only recommend following the script below if you're required to use GCP. If you're just trying to setup the server quickly for free, follow our other guides for [more economical options](../heroku-server/README.md).

- List of [GCP Zones](https://cloud.google.com/compute/docs/regions-zones#available)
- Google Cloud [SDK Installation Instructions](https://cloud.google.com/sdk/install) (though if you have to use these, this guide probably isn't for you)

**Run the below commands locally to setup your GCP server.**

```bash
# Configure the gcloud utility
PROJECT_ID="<your GCP project id here>"
COMPUTE_ZONE="<your zone here, e.g. us-central1-a>"
gcloud config set project "$PROJECT_ID"
gcloud config set compute/zone "$COMPUTE_ZONE"

# Create our Kubernetes cluster for LHCI
gcloud container clusters create lhci-cluster --num-nodes=1

# Deploy the LHCI server
curl -O https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/recipes/docker-server/kubernetes/lhci-data-claim.yml
curl -O https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/recipes/docker-server/kubernetes/lhci-deployment.yml
curl -O https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/recipes/docker-server/kubernetes/lhci-service.yml
kubectl apply -f ./lhci-data-claim.yml
kubectl apply -f ./lhci-deployment.yml
kubectl apply -f ./lhci-service.yml

# Make sure our deployment was created successfully
kubectl get deployment

# Check the IP of your LHCI server installation!
kubectl get service

# lhci-server's EXTERNAL-IP is your `LHCI_SERVER_BASE_URL`
# NAME          TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)        AGE
# kubernetes    ClusterIP      10.X.X.X       <none>         443/TCP        9m
# lhci-server   LoadBalancer   10.X.X.X       X.X.X.X        80:XXXXX/TCP   2m
```

Once you've got the server up and running you can continue with the [Getting Started](../../getting-started.md#The-Lighthouse-CI-Server) steps using the EXTERNAL-IP as your LHCI server base URL.

#### Troubleshooting

The above commands assume that you're working a clean project that hasn't been manually configured for other services. If you've used this project for other GCP services, you might need to tweak the commands used. Some examples with workarounds are reproduced below.

**default network problem**
GCP projects come with a `default` network when created. You might have manually deleted this. You can either recreate the default network before running the script or manually create a cluster named `lhci-server` via the UI, edit the default-pool to have 1 node instead of 3, and set the smallest acceptable machines.

**connected to machine problem**
If you weren't able to create the server via the CLI or have other permissions set, you won't be connected to `lhci-server` when you run the rest of the commands.

Run the below to continue:
`gcloud container clusters get-credentials lhci-server --zone $COMPUTE_ZONE --project $PROJECT_ID`

### Docker Compose

You can create a docker-compose.yml file to orchestrate an LHCI server in cloud services or along with your existing app docker containers. Execute `docker-compose up` relative to the file's location.

```bash
version: '3'
services:
  lhserver:
    image: patrickhulce/lhci-server
    ports:
      - '9001:9001'
    volumes:
      - lhci-data:/data
volumes:
  lhci-data:
```
