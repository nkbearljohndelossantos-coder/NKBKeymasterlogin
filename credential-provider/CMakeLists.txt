cmake_minimum_required(VERSION 3.15)
project(NKBCredentialProvider LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configure output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

include_directories(
    include
)

# Source files
set(SOURCES
    src/main.cpp
    src/NKBCredentialProvider.cpp
    src/NKBCredentialProviderCredential.cpp
    src/HttpClient.cpp
    src/helpers.cpp
    resources/provider.def
    resources/resource.rc
)

# Create Shared Library (DLL)
add_library(NKBCredentialProvider SHARED ${SOURCES})

target_compile_definitions(NKBCredentialProvider PRIVATE
    UNICODE
    _UNICODE
    WIN32_LEAN_AND_MEAN
)

# Link Windows System Libraries
target_link_libraries(NKBCredentialProvider PRIVATE
    credui
    secur32
    winhttp
    shlwapi
    ole32
    user32
    advapi32
)

# Windows Subsystem configuration
if(MSVC)
    target_link_options(NKBCredentialProvider PRIVATE
        "/DEF:${CMAKE_CURRENT_SOURCE_DIR}/resources/provider.def"
    )
endif()
