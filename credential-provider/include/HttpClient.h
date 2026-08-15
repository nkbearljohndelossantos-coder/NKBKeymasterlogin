#pragma once
#include "common.h"
#include <string>

struct AuthResponse
{
    bool success;
    std::wstring employee_id;
    std::wstring email;
    std::wstring name;
    std::wstring windows_username;
    std::wstring windows_domain;
    std::wstring error_message;
};

class HttpClient
{
public:
    HttpClient(const std::wstring& apiHost = L"127.0.0.1", INTERNET_PORT port = 3000, bool useHttps = false);
    ~HttpClient();

    AuthResponse AuthenticateUser(const std::wstring& identifier, const std::wstring& password, const std::wstring& computerName);

private:
    std::wstring m_apiHost;
    INTERNET_PORT m_port;
    bool m_useHttps;
};
