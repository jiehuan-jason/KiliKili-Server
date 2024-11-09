const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3232;
const FILE_PATH = path.join(__dirname, 'rcmd_content.txt'); // 存储网页内容的文件
const URL = 'https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd'; // 要获取内容的网页 URL

// 获取网页内容并保存到文件的函数
const fetchAndSaveContent = async () => {
    try {
        const response = await axios.get(URL);
        let dataToWrite;

        // 检查响应数据类型
        if (typeof response.data === 'object') {
            // 如果是对象，转换为 JSON 字符串
            dataToWrite = JSON.stringify(response.data, null, 2);
        } else {
            // 如果是字符串，直接使用
            dataToWrite = response.data;
        }

        // 写入文件
        fs.writeFileSync(FILE_PATH, dataToWrite, 'utf8');
        console.log(`Content fetched and saved at ${new Date()}`);
    } catch (error) {
        console.error('Error fetching content:', error);
    }
};

// 在应用启动时立即获取一次内容
fetchAndSaveContent();

// 定时任务：每天在指定时间获取网页内容
cron.schedule('0 7,12,15,18,20,0 * * *', fetchAndSaveContent);

// HTTP GET 请求处理
app.get('/', (req, res) => {
        try {
        // 解析 JSON 数据
        const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

        // 检查 data 和 data.item 是否存在
        if (data && data.data && Array.isArray(data.data.item)) {
            const result = data.data.item.map(item => {
                return {
                    bvid: item.bvid,
                    title: item.title
                };
            });
            res.json({
                code: 0,
                data: result
            });
        } else {
            res.status(400).json({ code: -400, error: "数据格式不正确，无法提取 bvid 和 title" });
        }
    } catch (error) {
        console.error("解析 JSON 时出错:", error);
        res.status(500).json({ code: -400, error: "服务器内部错误" });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});