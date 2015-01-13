FROM senseplatform/engine-low:6936063a8424b7f14662e12b4b195393671efae4

WORKDIR /sense
ADD . /sense/sense-js-engine

RUN ln -s /usr/lib/node_modules /node_modules
ENV SENSE_ENGINE_MODULE=sense-js-engine

# JS
RUN cd /;npm install /sense/sense-js-engine/sense-js-module
RUN npm install -g sense-js-engine

# Nuke build artifacts
RUN rm -rf /sense

CMD startup

# Install Ubuntu security updates.
RUN grep security /etc/apt/sources.list > /tmp/security.list
RUN sudo apt-get upgrade -oDir::Etc::Sourcelist=/tmp/security.list -s