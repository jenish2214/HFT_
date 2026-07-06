#pragma once

#include "order_book.hpp"
#include "types.hpp"

#include <chrono>
#include <string>
#include <vector>

namespace hft {

class MatchingEngine {
public:
    struct SubmitResult {
        Order order;
        std::vector<Trade> trades;
        uint64_t latency_ns;
    };

    SubmitResult submit_order(Side side, OrderType type, double price,
                              int64_t quantity, const std::string& strategy_id);

    bool cancel_order(uint64_t order_id);

    std::vector<BookLevel> get_bids(int depth = OrderBook::MAX_DEPTH) const;
    std::vector<BookLevel> get_asks(int depth = OrderBook::MAX_DEPTH) const;

    double mid_price() const;
    double spread() const;
    std::vector<Order> get_open_orders(const std::string& strategy_id = "") const;

    LatencyStats get_stats() const;

private:
    OrderBook book_;
    uint64_t total_orders_ = 0;
    uint64_t total_trades_ = 0;
    uint64_t cumulative_latency_ns_ = 0;

    static uint64_t now_ns();
};

}  // namespace hft
