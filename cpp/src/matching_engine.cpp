#include "matching_engine.hpp"

namespace hft {

uint64_t MatchingEngine::now_ns() {
    return static_cast<uint64_t>(
        std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::high_resolution_clock::now().time_since_epoch())
            .count());
}

MatchingEngine::SubmitResult MatchingEngine::submit_order(
    Side side, OrderType type, double price, int64_t quantity,
    const std::string& strategy_id) {

    uint64_t start = now_ns();

    Order order;
    order.id = book_.next_order_id();
    order.side = side;
    order.type = type;
    order.price = price;
    order.quantity = quantity;
    order.filled_qty = 0;
    order.status = OrderStatus::PENDING;
    order.timestamp_ns = start;
    order.strategy_id = strategy_id;

    std::vector<Trade> trades;

    // Match loop: keep matching until order is filled or no more crosses
    while (order.filled_qty < order.quantity) {
        auto trade_opt = book_.try_match(order);
        if (!trade_opt.has_value()) break;
        trades.push_back(trade_opt.value());
        total_trades_++;
    }

    // Resting limit order with remaining quantity
    if (order.type == OrderType::LIMIT && order.filled_qty < order.quantity) {
        book_.add_order(order);
        order.status = (order.filled_qty > 0) ? OrderStatus::PARTIAL : OrderStatus::PENDING;
    } else if (order.filled_qty >= order.quantity) {
        order.status = OrderStatus::FILLED;
    }

    uint64_t end = now_ns();
    uint64_t latency = end - start;

    total_orders_++;
    cumulative_latency_ns_ += latency;

    return {order, trades, latency};
}

bool MatchingEngine::cancel_order(uint64_t order_id) {
    return book_.cancel_order(order_id);
}

std::vector<BookLevel> MatchingEngine::get_bids(int depth) const {
    return book_.get_bids(depth);
}

std::vector<BookLevel> MatchingEngine::get_asks(int depth) const {
    return book_.get_asks(depth);
}

double MatchingEngine::mid_price() const { return book_.mid_price(); }

double MatchingEngine::spread() const { return book_.spread(); }

std::vector<Order> MatchingEngine::get_open_orders(const std::string& strategy_id) const {
    return book_.get_open_orders(strategy_id);
}

LatencyStats MatchingEngine::get_stats() const {
    uint64_t avg_latency = total_orders_ > 0 ? cumulative_latency_ns_ / total_orders_ : 0;
    return {avg_latency, total_orders_, total_trades_};
}

}  // namespace hft
