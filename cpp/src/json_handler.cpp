#include "json_handler.hpp"

#include <cstdlib>
#include <iomanip>
#include <sstream>

namespace hft {

std::string JsonHandler::side_to_str(Side s) {
    return s == Side::BUY ? "BUY" : "SELL";
}

std::string JsonHandler::type_to_str(OrderType t) {
    return t == OrderType::LIMIT ? "LIMIT" : "MARKET";
}

std::string JsonHandler::status_to_str(OrderStatus s) {
    switch (s) {
        case OrderStatus::PENDING: return "PENDING";
        case OrderStatus::PARTIAL: return "PARTIAL";
        case OrderStatus::FILLED: return "FILLED";
        case OrderStatus::CANCELLED: return "CANCELLED";
    }
    return "UNKNOWN";
}

std::string JsonHandler::extract_string(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos += search.size();
    auto end = json.find('"', pos);
    return json.substr(pos, end - pos);
}

double JsonHandler::extract_double(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 0.0;
    pos += search.size();
    return std::strtod(json.c_str() + pos, nullptr);
}

int64_t JsonHandler::extract_int64(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 0;
    pos += search.size();
    return std::strtoll(json.c_str() + pos, nullptr, 10);
}

uint64_t JsonHandler::extract_uint64(const std::string& json, const std::string& key) {
    return static_cast<uint64_t>(extract_int64(json, key));
}

std::string JsonHandler::serialize_book() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);
    oss << "{\"bids\":[";
    auto bids = engine_.get_bids();
    for (size_t i = 0; i < bids.size(); ++i) {
        if (i > 0) oss << ",";
        oss << "{\"price\":" << bids[i].price
            << ",\"qty\":" << bids[i].quantity
            << ",\"orders\":" << bids[i].order_count << "}";
    }
    oss << "],\"asks\":[";
    auto asks = engine_.get_asks();
    for (size_t i = 0; i < asks.size(); ++i) {
        if (i > 0) oss << ",";
        oss << "{\"price\":" << asks[i].price
            << ",\"qty\":" << asks[i].quantity
            << ",\"orders\":" << asks[i].order_count << "}";
    }
    oss << "],\"mid\":" << engine_.mid_price()
        << ",\"spread\":" << engine_.spread() << "}";
    return oss.str();
}

std::string JsonHandler::serialize_order(const Order& o) const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);
    oss << "{\"id\":" << o.id
        << ",\"side\":\"" << side_to_str(o.side) << "\""
        << ",\"type\":\"" << type_to_str(o.type) << "\""
        << ",\"price\":" << o.price
        << ",\"qty\":" << o.quantity
        << ",\"filled\":" << o.filled_qty
        << ",\"status\":\"" << status_to_str(o.status) << "\""
        << ",\"strategy\":\"" << o.strategy_id << "\""
        << ",\"latency_ns\":" << 0 << "}";
    return oss.str();
}

std::string JsonHandler::serialize_trade(const Trade& t) const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);
    oss << "{\"id\":" << t.id
        << ",\"price\":" << t.price
        << ",\"qty\":" << t.quantity
        << ",\"buy_order\":" << t.buy_order_id
        << ",\"sell_order\":" << t.sell_order_id
        << ",\"timestamp_ns\":" << t.timestamp_ns << "}";
    return oss.str();
}

std::string JsonHandler::serialize_stats() const {
    auto stats = engine_.get_stats();
    std::ostringstream oss;
    oss << "{\"avg_latency_ns\":" << stats.match_latency_ns
        << ",\"total_orders\":" << stats.total_orders
        << ",\"total_trades\":" << stats.total_trades << "}";
    return oss.str();
}

std::string JsonHandler::handle(const std::string& input) {
    std::string action = extract_string(input, "action");

    if (action == "submit") {
        std::string side_str = extract_string(input, "side");
        std::string type_str = extract_string(input, "type");
        double price = extract_double(input, "price");
        int64_t qty = extract_int64(input, "qty");
        std::string strategy = extract_string(input, "strategy");

        Side side = (side_str == "BUY") ? Side::BUY : Side::SELL;
        OrderType type = (type_str == "MARKET") ? OrderType::MARKET : OrderType::LIMIT;

        auto result = engine_.submit_order(side, type, price, qty, strategy);

        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);
        oss << "{\"status\":\"ok\",\"order\":" << serialize_order(result.order)
            << ",\"latency_ns\":" << result.latency_ns
            << ",\"trades\":[";
        for (size_t i = 0; i < result.trades.size(); ++i) {
            if (i > 0) oss << ",";
            oss << serialize_trade(result.trades[i]);
        }
        oss << "],\"book\":" << serialize_book()
            << ",\"stats\":" << serialize_stats() << "}";
        return oss.str();
    }

    if (action == "cancel") {
        uint64_t order_id = extract_uint64(input, "order_id");
        bool ok = engine_.cancel_order(order_id);
        return ok ? "{\"status\":\"ok\",\"book\":" + serialize_book() + "}"
                  : "{\"status\":\"error\",\"message\":\"order not found\"}";
    }

    if (action == "book") {
        return "{\"status\":\"ok\",\"book\":" + serialize_book() +
               ",\"stats\":" + serialize_stats() + "}";
    }

    if (action == "stats") {
        return "{\"status\":\"ok\",\"stats\":" + serialize_stats() + "}";
    }

    if (action == "orders") {
        std::string strategy = extract_string(input, "strategy");
        auto orders = engine_.get_open_orders(strategy);
        std::ostringstream oss;
        oss << "{\"status\":\"ok\",\"orders\":[";
        for (size_t i = 0; i < orders.size(); ++i) {
            if (i > 0) oss << ",";
            oss << serialize_order(orders[i]);
        }
        oss << "]}";
        return oss.str();
    }

    return "{\"status\":\"error\",\"message\":\"unknown action\"}";
}

}  // namespace hft
