#include "order_book.hpp"

#include <algorithm>

namespace hft {

void OrderBook::add_order(Order& order) {
    orders_[order.id] = order;

    if (order.side == Side::BUY) {
        auto& level = bids_[order.price];
        level.total_qty += order.quantity - order.filled_qty;
        level.order_count++;
        level.order_ids.push_back(order.id);
    } else {
        auto& level = asks_[order.price];
        level.total_qty += order.quantity - order.filled_qty;
        level.order_count++;
        level.order_ids.push_back(order.id);
    }
}

std::optional<Trade> OrderBook::try_match(Order& incoming) {
    if (incoming.type == OrderType::MARKET) {
        // Market orders cross immediately at best available price
        if (incoming.side == Side::BUY) {
            if (asks_.empty()) return std::nullopt;
            incoming.price = asks_.begin()->first;
        } else {
            if (bids_.empty()) return std::nullopt;
            incoming.price = bids_.begin()->first;
        }
    }

    int64_t remaining = incoming.quantity - incoming.filled_qty;

    if (incoming.side == Side::BUY) {
        // Match against asks (lowest price first)
        while (remaining > 0 && !asks_.empty()) {
            auto ask_it = asks_.begin();
            double ask_price = ask_it->first;

            if (incoming.type == OrderType::LIMIT && ask_price > incoming.price) {
                break;
            }

            auto& level = ask_it->second;
            uint64_t resting_id = level.order_ids.front();
            Order& resting = orders_[resting_id];

            int64_t fill_qty = std::min(remaining, resting.quantity - resting.filled_qty);
            double fill_price = ask_price;

            Trade trade;
            trade.id = next_trade_id();
            trade.buy_order_id = incoming.id;
            trade.sell_order_id = resting.id;
            trade.price = fill_price;
            trade.quantity = fill_qty;
            trade.timestamp_ns = incoming.timestamp_ns;

            incoming.filled_qty += fill_qty;
            resting.filled_qty += fill_qty;
            remaining -= fill_qty;
            level.total_qty -= fill_qty;

            if (resting.filled_qty >= resting.quantity) {
                resting.status = OrderStatus::FILLED;
                level.order_ids.erase(level.order_ids.begin());
                level.order_count--;
                orders_.erase(resting_id);
            } else {
                resting.status = OrderStatus::PARTIAL;
            }

            if (level.total_qty <= 0) {
                asks_.erase(ask_it);
            }

            incoming.status = (remaining > 0) ? OrderStatus::PARTIAL : OrderStatus::FILLED;
            return trade;
        }
    } else {
        // Match against bids (highest price first)
        while (remaining > 0 && !bids_.empty()) {
            auto bid_it = bids_.begin();
            double bid_price = bid_it->first;

            if (incoming.type == OrderType::LIMIT && bid_price < incoming.price) {
                break;
            }

            auto& level = bid_it->second;
            uint64_t resting_id = level.order_ids.front();
            Order& resting = orders_[resting_id];

            int64_t fill_qty = std::min(remaining, resting.quantity - resting.filled_qty);
            double fill_price = bid_price;

            Trade trade;
            trade.id = next_trade_id();
            trade.buy_order_id = resting.id;
            trade.sell_order_id = incoming.id;
            trade.price = fill_price;
            trade.quantity = fill_qty;
            trade.timestamp_ns = incoming.timestamp_ns;

            incoming.filled_qty += fill_qty;
            resting.filled_qty += fill_qty;
            remaining -= fill_qty;
            level.total_qty -= fill_qty;

            if (resting.filled_qty >= resting.quantity) {
                resting.status = OrderStatus::FILLED;
                level.order_ids.erase(level.order_ids.begin());
                level.order_count--;
                orders_.erase(resting_id);
            } else {
                resting.status = OrderStatus::PARTIAL;
            }

            if (level.total_qty <= 0) {
                bids_.erase(bid_it);
            }

            incoming.status = (remaining > 0) ? OrderStatus::PARTIAL : OrderStatus::FILLED;
            return trade;
        }
    }

    return std::nullopt;
}

bool OrderBook::cancel_order(uint64_t order_id) {
    auto it = orders_.find(order_id);
    if (it == orders_.end()) return false;

    Order& order = it->second;
    int64_t remaining = order.quantity - order.filled_qty;

    if (order.side == Side::BUY) {
        auto level_it = bids_.find(order.price);
        if (level_it != bids_.end()) {
            auto& level = level_it->second;
            level.total_qty -= remaining;
            level.order_count--;
            level.order_ids.erase(
                std::remove(level.order_ids.begin(), level.order_ids.end(), order_id),
                level.order_ids.end());
            if (level.total_qty <= 0) bids_.erase(level_it);
        }
    } else {
        auto level_it = asks_.find(order.price);
        if (level_it != asks_.end()) {
            auto& level = level_it->second;
            level.total_qty -= remaining;
            level.order_count--;
            level.order_ids.erase(
                std::remove(level.order_ids.begin(), level.order_ids.end(), order_id),
                level.order_ids.end());
            if (level.total_qty <= 0) asks_.erase(level_it);
        }
    }

    order.status = OrderStatus::CANCELLED;
    orders_.erase(it);
    return true;
}

std::vector<BookLevel> OrderBook::get_bids(int depth) const {
    std::vector<BookLevel> result;
    int count = 0;
    for (const auto& [price, level] : bids_) {
        if (count++ >= depth) break;
        result.push_back({price, level.total_qty, level.order_count});
    }
    return result;
}

std::vector<BookLevel> OrderBook::get_asks(int depth) const {
    std::vector<BookLevel> result;
    int count = 0;
    for (const auto& [price, level] : asks_) {
        if (count++ >= depth) break;
        result.push_back({price, level.total_qty, level.order_count});
    }
    return result;
}

double OrderBook::mid_price() const {
    if (bids_.empty() || asks_.empty()) return 0.0;
    return (bids_.begin()->first + asks_.begin()->first) / 2.0;
}

double OrderBook::spread() const {
    if (bids_.empty() || asks_.empty()) return 0.0;
    return asks_.begin()->first - bids_.begin()->first;
}

std::vector<Order> OrderBook::get_open_orders(const std::string& strategy_id) const {
    std::vector<Order> result;
    for (const auto& [id, order] : orders_) {
        if (!strategy_id.empty() && order.strategy_id != strategy_id) continue;
        if (order.status == OrderStatus::PENDING || order.status == OrderStatus::PARTIAL) {
            result.push_back(order);
        }
    }
    return result;
}

}  // namespace hft
