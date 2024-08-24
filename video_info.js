// JavaScript source code
// ��������ģ��
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// ����Ҫ��ȡ�� API URL
const API_URL = 'https://api.bilibili.com/x/web-interface/view'; // �滻Ϊʵ�ʵ� API URL

// ����һ��·������������
app.get('/view', async (req, res) => {
    // �Ӳ�ѯ�����л�ȡ����
    const { bvid } = req.query; // ������Ҫ���ݵĲ�����Ϊ 'param'

    if (!bvid) {
        return res.status(400).send('Missing parameter: bvid');
    }

    try {
        // ʹ�ò������� API ����
        const response = await axios.get(`${API_URL}?bvid=${bvid}`);
        // ת�����ݵ��ͻ���
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// ����������
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
