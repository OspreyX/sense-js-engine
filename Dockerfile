FROM senseplatform/engine-low:ae1193053019dfb67106d910870bc78dd923859e

WORKDIR /sense
ADD . /sense

RUN ln -s /usr/lib/node_modules /node_modules

# JS
RUN npm install -g sense-js-module
RUN npm install -g sense-js-engine

# Nuke build artifacts
RUN rm -rf /sense

CMD startup