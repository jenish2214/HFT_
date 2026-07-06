#pragma once

#include <cstdint>
#include <string>

namespace hft {

enum class Side : uint8_t { BUY = 0, SELL = 1 };

enum class OrderType : uint8_t { LIMIT = 0, MARKET = 1 };

enum class OrderStatus : uint8_t {
    PENDING = 0,
    PARTIAL = 1,
    FILLED = 2,
    CANCELLED = 3
};

struct Order {
    uint64_t id;
    Side side;
    OrderType type;
    double price;
    int64_t quantity;
    int64_t filled_qty;
    OrderStatus status;
    uint64_t timestamp_ns;
    std::string strategy_id;
};

struct Trade {
    uint64_t id;
    uint64_t buy_order_id;
    uint64_t sell_order_id;
    double price;
    int64_t quantity;
    uint64_t timestamp_ns;
};

struct BookLevel {
    double price;
    int64_t quantity;
    int order_count;
};

struct LatencyStats {
    uint64_t match_latency_ns;
    uint64_t total_orders;
    uint64_t total_trades;
};

}  // namespace hft
