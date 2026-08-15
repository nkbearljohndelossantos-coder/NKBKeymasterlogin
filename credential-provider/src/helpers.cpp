#include "../include/common.h"

// Helper functions for COM registration and string handling
HRESULT RegisterInprocServer(PCWSTR pszDllPath, const GUID& clsid, PCWSTR pszFriendlyName)
{
    wchar_t szCLSID[64];
    StringFromGUID2(clsid, szCLSID, ARRAYSIZE(szCLSID));

    wchar_t szKey[256];
    HRESULT hr = StringCchPrintfW(szKey, ARRAYSIZE(szKey), L"CLSID\\%s", szCLSID);
    if (FAILED(hr)) return hr;

    HKEY hKey = NULL;
    LONG lRes = RegCreateKeyExW(HKEY_CLASSES_ROOT, szKey, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL);
    if (lRes == ERROR_SUCCESS)
    {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (BYTE*)pszFriendlyName, (DWORD)(wcslen(pszFriendlyName) + 1) * sizeof(wchar_t));

        HKEY hInprocKey = NULL;
        lRes = RegCreateKeyExW(hKey, L"InprocServer32", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hInprocKey, NULL);
        if (lRes == ERROR_SUCCESS)
        {
            RegSetValueExW(hInprocKey, NULL, 0, REG_SZ, (BYTE*)pszDllPath, (DWORD)(wcslen(pszDllPath) + 1) * sizeof(wchar_t));
            PCWSTR pszModel = L"Apartment";
            RegSetValueExW(hInprocKey, L"ThreadingModel", 0, REG_SZ, (BYTE*)pszModel, (DWORD)(wcslen(pszModel) + 1) * sizeof(wchar_t));
            RegCloseKey(hInprocKey);
        }
        RegCloseKey(hKey);
    }
    return HRESULT_FROM_WIN32(lRes);
}

HRESULT UnregisterInprocServer(const GUID& clsid)
{
    wchar_t szCLSID[64];
    StringFromGUID2(clsid, szCLSID, ARRAYSIZE(szCLSID));

    wchar_t szKey[256];
    HRESULT hr = StringCchPrintfW(szKey, ARRAYSIZE(szKey), L"CLSID\\%s\\InprocServer32", szCLSID);
    if (SUCCEEDED(hr)) RegDeleteKeyW(HKEY_CLASSES_ROOT, szKey);

    hr = StringCchPrintfW(szKey, ARRAYSIZE(szKey), L"CLSID\\%s", szCLSID);
    if (SUCCEEDED(hr)) RegDeleteKeyW(HKEY_CLASSES_ROOT, szKey);

    return S_OK;
}
