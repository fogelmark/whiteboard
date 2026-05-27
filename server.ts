import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ server });

  interface DrawEvent {
    type: 'draw' | 'clear' | 'user-join' | 'user-leave';
    x?: number;
    y?: number;
    prevX?: number;
    prevY?: number;
    color?: string;
    size?: number;
    userId?: string;
  }

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message: DrawEvent = JSON.parse(data.toString());

        // Broadcast to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
