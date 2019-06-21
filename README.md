# ppspider_docker_deploy
这个项目用于演示使用 docker 部署的过程  

在docker宿主机上，运行以下命令  
```bash
echo -e '
FROM xiyuanfengyu/ppspider_env

ARG ROOT_PASSWORD=123456

ENV PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/
ENV NPM_REGISTRY=https://registry.npm.taobao.org
ENV PPSPIDER_WORKPLACE=/root/ppspider
ENV PPSPIDER_PROJECT_REP=https://github.com/xiyuan-fengyu/ppspider_docker_deploy
ENV PPSPIDER_START_CMD="node lib/App.js"

RUN echo "${ROOT_PASSWORD}" | passwd --stdin root \
    
CMD /usr/sbin/init \
    && if [ "${NPM_REGISTRY} " != " " ];then (npm config set registry=${NPM_REGISTRY}) fi \
    && mkdir -p ${PPSPIDER_WORKPLACE} \
    && cd ${PPSPIDER_WORKPLACE} \
    #&& git clone ${PPSPIDER_PROJECT_REP} \
    && cd ${PPSPIDER_PROJECT_REP##*/} \
    && yarn install \
    && tsc -w false \
    && eval ${PPSPIDER_START_CMD}
' > Dockerfile
docker build -t ppspider_docker_deploy .  
docker run -it -e "container=docker" --network=host --name ppspider_docker_deploy_0 ppspider_docker_deploy   
docker stop ppspider_docker_deploy_0 && docker rm ppspider_docker_deploy_0
```
