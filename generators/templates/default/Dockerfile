FROM node:latest as base

# copy main directory and packages
RUN mkdir -p /app/applications
RUN mkdir -p /app/client_data/default

# create client data
WORKDIR /app

# copy sources
COPY client_data/default ./client_data/default/

# copy all packages for now (later we'll do fine grained deployment of packages)
COPY applications ./applications/

# install node modules dependencies
COPY ["index.js","package.json","package-lock.json","./"]
RUN npm install

# env dev
ENV PORT=3000
ENV SECRET_SUFFIX_FIRESTORE=prod
ENV GED_HOOKS_ACTIVE=true
EXPOSE 3000
CMD ["npm","run","start"]