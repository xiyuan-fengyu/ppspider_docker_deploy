# ppspider_docker_deploy
This project is used to show you how to deploy an application using docker.   

On the docker host, run the following:    
```bash
# build ppspider_env image
echo -e '
FROM docker.io/xiyuanfengyu/ppspider_env

ARG ROOT_PASSWORD=123456
#ARG NPM_REGISTRY=https://registry.npm.taobao.org
#ARG PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/

RUN echo "${ROOT_PASSWORD}" | passwd --stdin root \
    && if [ "${NPM_REGISTRY} " != " " ];then (npm config set registry=${NPM_REGISTRY}) fi \
    && if [ "${PUPPETEER_DOWNLOAD_HOST} " != " " ];then (echo -e "\\n\\nexport PUPPETEER_DOWNLOAD_HOST=${PUPPETEER_DOWNLOAD_HOST}\\n\\n" >> /etc/profile) fi
' > Dockerfile
docker build -t ppspider_env .  
# create ppspider_env container named my_ppspider_env, expose webUi port 9000, mongodb port 27017
docker run -itd -e "container=docker" --network=host -p 9000:9000 -p 27017:27017 --name my_ppspider_env ppspider_env /usr/sbin/init

# deploy project
ppspiderWorkplace=/root/ppspider
ppspiderProjectRep=https://github.com/xiyuan-fengyu/ppspider_docker_deploy
ppspiderStartCmd="node lib/App.js"
ppspiderProject=`basename $ppspiderProjectRep .git`

echo -e '
cd '$ppspiderWorkplace'
if [[ -d "'$ppspiderWorkplace'/'$ppspiderProject'" && -d "'$ppspiderWorkplace'/'$ppspiderProject'/.git" ]]; then
    # update
    cd '$ppspiderProject'
    git pull
else
    # clone
    rm -rf '$ppspiderProject'
    git clone --progress '$ppspiderProjectRep' '$ppspiderProject'
    cd '$ppspiderProject'
fi
# install npm dependencies
yarn install
# compile ts to js
tsc -w false
echo "nohup '$ppspiderStartCmd' 1>main.log 2>&1 &"
nohup '$ppspiderStartCmd' 1>main.log 2>&1 &
timeout 30 tail -f main.log
' > /tmp/$ppspiderProject.sh
docker exec my_ppspider_env mkdir -p $ppspiderWorkplace
docker cp /tmp/$ppspiderProject.sh my_ppspider_env:$ppspiderWorkplace/$ppspiderProject.sh
docker exec my_ppspider_env chmod +x $ppspiderWorkplace/$ppspiderProject.sh
docker exec my_ppspider_env sh $ppspiderWorkplace/$ppspiderProject.sh
# docker stop my_ppspider_env && docker rm my_ppspider_env
```
