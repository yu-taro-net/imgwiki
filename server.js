const http = require('http');
const { Server } = require('socket.io');

// 1. サーバーの作成
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('WebSocket Server is Running!');
});

// 2. Socket.ioの初期化（CORS設定：PHPからの接続を許可）
const io = new Server(server, {
    cors: {
        origin: "*", // 本番環境では特定のURLに絞るのが安全ですが、まずはこれでOK
        methods: ["GET", "POST"]
    }
});

// 3. Wiki用の名前空間（Namespace）を作成
const wikiIo = io.of('/wiki');

wikiIo.on('connection', (socket) => {
    console.log('Wiki: 新しいユーザーが接続しました');

    // 接続人数を全員に送る（テスト用）
    wikiIo.emit('user_count', wikiIo.sockets.size);

    socket.on('disconnect', () => {
        console.log('Wiki: ユーザーが離脱しました');
        wikiIo.emit('user_count', wikiIo.sockets.size);
    });
});

// 4. Railwayのポート設定
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});

// サーバーが動いているか確認するための簡単なルート
app.get('/test', (req, res) => {
  res.send('imgwikiのサーバーは正常に動いています！');
});