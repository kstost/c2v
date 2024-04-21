function playAudio(urlScheme) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(urlScheme); // 오디오 엘리먼트 생성
        audio.onended = resolve;            // 재생 종료 시 resolve 호출
        audio.onerror = reject;             // 오류 발생 시 reject 호출
        audio.play().catch(reject);         // 오디오 재생 시도, 재생 실패 시 reject
    });
}
function recordingStart() {
    window.readyd = true;
}
function recordingEnd() {
    window.doned = true;
}
window.addEventListener('load', function () {
    setTimeout(() => {
        recordingStart()
        main()
    }, !location.hash ? 0 : 5000);
});
