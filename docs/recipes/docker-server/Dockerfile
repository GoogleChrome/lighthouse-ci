FROM node:14-bullseye-slim

# Install utilities
RUN apt-get update --fix-missing && apt-get install -y python build-essential && apt-get clean

WORKDIR /usr/src/lhci
COPY package.json .
COPY lighthouserc.json .
RUN npm install

EXPOSE 9001
CMD [ "npm", "start" ]
