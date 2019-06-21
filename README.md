# ppspider_docker_deploy
这个项目用于演示使用 docker 部署的过程  

在docker宿主机上，运行以下命令  
```bash
echo -e '
FROM ppspider_env

ARG ROOT_PASSWORD=123456
ARG WORKPLACE=/root/ppspider
ARG PROJECT_REP=https://github.com/xiyuan-fengyu/ppspider_docker_deploy
ARG START_CMD="node lib/App.js"

ENV PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/
ENV NPM_REGISTRY=https://registry.npm.taobao.org

RUN echo "${ROOT_PASSWORD}" | passwd --stdin root \
    && if [ "${NPM_REGISTRY} " != " " ];then (npm config set registry=${NPM_REGISTRY}) fi \
    && mkdir -p ${WORKPLACE} \
    && cd ${WORKPLACE} \
    && git clone ${PROJECT_REP} \
    && cd ${PROJECT_REP##*/} \
    && yarn install \
    && tsc -w false \
    && eval ${START_CMD}
' > Dockerfile
docker build --network=host -t ppspider_docker_deploy .
docker run -it --net lan --ip 192.168.1.130 --name ppspider_docker_deploy_0 -h ppspider_docker_deploy_0 ppspider_docker_deploy
```
