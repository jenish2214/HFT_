#include "json_handler.hpp"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <cstring>
#include <iostream>
#include <string>

namespace {

constexpr int PORT = 9001;
constexpr int BACKLOG = 16;
bool send_all(int fd, const std::string& data) {
    const char* ptr = data.c_str();
    size_t remaining = data.size();
    while (remaining > 0) {
        ssize_t sent = send(fd, ptr, remaining, 0);
        if (sent <= 0) return false;
        ptr += sent;
        remaining -= static_cast<size_t>(sent);
    }
    return true;
}

std::string recv_line(int fd) {
    std::string line;
    char c;
    while (recv(fd, &c, 1, 0) > 0) {
        if (c == '\n') break;
        line += c;
    }
    return line;
}

}  // namespace

int main() {
    hft::MatchingEngine engine;
    hft::JsonHandler handler(engine);

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        std::cerr << "Failed to create socket\n";
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(PORT);

    if (bind(server_fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
        std::cerr << "Failed to bind port " << PORT << "\n";
        return 1;
    }

    if (listen(server_fd, BACKLOG) < 0) {
        std::cerr << "Failed to listen\n";
        return 1;
    }

    std::cout << "HFT Matching Engine listening on port " << PORT << std::endl;

    while (true) {
        sockaddr_in client_addr{};
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, reinterpret_cast<sockaddr*>(&client_addr), &client_len);
        if (client_fd < 0) continue;

        std::string request = recv_line(client_fd);
        if (!request.empty()) {
            std::string response = handler.handle(request);
            response += "\n";
            send_all(client_fd, response);
        }
        close(client_fd);
    }

    close(server_fd);
    return 0;
}
