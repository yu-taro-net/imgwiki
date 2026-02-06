const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer((req, res) => {
    if (req.url === '/test') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('imgwikiのサーバーは正常に動いています！');
    } else {
        res.writeHead(200);
        res.end('WebSocket Server is Running!');
    }
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const wikiIo = io.of('/wiki');

// ★ここがポイント：箱は connection の外側に置く
let activeUsers = {};

wikiIo.on('connection', (socket) => {
    console.log('Wiki: 新しいユーザーが接続しました');

    // 1. ユーザーリストに自分を追加
    activeUsers[socket.id] = {
        id: socket.id.substring(0, 5),
        page: '読み込み中...'
    };

    // 2. 全員に「最新の人数」と「最新のリスト」を送る
    wikiIo.emit('user_count', wikiIo.sockets.size);
    wikiIo.emit('user_list_update', Object.values(activeUsers));

    // 3. 他のユーザーに参加を知らせる
    socket.broadcast.emit('new_user_joined', '他の誰かが参加しました！');

    // 4. ボタンクリックを受け取った時
    socket.on('button_clicked', (data) => {
        wikiIo.emit('share_alert', data);
    });

    // 5. 切断した時
    socket.on('disconnect', () => {
        console.log('Wiki: ユーザーが離脱しました');
        delete activeUsers[socket.id]; // リストから削除
        wikiIo.emit('user_count', wikiIo.sockets.size);
        wikiIo.emit('user_list_update', Object.values(activeUsers));
    });

    socket.on('page_info', (data) => {
    if (activeUsers[socket.id]) {
        // そのユーザーの「page」情報を書き換える
        activeUsers[socket.id].page = data.title || data.url;
        
        // 全員に「更新されたリスト」を配る
        wikiIo.emit('user_list_update', Object.values(activeUsers));
    }
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});