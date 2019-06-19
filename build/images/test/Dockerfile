FROM node:12.3.1

EXPOSE 4200
WORKDIR /myapp

CMD ["ember", "server"]

RUN apt-get update &&\
    apt-get install python-dev -y

# install chrome for default testem config (as of ember-cli 2.15.0)
RUN \
    apt-get update &&\
    apt-get install -y \
        apt-transport-https \
        gnupg \
        --no-install-recommends &&\
    curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - &&\
    echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list &&\
    apt-get update &&\
    apt-get install -y \
        google-chrome-stable \
        --no-install-recommends

# run with --no-sandbox option
RUN \
    sed -i 's/"$@"/--no-sandbox "$@"/g' /opt/google/chrome/google-chrome

RUN npm install -g ember-cli