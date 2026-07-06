#pragma once

#include "types.hpp"

#include <map>
#include <optional>
#include <vector>

namespace hft {

// Price-time priority order book.
// Bids: highest price first. Asks: lowest price first.
class OrderBook {
public:
    static constexpr int MAX_DEPTH = 10;

    void add_order(Order& order);
    std::optional<Trade> try_match(Order& incoming);
    bool cancel_order(uint64_t order_id);

    std::vector<BookLevel> get_bids(int depth = MAX_DEPTH) const;
    std::vector<BookLevel> get_asks(int depth = MAX_DEPTH) const;
    std::vector<Order> get_open_orders(const std::string& strategy_id = "") const;
    double mid_price() const;
    double spread() const;

    uint64_t next_order_id() { return ++order_counter_; }
    uint64_t next_trade_id() { return ++trade_counter_; }

private:
    struct LevelEntry {
        int64_t total_qty = 0;
        int order_count = 0;
        std::vector<uint64_t> order_ids;  // FIFO queue at this price level
    };

    // Bids: descending price (std::map with reverse iterator)
    std::map<double, LevelEntry, std::greater<double>> bids_;
    std::map<double, LevelEntry> asks_;
    std::map<uint64_t, Order> orders_;

    uint64_t order_counter_ = 0;
    uint64_t trade_counter_ = 0;
};

}  // namespace hft
