FROM node:18-bullseye-slim

ENV ROOT_PASSWORD=""

RUN apt-get update --fix-missing 
RUN apt-get install -y python build-essential
RUN apt-get install -y openssh-server
RUN apt-get clean
RUN mkdir /var/run/sshd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

WORKDIR /usr/src/lhci
COPY package.json .
COPY lighthouserc.json .
RUN npm install

EXPOSE 9001
EXPOSE 22

CMD ["bash", "-c", "echo \"root:$ROOT_PASSWORD\" | chpasswd; service ssh start && npm start"]
