#pragma once

#include "matching_engine.hpp"

#include <sstream>
#include <string>

namespace hft {

class JsonHandler {
public:
    explicit JsonHandler(MatchingEngine& engine) : engine_(engine) {}

    // Parse incoming JSON command, return JSON response
    std::string handle(const std::string& input);

private:
    MatchingEngine& engine_;

    static std::string side_to_str(Side s);
    static std::string type_to_str(OrderType t);
    static std::string status_to_str(OrderStatus s);

    std::string serialize_book() const;
    std::string serialize_order(const Order& o) const;
    std::string serialize_trade(const Trade& t) const;
    std::string serialize_stats() const;

    // Minimal JSON helpers (no external deps)
    static std::string extract_string(const std::string& json, const std::string& key);
    static double extract_double(const std::string& json, const std::string& key);
    static int64_t extract_int64(const std::string& json, const std::string& key);
    static uint64_t extract_uint64(const std::string& json, const std::string& key);
};

}  // namespace hft
