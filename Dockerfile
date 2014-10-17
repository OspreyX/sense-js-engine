FROM senseplatform/engine-low

WORKDIR /sense
ADD . /sense

# JS
RUN npm install -g sense-js-module
RUN npm install -g sense-js-engine

# Nuke build artifacts
RUN rm -rf /sense