FROM senseplatform/engine-low:a7032b18c5f491f6e7c4619d727ef1bd37205bf8

WORKDIR /sense
ADD . /sense

RUN ln -s /usr/lib/node_modules /node_modules

# JS
RUN npm install -g sense-js-module
RUN npm install -g sense-js-engine

# Nuke build artifacts
RUN rm -rf /sense

CMD startup