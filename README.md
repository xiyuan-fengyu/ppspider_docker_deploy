# ppspider_docker_deploy
这个项目用于演示使用 docker 部署的过程  

在docker宿主机上，运行以下命令  
```bash
# 构建 my_ppspider_env 镜像
echo -e '
FROM xiyuanfengyu/ppspider_env

ARG ROOT_PASSWORD=123456
ARG NPM_REGISTRY=https://registry.npm.taobao.org

ENV PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/

RUN echo "${ROOT_PASSWORD}" | passwd --stdin root \
    && if [ "${NPM_REGISTRY} " != " " ];then (npm config set registry=${NPM_REGISTRY}) fi
' > Dockerfile
docker build -t ppspider_env .  
# 创建 my_ppspider_env 实例
docker run -itd -e "container=docker" --network=host --name my_ppspider_env ppspider_env /usr/sbin/init

# 部署项目
ppspiderWorkplace=/root/ppspider
ppspiderProjectRep=https://github.com/xiyuan-fengyu/ppspider_docker_deploy
ppspiderStartCmd="nohup node lib/App.js 1>main.log 2>&1 &"
ppspiderProject=${ppspiderProjectRep##*/}

echo -e '
cd '$ppspiderWorkplace'
git clone --progress '$ppspiderProjectRep' '$ppspiderProject'
cd '$ppspiderProject'
yarn install
tsc -w false
echo "'$ppspiderStartCmd'"
'$ppspiderStartCmd'
tail -f main.log &
' > /tmp/$ppspiderProject.sh
docker exec my_ppspider_env mkdir -p $ppspiderWorkplace
docker cp /tmp/$ppspiderProject.sh my_ppspider_env:$ppspiderWorkplace/$ppspiderProject.sh
docker exec my_ppspider_env chmod +x $ppspiderWorkplace/$ppspiderProject.sh
docker exec my_ppspider_env sh $ppspiderWorkplace/$ppspiderProject.sh

```
