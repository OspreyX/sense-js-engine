FROM senseplatform/nodejs:0.10.32-1

WORKDIR /sense
ADD cloud-dashboard-handler /sense/cloud-dashboard-handler
RUN npm install -g /sense/cloud-dashboard-handler
RUN rm -rf /sense

# Install Ubuntu security updates.
RUN grep security /etc/apt/sources.list > /tmp/security.list
RUN sudo apt-get upgrade -oDir::Etc::Sourcelist=/tmp/security.list -s