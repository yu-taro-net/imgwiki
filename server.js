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

// 接続中のユーザー情報を保持するオブジェクト
let activeUsers = {};

wikiIo.on('connection', (socket) => {
    console.log('Wiki: 新しいユーザーが接続しました');

    // 1. ユーザー情報の初期登録
    activeUsers[socket.id] = {
        id: socket.id.substring(0, 5),
        page: '読み込み中...'
    };

    // 2. 「通知（アラート）」を送る：自分以外（broadcast）に1回だけ
    socket.broadcast.emit('user_event', { 
        msg: `新しいユーザー(${activeUsers[socket.id].id})が入室しました！` 
    });

    // 3. 「データの更新」を全員に送る（これらはPHP側でアラートを出さない処理にする）
    wikiIo.emit('user_count', wikiIo.sockets.size);
    wikiIo.emit('user_list_update', Object.values(activeUsers));

    // 4. ボタンクリックを受け取った時
    socket.on('button_clicked', (data) => {
        // share_alertという専用イベントで送ることで、他のイベントと混ざらないようにします
        wikiIo.emit('share_alert', data);
    });

    // 5. 切断した時
    socket.on('disconnect', () => {
        console.log('Wiki: ユーザーが離脱しました');
        
        // ユーザーが消える「前」に名前を取得しておく（通知用）
        const userName = activeUsers[socket.id] ? activeUsers[socket.id].id : '不明なユーザー';
        
        // リストから削除
        delete activeUsers[socket.id];

        // 退室通知を全員に送る（1回だけ）
        wikiIo.emit('user_event', { 
           msg: `${userName} さんが退室しました。現在の人数: ${wikiIo.sockets.size}名` 
        });

        // データの更新を全員に送る
        wikiIo.emit('user_count', wikiIo.sockets.size);
        wikiIo.emit('user_list_update', Object.values(activeUsers));
    });

    // ページ遷移情報の受け取り
    socket.on('page_info', (data) => {
    if (activeUsers[socket.id]) {
        activeUsers[socket.id].id = data.user_id || "guest";
        activeUsers[socket.id].name = data.user_name || "ユーザ"; // ここ！
        activeUsers[socket.id].page = data.title || data.url;
        wikiIo.emit('user_list_update', Object.values(activeUsers));
    }
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});