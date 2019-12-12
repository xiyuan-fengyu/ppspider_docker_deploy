# ppspider_docker_deploy
This project is used to show you how to deploy an application using docker.   

On the docker host, run the following to build ppspider runtime environment.  
```shell script
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
```

connect to my_ppspider_env by ssh and deploy project.  
```shell script
ppspiderProjectRep=https://github.com/xiyuan-fengyu/ppspider_docker_deploy
ppspiderStartCmd="node lib/App.js"
ppspiderProject=`basename $ppspiderProjectRep .git`

if id -u ppspider >/dev/null 2>&1; then
    echo "user(ppspider) existed"
else
    # chromium cannot work with root user
    useradd ppspider
fi
if [ `whoami` != "ppspider" ];then
    su ppspider
fi
ppspiderWorkplace=/home/ppspider

cd $ppspiderWorkplace
if [[ -d "$ppspiderWorkplace/$ppspiderProject" ]]; then
    # update
    echo "Error: $ppspiderWorkplace/$ppspiderProject existed"
    exit -1
fi

# clone
git clone --progress $ppspiderProjectRep $ppspiderProject
cd $ppspiderProject

# create update.sh
echo -e '
if [ `whoami` != "ppspider" ];then
    su ppspider
fi
cd $(cd `dirname $0`; pwd)

# update
git pull

# install npm dependencies
yarn install

# compile ts to js
tsc -w false
' > update.sh
chmod +x update.sh

# create stop.sh
echo -e '
cd $(cd `dirname $0`; pwd)
if [[ -f "pid" ]]; then
    mainPid=$(cat pid)
    if [[ "$mainPid " != " " ]]; then
        relatedPids=$(ps -ef | grep "$mainPid" | awk '"'"'{print $2,$3}'"'"' | grep "$mainPid" | awk '"'"'{print $1}'"'"')
    fi
    if [[ "$relatedPids " != " " ]]; then
        echo "kill existed process $mainPid"
        kill -9 $mainPid

        echo -e "wait\\c"
        sleep 0.25

        allStop=0
        while [[ $allStop == 0 ]]; do
            allStop=1
            for pid in $relatedPids; do
                if ps -p $pid > /dev/null; then
                    echo -e ".\\c"
                    kill -9 $pid
                    allStop=0
                    break
                fi
            done
            sleep 0.5
        done
        rm -rf pid
        echo -e "\\nstopped"
    fi
fi
' > stop.sh
chmod +x stop.sh

# create start.sh
echo -e '
if [ `whoami` != "ppspider" ];then
    su ppspider
fi
cd $(cd `dirname $0`; pwd)
./stop.sh
# log backup
if [[ -f "main.log" ]];then
    if [[ ! -d "log_bak" ]];then
        mkdir log_bak
    fi
    mv main.log log_bak/main.log.`date "+%Y%m%d_%H%M%S"`  
fi
echo "nohup '$ppspiderStartCmd' 1>>main.log 2>&1 & echo $! > pid"
nohup '$ppspiderStartCmd' 1>>main.log 2>&1 & echo $! > pid
timeout 10 tail -f main.log
' > start.sh
chmod +x start.sh

./update.sh
./start.sh
```
