const http = require('http');
const { Server } = require('socket.io');

// 1. サーバーの作成
// 30行目あたりの「const server = ...」から始まるブロックを、以下のように書き換えます

const server = http.createServer((req, res) => {
    // URLが「/test」だった場合
    if (req.url === '/test') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('imgwikiのサーバーは正常に動いています！');
    } else {
        res.writeHead(200);
        res.end('WebSocket Server is Running!');
    }
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

    // 誰かが接続したら、全員に「誰か来たよ！」と送る
    //wikiIo.emit('new_user_joined', '新しいユーザーが参加しました！');
    // 自分以外の全員に送る魔法の言葉（.broadcast を挟む）
    socket.broadcast.emit('new_user_joined', '他の誰かが参加しました！');

    // wikiIo.on('connection', (socket) => { ... の中に追加
socket.on('button_clicked', (data) => {
    // 自分も含めた全員に送る
    wikiIo.emit('share_alert', data);
});

// 1. 接続中のユーザー情報を入れる箱を作る（ファイルの上のほうに）
let activeUsers = {};

wikiIo.on('connection', (socket) => {
    // 2. 誰かが繋がったら、その人のIDを保存
    activeUsers[socket.id] = {
        id: socket.id.substring(0, 5), // IDを短くしたもの
        page: '読み込み中...'
    };

    // 3. 全員に最新のリストを送りつける
    wikiIo.emit('user_list_update', Object.values(activeUsers));

    socket.on('disconnect', () => {
        // 4. いなくなったらリストから消す
        delete activeUsers[socket.id];
        wikiIo.emit('user_list_update', Object.values(activeUsers));
    });
});
});

// 4. Railwayのポート設定
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});