# shorts_maker 소개
# HTML, CSS, Javascript로 틱톡 유튜브등의 숏츠를 만드는 방법이다

# shorts_maker 사용방법
# shorts_maker는 리눅스(Ubuntu) 컴퓨터를 기반으로 작동한다
# 따라서 리눅스(Ubuntu) 컴퓨터를 준비해야한다
# 컴퓨터의 준비방법에는 크게 두가지가 있다
# 1. 사용하는 개인용 컴퓨터에 가상의 리눅스를 설치
# 2. 아마존웹서비스의 가상컴퓨터 사용

# 저장소 변경
sudo sed -i 's/security.ubuntu.com/ftp.kaist.ac.kr/g' /etc/apt/sources.list
sudo sed -i 's/ports.ubuntu.com/ftp.kaist.ac.kr/g' /etc/apt/sources.list

# 시스템 업데이트
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq

# 시스템 재시작
# sudo reboot

# 램 확장 (램이 부족하다면 선택적으로 수행)
sudo swapoff -a
sudo dd if=/dev/zero of=/swapfile bs=256M count=16
sudo chmod 0600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# nodejs 설치
sudo sed -i 's/#$nrconf{restart} = '"'"'i'"'"';/$nrconf{restart} = '"'"'a'"'"';/g' /etc/needrestart/needrestart.conf
sudo echo "\$nrconf{restart} = 'a'" >> /etc/needrestart/needrestart.conf
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -  && sudo DEBIAN_FRONTEND=noninteractive apt-get install nodejs -yq

# 웹브라우저, 화면 및 소리 도구 설치
sudo DEBIAN_FRONTEND=noninteractive apt install chromium-browser ffmpeg xvfb pulseaudio alsa-utils -yq

# 환경설정 (주로 AWS) - echo $SHELL; 명령어 수행결과 bash라고 표시될때 수행
echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium)" >> ~/.bashrc && source ~/.bashrc
echo "pulseaudio --start" >> ~/.bashrc && source ~/.bashrc

# 환경설정 - echo $SHELL; 명령어 수행결과 zsh라고 표시될때 수행
# echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium)" >> ~/.zshrc && source ~/.zshrc

# 프로젝트 생성
# shorts_maker_dist.tar 파일 서버상에 위치시킨 후 npm i 실행.

# 영상편집
# example/ 폴더 내에 있는 html 파일을 수정하면 됨.

# 실행
# cd ~/canaanProject/shorts_maker && node index.js example/index.html output.mp4

cd ~ && git clone https://github.com/kstost/c2v
cd c2v/c2v/ && npm i
echo "C2V is installed at `pwd`"
