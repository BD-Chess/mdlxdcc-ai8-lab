"""Serve only the local static lab; no functions, provider calls or publishing."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY = ("default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; "
          "style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; "
          "worker-src 'self' blob:; object-src 'none'; form-action 'self'; base-uri 'self'")


class LabHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', POLICY)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-AI8-Environment', 'isolated-local-lab')
        super().end_headers()


def make_server(port=8871):
    return ThreadingHTTPServer(('127.0.0.1', port), partial(LabHandler, directory=str(ROOT / 'public')))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8871)
    args = parser.parse_args()
    server = make_server(args.port)
    print(f'AI8 local lab: http://127.0.0.1:{server.server_port}/ (Ctrl+C stops)')
    print('Static preview; external resources/API calls blocked by CSP. Existing navigation links may leave the lab.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
