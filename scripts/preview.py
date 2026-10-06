"""Serve a downloaded build, including styles fetched by the Giscus iframe."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


directory = sys.argv[1] if len(sys.argv) > 1 else 'public'
with ThreadingHTTPServer(('127.0.0.1', 4174), partial(PreviewHandler, directory=directory)) as server:
    print('Preview: http://127.0.0.1:4174', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
