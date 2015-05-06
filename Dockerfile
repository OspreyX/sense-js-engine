FROM senseplatform/engine-low:56aa871f4f6eaee01ded496b10526aaaac5c4f3e

WORKDIR /sense
ADD . /sense/sense-js-engine

ENV SENSE_ENGINE_MODULE=sense-js-engine

# JS
RUN cd /; npm install /sense/sense-js-engine/sense-js-module
RUN npm install -g sense-js-engine

# Nuke build artifacts
RUN rm -rf /sense

CMD startup

# Install Ubuntu security updates.
RUN grep security /etc/apt/sources.list > /tmp/security.list
RUN sudo apt-get upgrade -oDir::Etc::Sourcelist=/tmp/security.list -s