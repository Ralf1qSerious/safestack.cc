#!/usr/bin/env python3
import http.server
import socketserver
import os
import webbrowser

HOST = "127.0.0.1"
PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    # Serve files from the project root directory
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # Optional: cleaner console logs
    def log_message(self, fmt, *args):
        print(f"[SafeStack] {self.address_string()} - {fmt % args}")

def main():
    os.chdir(ROOT)

    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        url = f"http://{HOST}:{PORT}/"
        print(f"[SafeStack] Serving: {url}")
        print("[SafeStack] Press CTRL+C to stop")

        # Open browser automatically (comment out if you don't want it)
        try:
            webbrowser.open(url)
        except Exception:
            pass

        httpd.serve_forever()

if __name__ == "__main__":
    main()
