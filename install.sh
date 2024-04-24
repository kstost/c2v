# C2V 소개
# 코드 기반으로 틱톡, 유튜브등을 위한 영상을 보다 편리하게 만들 수 있도록 도와줍니다.

# C2V 사용방법
# C2V는 리눅스(Ubuntu) 컴퓨터를 기반으로 작동합니다.
# 따라서 리눅스(Ubuntu) 컴퓨터를 준비해야합니다.
# 본 코드는 ubuntu-22.04.3-live-server-arm64.iso 를 기준으로 개발되었습니다.
#
# 컴퓨터의 준비방법에는 크게 두가지가 있다
# 1. 사용하는 개인용 컴퓨터에 가상의 리눅스를 설치
# 2. 아마존웹서비스의 가상컴퓨터 사용

# 저장소 변경
sudo sed -i 's/security.ubuntu.com/ftp.kaist.ac.kr/g' /etc/apt/sources.list
sudo sed -i 's/ports.ubuntu.com/ftp.kaist.ac.kr/g' /etc/apt/sources.list

# 시스템 업데이트
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq

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
case "$SHELL" in
  */zsh)
    echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium)" >> ~/.zshrc && source ~/.zshrc
    ;;
  */bash)
    echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium)" >> $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi) && source $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi)
    ;;
  *)
    echo "not support"
    ;;
esac
case "$SHELL" in
  */zsh)
    echo "pulseaudio --start" >> ~/.zshrc && source ~/.zshrc
    ;;
  */bash)
    echo "pulseaudio --start" >> $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi) && source $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi)
    ;;
  *)
    echo "not support"
    ;;
esac

# OpenAI의 API키를 입력해주세요
case "$SHELL" in
  */zsh)
    echo 'export OPENAI_API_KEY="sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' >> ~/.zshrc && source ~/.zshrc
    ;;
  */bash)
    echo 'export OPENAI_API_KEY="sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' >> $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi) && source $(if [ -f ~/.bash_profile ]; then echo ~/.bash_profile; else echo ~/.bashrc; fi)
    ;;
  *)
    echo "not support"
    ;;
esac

cd ~ && git clone https://github.com/kstost/c2v
mv c2v canaanProject
cd canaanProject/c2v/ && npm i
echo "C2V is installed at `pwd`"

cp -R contents/.template contents/firstproject
node seed_to_scenario.js -t firstproject -m ko -p "Pop Art style of"
