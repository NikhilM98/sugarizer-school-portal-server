## Port service 
FROM node:alpine

# Note: Latest version of kubectl may be found at: # https://aur.archlinux.org/packages/kubectl-bin/ 
ARG KUBE_LATEST_VERSION="v1.18.3" 
# Note: Latest version of helm may be found at: # https://github.com/kubernetes/helm/releases 
ARG HELM_VERSION="v3.2.3" 

ENV HELM_HOME="/usr/local/bin/"
ENV HELM_BINARY="/usr/local/bin/helm"

RUN apk add --no-cache ca-certificates bash \
    && wget -q https://storage.googleapis.com/kubernetes-release/release/${KUBE_LATEST_VERSION}/bin/linux/amd64/kubectl -O /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && apk add curl \
    && apk add openssl \
    && curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 \
    && chmod 700 get_helm.sh \
    && ./get_helm.sh
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh make gcc g++ python3

# Create app directory
WORKDIR /usr/src

RUN git clone -b mongodbChart https://github.com/ricknjacky/sugarizer-chart
RUN git clone -b bitnamiTest https://github.com/ricknjacky/sugarizer-school-portal-server

WORKDIR /usr/src/sugarizer-school-portal-server

RUN npm install

RUN apk del make gcc g++ python3

EXPOSE 8080
CMD [ "npm", "start" ]
