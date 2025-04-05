// JavaScript source code
// 引入所需模块
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 3000;

// 定义要获取的 API URL
const API_INFO_URL = 'https://api.bilibili.com/x/web-interface/view'; // 替换为实际的 API URL
const API_SEARCH_URL = 'https://api.bilibili.com/x/web-interface/search/type';
const API_USER_URL = 'https://api.bilibili.com/x/web-interface/card';
const API_USER_VIDEO_URL = 'https://app.bilibili.com/x/v2/space/archive/cursor'
const API_VIDEOS_LIST_URL = 'https://api.bilibili.com/x/player/pagelist';

const COOKIES = [
    ];

const publicKey = await crypto.subtle.importKey(
  "jwk",
  {
    kty: "RSA",
    n: "y4HdjgJHBlbaBN04VERG4qNBIFHP6a3GozCl75AihQloSWCXC5HDNgyinEnhaQ_4-gaMud_GF50elYXLlCToR9se9Z8z433U3KjM-3Yx7ptKkmQNAMggQwAVKgq3zYAoidNEWuxpkY_mAitTSRLnsJW-NCTa0bqBFF6Wm1MxgfE",
    e: "AQAB",
  },
  { name: "RSA-OAEP", hash: "SHA-256" },
  true,
  ["encrypt"],
)

async function getCookies() {
    try {
        const response = await axios.get('https://bilibili.com', {
            // 允许 axios 自动处理 cookies
            withCredentials: true,
        });

        // 获取响应中的 cookies
        const cookies = response.headers['set-cookie'];
        console.log('获取到的 cookies:', cookies);
        return cookies;
    } catch (error) {
        console.error(`请求错误: ${error.message}`);
        return 'error';
    }
}

// 第二个请求：使用获取到的 cookies 访问另一个网址
async function accessWithCookies(cookies,url) {
    try {
        const response = await axios.get(url, {
            headers: {
                Cookie: cookies.join('; '), // 将 cookies 以字符串形式设置
            },
        });
        
        //console.log('第二个请求的响应数据:', response.data);
        return response.data;
    } catch (error) {
        console.error(`请求错误: ${error.message}`);
        return 'error';
    }
}

console.log(getCookies());

// 创建一个路由来处理请求
app.get('/view', async (req, res) => {
    // 从查询参数中获取参数
    const { bvid , version } = req.query; // 假设你要传递的参数名为 'param'

    if (!bvid) {
        return res.status(400).send('Missing parameter: bvid');
    }

    try {
        // 使用参数构建 API 请求
        const response = await axios.get(`${API_INFO_URL}?bvid=${bvid}`);
        
        const now = new Date();

        // 格式化时间为 YYYY-MM-DD HH:mm:ss
        const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');
        if(version){
            console.log(`视频信息 当前UTC时间：${formattedDate}  `+`${bvid}`+` 版本：${version}`);
        }else{
            // 输出到控制台
            console.log(`视频信息 当前UTC时间：${formattedDate}  `+`${bvid}`);
        }
        // 转发数据到客户端
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/list', async (req, res) => {
    // 从查询参数中获取参数
    const { bvid } = req.query; // 假设你要传递的参数名为 'param'

    if (!bvid) {
        return res.status(400).send('Missing parameter: bvid');
    }

    try {
        // 使用参数构建 API 请求
        const response = await axios.get(`${API_VIDEOS_LIST_URL}?bvid=${bvid}`);
        // 转发数据到客户端
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// 创建一个路由来处理请求
app.get('/search', async (req, res) => {
    // 从查询参数中获取参数
    const { keyword , page } = req.query; // 假设你要传递的参数名为 'param'

    if (!keyword) {
        return res.status(400).send('Missing parameter: keyword');
    }

    try {
        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            if (COOKIES) {
                const buffer_text = Buffer.from(keyword, 'latin1');
                //console.log(keyword);

                //const correct_keyword = decodeURIComponent(buffer_text);
                const correct_keyword = keyword;

                if (page) {
                    data = await accessWithCookies(COOKIES,`${API_SEARCH_URL}?keyword=${correct_keyword}&page=${page}&search_type=video`);
                }else{
                    data = await accessWithCookies(COOKIES,`${API_SEARCH_URL}?keyword=${correct_keyword}&search_type=video`);
                }

                
                const now = new Date();

            // 格式化时间为 YYYY-MM-DD HH:mm:ss
                 const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');

                

            // 输出到控制台
                console.log(`搜索 当前UTC时间：${formattedDate}  `+`${correct_keyword}`);
                res.json(data);
            }
        // 转发数据到客户端
            
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/user', async (req, res) => {
    // 从查询参数中获取参数
    const { mid } = req.query; // 假设你要传递的参数名为 'param'

    if (!mid) {
        return res.status(400).send('Missing parameter: mid');
    }

    try {
        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            if (COOKIES) {
                data = await accessWithCookies(COOKIES,`${API_USER_URL}?mid=${mid}`);
                const now = new Date();

            // 格式化时间为 YYYY-MM-DD HH:mm:ss
                 const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');

            // 输出到控制台
                console.log(`用户查询 当前UTC时间：${formattedDate}  `+`${mid}`);
                res.json(data);
            }
        // 转发数据到客户端
            
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/user/video', async (req, res) => {
    // 从查询参数中获取参数
    const { mid, aid } = req.query; // 假设你要传递的参数名为 'param'

    if (!mid) {
        return res.status(400).send('Missing parameter: mid');
    }

    try {
        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            if (COOKIES) {
                if(aid){
                    data = await accessWithCookies(COOKIES,`${API_USER_VIDEO_URL}?vmid=${mid}&aid=${aid}`);
                }else{
                    data = await accessWithCookies(COOKIES,`${API_USER_VIDEO_URL}?vmid=${mid}`);
                }
                
                const now = new Date();

                const result = data.data.item.map(item => ({
                    title: item.title,
                    bvid: item.bvid,
                    param: item.param
                }));

            // 格式化时间为 YYYY-MM-DD HH:mm:ss
                 const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '-');

            // 输出到控制台
                console.log(`用户视频查询 当前UTC时间：${formattedDate}  `+`${mid}`);
                res.json({
                code: 0,
                data: result
            });
            }
        // 转发数据到客户端
            
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/timestamp', async (req, res) => {
    // 从查询参数中获取参数
    const { t } = req.query; // 假设你要传递的参数名为 'param'

    if (!t) {
        return res.status(400).send('Missing parameter: t');
    }

    try {

        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            var hash = await getCorrespondPath(t);
            // 输出到控制台
            res.json({
                code: 0,
                hash: hash
            });
        // 转发数据到客户端
            
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

async function getCorrespondPath(timestamp) {
  const data = new TextEncoder().encode(`refresh_${timestamp}`);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data))
  return encrypted.reduce((str, c) => str + c.toString(16).padStart(2, "0"), "")
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
