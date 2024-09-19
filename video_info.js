// JavaScript source code
// 引入所需模块
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// 定义要获取的 API URL
const API_URL = 'https://api.bilibili.com/x/web-interface/view'; // 替换为实际的 API URL

// 创建一个路由来处理请求
app.get('/view', async (req, res) => {
    // 从查询参数中获取参数
    const { bvid } = req.query; // 假设你要传递的参数名为 'param'

    if (!bvid) {
        return res.status(400).send('Missing parameter: bvid');
    }

    try {
        // 使用参数构建 API 请求
        const response = await axios.get(`${API_URL}?bvid=${bvid}`);
        // 转发数据到客户端
            const now = new Date();

            // 格式化时间为 YYYY-MM-DD HH:mm:ss
            const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');

            // 输出到控制台
            console.log(`当前时间：${formattedDate}  `+`${bvid}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
