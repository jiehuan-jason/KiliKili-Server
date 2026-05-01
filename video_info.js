// JavaScript source code
// 引入所需模块
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import md5 from 'md5'

// Digits map as in your Rust example
const DIGIT_MAP = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "10"
];

const app = express();
const PORT = 3000;

// 定义要获取的 API URL
const API_INFO_URL = 'https://api.bilibili.com/x/web-interface/view'; // 替换为实际的 API URL
const API_SEARCH_URL = 'https://api.bilibili.com/x/web-interface/wbi/search/all/v2';
const API_USER_URL = 'https://api.bilibili.com/x/web-interface/card';
const API_USER_VIDEO_URL = 'https://app.bilibili.com/x/v2/space/archive/cursor'
const API_VIDEOS_LIST_URL = 'https://api.bilibili.com/x/player/pagelist';

const COOKIES = [
    ];

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig) => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

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

// 为请求参数进行 wbi 签名
function encWbi(params, img_key, sub_key) {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object
    .keys(params)
    .sort()
    .map(key => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wbi_sign = md5(query + mixin_key) // 计算 w_rid

  return query + '&w_rid=' + wbi_sign
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      // SESSDATA 字段
      Cookie: COOKIES,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      Referer: 'https://www.bilibili.com/'//对于直接浏览器调用可能不适用
    }
  })
  const { data: { wbi_img: { img_url, sub_url } } } = await res.json()

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.')
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.')
    )
  }
}


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
    var { keyword , page } = req.query; // 假设你要传递的参数名为 'param'

    if (!keyword) {
        return res.status(400).send('Missing parameter: keyword');
    }
    if(!page) {
        page = 1;
    }

    try {
        const web_keys = await getWbiKeys()
        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            if (COOKIES) {
                const buffer_text = Buffer.from(keyword, 'latin1');
                //console.log(keyword);

                //const correct_keyword = decodeURIComponent(buffer_text);
                const correct_keyword = keyword;

                if (page) {
                    const params = {keyword:correct_keyword, page:page, search_type:"video"},
                        img_key = web_keys.img_key,
                        sub_key = web_keys.sub_key
                    const query = encWbi(params, img_key, sub_key);
                    console.log(query);
                    var data = await accessWithCookies(COOKIES,`${API_SEARCH_URL}?${query}`);
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
        var data = "";
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
        var data="";
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

app.get('/uuid', async (req, res) => {
    try {

        // 使用参数构建 API 请求
         //const cookies = await getCookies();
            var uuid = gen();
            // 输出到控制台
            res.json({
                code: 0,
                uuid: uuid
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

// Function to generate a UUID-like string
function gen() {
    const t = Date.now() % 100000; // Get current time in milliseconds, mod 100000

    // Generate random parts of the UUID
    const part1 = randomChoice(8);
    const part2 = randomChoice(4);
    const part3 = randomChoice(4);
    const part4 = randomChoice(4);
    const part5 = randomChoice(12);

    // Format and return the UUID
    return `${part1}-${part2}-${part3}-${part4}-${part5}${String(t).padStart(5, '0')}infoc`;
}

// Function to generate a random string of given length from DIGIT_MAP
function randomChoice(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += DIGIT_MAP[Math.floor(Math.random() * DIGIT_MAP.length)];
    }
    return result;
}

// Test the function
console.log(gen());


// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
