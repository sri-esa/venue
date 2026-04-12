import http.server
import socketserver
import threading
import json
from urllib.parse import urlparse, parse_qs

class MockHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        elif parsed_path.path == '/queues/nearest':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            # Mock nearest queue response
            resp = [
                {"queueId": "q-1", "stallName": "Fast Burger", "stallType": "FOOD", "currentLength": 2, "estimatedWaitMinutes": 2, "isOpen": True, "distanceMeters": 45},
                {"queueId": "q-2", "stallName": "Drinks Stand", "stallType": "FOOD", "currentLength": 5, "estimatedWaitMinutes": 3, "isOpen": True, "distanceMeters": 60}
            ]
            self.wfile.write(json.dumps(resp).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/density/ingest':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "ingested"}')
        elif parsed_path.path == '/queues/manual':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "overridden"}')
        else:
            self.send_response(404)
            self.end_headers()

def run_server(port):
    with socketserver.TCPServer(("", port), MockHandler) as httpd:
        print(f"Serving at port {port}")
        httpd.serve_forever()

if __name__ == "__main__":
    ports = [8081, 8082, 8083, 8084]
    threads = []
    for port in ports:
        t = threading.Thread(target=run_server, args=(port,))
        t.daemon = True
        t.start()
        threads.append(t)
    
    import time
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
