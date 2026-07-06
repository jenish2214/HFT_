cmake_minimum_required(VERSION 3.14)
project(hft_engine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra")

add_executable(hft_engine
    src/main.cpp
    src/order_book.cpp
    src/matching_engine.cpp
    src/json_handler.cpp
)

target_include_directories(hft_engine PRIVATE include)
