const express = require('express');
const https = require('https');
const url = require('url');
const app = express();
const PORT = 2121;

// 转发请求的路由
app.get('/api/playurl', (req, res) => {
    const { bvid, cid } = req.query;

    // 检查 bvid 和 cid 是否存在
    if (!bvid || !cid) {
        return res.status(400).send('Missing bvid or cid');
    }

    // 构建 API 请求 URL
    const apiUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=6&platform=html5&high_quality=1`;

    // 发送请求到 Bilibili API
    https.get(apiUrl, (apiRes) => {
        let data = '';

        // 收集数据
        apiRes.on('data', chunk => {
            data += chunk;
        });

        // 请求结束时，转发数据
        apiRes.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.send(decodeUnicode(data));
            const now = new Date();

            // 格式化时间为 YYYY-MM-DD HH:mm:ss
            const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');

            // 输出到控制台
            console.log(`当前时间：${formattedDate}  `+`${bvid}`);
            //console.log(decodeUnicode(data));
        });

    }).on('error', (err) => {
        console.error(`Error fetching data from Bilibili API: ${err.message}`);
        res.status(500).send('Error fetching data from Bilibili API');
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});


function decodeUnicode(str) {
    return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });
}