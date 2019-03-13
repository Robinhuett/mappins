#build
FROM node:11-alpine AS build
WORKDIR /usr/src/app

RUN yarn global add parcel-bundler --no-cache
RUN wget https://github.com/Robinhuett/mappins/archive/master.tar.gz && \
    tar -xvf master.tar.gz && \
    rm master.tar.gz && \
    mv mappins-master/* .

RUN yarn build

#prod
FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]