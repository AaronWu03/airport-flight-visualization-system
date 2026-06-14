import express from 'express';
import cors from 'cors';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import 'dotenv/config';
import tripRoutes from './trip-routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// 先注册路由（在服务器启动之前）
app.use(tripRoutes);

const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@variflight-ai/variflight-mcp"],
    env: {
        ...process.env,
        "VARIFLIGHT_API_KEY": process.env.VARIFLIGHT_API_KEY
    }
});

const client = new Client({ name: "web-proxy", version: "1.0.0" }, { capabilities: {} });

let availableTools = [];

async function init() {
    try {
        await client.connect(transport);
        const { tools } = await client.listTools();
        availableTools = tools;
        console.log("✅ MCP 连接成功！");
        console.log("🛠️ 当前可用工具:", tools.map(t => t.name).join(', '));
        
        // 存储client到app.locals供trip-routes使用
        app.locals.mcpClient = client;
        console.log("🚀 服务器已启动，监听端口 3001");
        
    } catch (e) {
        console.error("❌ MCP 初始化失败:", e.message);
    }
}

app.post('/api/mcp', async (req, res) => {
    try {
        const { toolName, args } = req.body;
        console.log(`正在调用工具: ${toolName}`, "参数:", args);
        
        const result = await client.callTool({
            name: toolName,
            arguments: args
        });
        res.json(result);
    } catch (e) {
        console.error("调用工具出错:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// 添加调试路由
app.get('/api/test', (req, res) => {
    res.json({ message: 'API 正常工作', routes: app._router.stack.filter(r => r.route).map(r => r.route.path) });
});

app.listen(3001, () => init());
