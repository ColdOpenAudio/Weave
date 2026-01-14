import http from 'http';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

export interface PreviewServer {
  url: string;
  notify: (filePath: string) => void;
  close: () => void;
}

export async function startPreviewServer(options: { initialFile?: string; openBrowser?: boolean }): Promise<PreviewServer> {
  const clients = new Set<http.ServerResponse>();
  let currentFile = options.initialFile ?? '';

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    if (req.url.startsWith('/events')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      res.write('\n');
      clients.add(res);
      req.on('close', () => {
        clients.delete(res);
      });
      return;
    }

    if (req.url.startsWith('/asset')) {
      if (!currentFile || !fs.existsSync(currentFile)) {
        res.writeHead(404);
        res.end('No preview file available.');
        return;
      }
      const ext = path.extname(currentFile).toLowerCase();
      const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
      fs.createReadStream(currentFile).pipe(res);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(buildHtml());
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start preview server.');
  }
  const url = `http://127.0.0.1:${address.port}`;

  if (options.openBrowser !== false) {
    openBrowser(url);
  }

  const notify = (filePath: string) => {
    currentFile = filePath;
    for (const client of clients) {
      client.write(`data: reload\n\n`);
    }
  };

  return {
    url,
    notify,
    close: () => {
      for (const client of clients) {
        client.end();
      }
      server.close();
    }
  };
}

function buildHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Weave Preview</title>
  <style>
    html, body { margin: 0; padding: 0; background: #f6f2ea; height: 100%; }
    .wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
    img { max-width: 95vw; max-height: 95vh; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
    .hint { position: fixed; top: 12px; left: 12px; font: 12px/1.4 Arial, sans-serif; color: #444; }
  </style>
</head>
<body>
  <div class="hint">Weave preview - auto reload on changes.</div>
  <div class="wrap">
    <img id="preview" src="/asset" alt="Preview" />
  </div>
  <script>
    const img = document.getElementById('preview');
    const refresh = () => { img.src = '/asset?ts=' + Date.now(); };
    const events = new EventSource('/events');
    events.onmessage = refresh;
    setInterval(refresh, 10000);
  </script>
</body>
</html>`;
}

function openBrowser(url: string): void {
  switch (process.platform) {
    case 'darwin':
      execFileSync('open', [url]);
      break;
    case 'win32':
      execFileSync('cmd', ['/c', 'start', '', url]);
      break;
    default:
      execFileSync('xdg-open', [url]);
      break;
  }
}
