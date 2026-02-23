#!/usr/bin/env python3
"""
Port forwarder for Ironclaw
Listens on 0.0.0.0:3001 and forwards to 127.0.0.1:3000
Allows local network access to Ironclaw Web UI
"""

import socket
import threading
import sys

LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 3001
TARGET_HOST = "127.0.0.1"
TARGET_PORT = 3000

def forward(source, destination):
    """Forward data between two sockets"""
    while True:
        try:
            data = source.recv(4096)
            if not data:
                break
            destination.sendall(data)
        except:
            break
    try:
        source.close()
    except:
        pass
    try:
        destination.close()
    except:
        pass

def handle_client(client_socket):
    """Handle a client connection"""
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.connect((TARGET_HOST, TARGET_PORT))
        
        # Start forwarding in both directions
        t1 = threading.Thread(target=forward, args=(client_socket, server_socket))
        t2 = threading.Thread(target=forward, args=(server_socket, client_socket))
        t1.daemon = True
        t2.daemon = True
        t1.start()
        t2.start()
    except Exception as e:
        print(f"Error: {e}")
        try:
            client_socket.close()
        except:
            pass

def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        sock.bind((LISTEN_HOST, LISTEN_PORT))
        sock.listen(5)
        print(f"Forwarding {LISTEN_HOST}:{LISTEN_PORT} -> {TARGET_HOST}:{TARGET_PORT}")
        print(f"Access Ironclaw at http://192.168.4.155:{LISTEN_PORT}")
        
        while True:
            client, addr = sock.accept()
            print(f"Connection from {addr}")
            threading.Thread(target=handle_client, args=(client,)).start()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        sock.close()

if __name__ == "__main__":
    main()
