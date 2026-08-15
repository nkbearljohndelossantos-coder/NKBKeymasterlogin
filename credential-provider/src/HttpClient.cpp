#include "../include/HttpClient.h"
#include <vector>
#include <iostream>

HttpClient::HttpClient(const std::wstring& apiHost, INTERNET_PORT port, bool useHttps)
    : m_apiHost(apiHost), m_port(port), m_useHttps(useHttps)
{
}

HttpClient::~HttpClient()
{
}

AuthResponse HttpClient::AuthenticateUser(const std::wstring& identifier, const std::wstring& password, const std::wstring& computerName)
{
    AuthResponse response = { false, L"", L"", L"", L"", L"NKB", L"Network/Policy Service Unavailable" };

    HINTERNET hSession = WinHttpOpen(
        L"NKB-Credential-Provider/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0
    );

    if (!hSession) return response;

    // Strict non-blocking timeouts for Windows LogonUI safety:
    // Resolve timeout: 5000ms, Connect timeout: 5000ms, Send timeout: 10000ms, Receive timeout: 10000ms
    WinHttpSetTimeouts(hSession, 5000, 5000, 10000, 10000);

    HINTERNET hConnect = WinHttpConnect(hSession, m_apiHost.c_str(), m_port, 0);
    if (!hConnect)
    {
        WinHttpCloseHandle(hSession);
        return response;
    }

    DWORD dwFlags = m_useHttps ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET hRequest = WinHttpOpenRequest(
        hConnect,
        L"POST",
        L"/api/v1/auth/verify",
        NULL,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        dwFlags
    );

    if (!hRequest)
    {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return response;
    }

    // Construct JSON Payload
    std::wstring jsonPayload = L"{\"identifier\":\"" + identifier + L"\",\"password\":\"" + password + L"\",\"computer_name\":\"" + computerName + L"\"}";

    // Convert wide string payload to UTF-8
    int utf8Len = WideCharToMultiByte(CP_UTF8, 0, jsonPayload.c_str(), -1, NULL, 0, NULL, NULL);
    std::vector<char> utf8Buffer(utf8Len);
    WideCharToMultiByte(CP_UTF8, 0, jsonPayload.c_str(), -1, utf8Buffer.data(), utf8Len, NULL, NULL);

    LPCWSTR headers = L"Content-Type: application/json\r\n";

    BOOL bResults = WinHttpSendRequest(
        hRequest,
        headers,
        (DWORD)-1L,
        (LPVOID)utf8Buffer.data(),
        (DWORD)(utf8Len - 1),
        (DWORD)(utf8Len - 1),
        0
    );

    if (bResults)
    {
        bResults = WinHttpReceiveResponse(hRequest, NULL);
    }

    if (bResults)
    {
        DWORD dwStatusCode = 0;
        DWORD dwSize = sizeof(dwStatusCode);
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &dwStatusCode, &dwSize, WINHTTP_NO_HEADER_INDEX);

        std::string responseString;
        DWORD dwDownloaded = 0;
        do
        {
            dwSize = 0;
            if (WinHttpQueryDataAvailable(hRequest, &dwSize))
            {
                if (dwSize > 0)
                {
                    std::vector<char> buf(dwSize + 1);
                    if (WinHttpReadData(hRequest, (LPVOID)buf.data(), dwSize, &dwDownloaded))
                    {
                        buf[dwDownloaded] = '\0';
                        responseString += buf.data();
                    }
                }
            }
        } while (dwSize > 0);

        if (dwStatusCode == 200)
        {
            response.success = true;
            response.error_message = L"";

            auto extractJsonValue = [](const std::string& json, const std::string& key) -> std::wstring {
                std::string searchKey = "\"" + key + "\":\"";
                size_t startPos = json.find(searchKey);
                if (startPos == std::string::npos) return L"";
                startPos += searchKey.length();
                size_t endPos = json.find("\"", startPos);
                if (endPos == std::string::npos) return L"";
                std::string val = json.substr(startPos, endPos - startPos);
                
                int wlen = MultiByteToWideChar(CP_UTF8, 0, val.c_str(), -1, NULL, 0);
                std::vector<wchar_t> wbuf(wlen);
                MultiByteToWideChar(CP_UTF8, 0, val.c_str(), -1, wbuf.data(), wlen);
                return std::wstring(wbuf.data());
            };

            response.employee_id = extractJsonValue(responseString, "employee_id");
            response.email = extractJsonValue(responseString, "email");
            response.name = extractJsonValue(responseString, "name");
            response.windows_username = extractJsonValue(responseString, "windows_username");
            response.windows_domain = extractJsonValue(responseString, "windows_domain");

            if (response.windows_domain.empty()) response.windows_domain = L"NKB";
            if (response.windows_username.empty()) response.windows_username = response.employee_id;
        }
        else
        {
            response.success = false;
            if (responseString.find("ACCOUNT_DISABLED") != std::string::npos) {
                response.error_message = L"Your NKB account has been disabled. Contact IT Administration.";
            } else if (responseString.find("ACCOUNT_LOCKED") != std::string::npos) {
                response.error_message = L"Account locked due to multiple failed login attempts.";
            } else if (responseString.find("UNAUTHORIZED_COMPUTER") != std::string::npos) {
                response.error_message = L"Not authorized to sign in on this workstation.";
            } else {
                response.error_message = L"Invalid credentials.";
            }
        }
    }
    else
    {
        response.success = false;
        response.error_message = L"Network/Policy Service Unavailable";
    }

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);

    // Clean up sensitive memory buffers
    SAFE_ZERO_MEMORY(utf8Buffer.data(), utf8Buffer.size());

    return response;
}
