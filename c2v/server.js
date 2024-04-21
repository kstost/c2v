const express = require('express');
const path = require('path');

const app = express();
const port = 3000; // 원하는 포트 번호로 변경 가능

// 정적 파일 경로 설정
app.use(express.static(path.join(__dirname, 'contents')));

// 루트 경로에서 index.html 파일 서빙
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'contents', 'index.html'));
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});