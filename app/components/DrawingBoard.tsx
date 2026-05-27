'use client';

import { useEffect, useRef, useState } from 'react';

interface DrawEvent {
  type: 'draw' | 'clear';
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  color?: string;
  size?: number;
}

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000');

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const message: DrawEvent = JSON.parse(event.data);

      if (message.type === 'draw' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && message.prevX !== undefined && message.prevY !== undefined) {
          ctx.strokeStyle = message.color || '#000000';
          ctx.lineWidth = message.size || 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(message.prevX, message.prevY);
          ctx.lineTo(message.x!, message.y!);
          ctx.stroke();
        }
      } else if (message.type === 'clear' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    lastPos.current = { x, y };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPos.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'draw',
          prevX: lastPos.current.x,
          prevY: lastPos.current.y,
          x,
          y,
          color,
          size: brushSize,
        })
      );
    }

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear' }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-center gap-4 bg-white dark:bg-zinc-800 p-4 shadow-md flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 border-2 border-zinc-300 dark:border-zinc-600 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400 w-8">{brushSize}</span>
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
        >
          Clear
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="border-4 border-zinc-300 dark:border-zinc-700 rounded-lg bg-white cursor-crosshair shadow-lg max-w-full max-h-full"
          style={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '700px' }}
        />
      </div>
    </div>
  );
}
