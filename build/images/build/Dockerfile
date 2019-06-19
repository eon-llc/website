FROM node:12.3.1

EXPOSE 4200
WORKDIR /myapp

CMD ["ember", "server"]

RUN apt-get update -y

RUN apt-get install python-dev python-pip -y

RUN pip install awscli

RUN npm install -g ember-cli