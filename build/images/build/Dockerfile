FROM node:12.3.1

EXPOSE 4200
WORKDIR /myapp

# run ember server on container start
CMD ["ember", "server"]

# update os
RUN \
  apt-get update -y

# install ember-cli
RUN \
  npm install -g ember-cli