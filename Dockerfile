FROM senseplatform/engine-low:ef49b08caa17ed8494634b3a8740cd0e7d77d3cf

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