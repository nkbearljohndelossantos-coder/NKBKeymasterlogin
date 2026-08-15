#include "../include/NKBCredentialProviderCredential.h"
#include "../include/HttpClient.h"
#include <shlwapi.h>
#include <security.h>

#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "secur32.lib")

NKBCredentialProviderCredential::NKBCredentialProviderCredential()
    : m_cRef(1), m_pPCE(NULL), m_pszIdentifier(NULL), m_pszPassword(NULL),
      m_pszStatusText(NULL), m_authenticated(false),
      m_windowsDomain(L"."), m_windowsUsername(L"NKBUser")
{
}

NKBCredentialProviderCredential::~NKBCredentialProviderCredential()
{
    if (m_pszIdentifier)
    {
        CoTaskMemFree(m_pszIdentifier);
        m_pszIdentifier = NULL;
    }
    if (m_pszPassword)
    {
        RtlSecureZeroMemory(m_pszPassword, wcslen(m_pszPassword) * sizeof(wchar_t));
        CoTaskMemFree(m_pszPassword);
        m_pszPassword = NULL;
    }
    if (m_pszStatusText)
    {
        CoTaskMemFree(m_pszStatusText);
        m_pszStatusText = NULL;
    }
}

// IUnknown Implementation
IFACEMETHODIMP NKBCredentialProviderCredential::QueryInterface(REFIID riid, void** ppv)
{
    static const QITAB qit[] = {
        QITABENT(NKBCredentialProviderCredential, ICredentialProviderCredential),
        { 0 },
    };
    return QISearch(this, qit, riid, ppv);
}

IFACEMETHODIMP_(ULONG) NKBCredentialProviderCredential::AddRef()
{
    return InterlockedIncrement(&m_cRef);
}

IFACEMETHODIMP_(ULONG) NKBCredentialProviderCredential::Release()
{
    ULONG cRef = InterlockedDecrement(&m_cRef);
    if (cRef == 0) delete this;
    return cRef;
}

// ICredentialProviderCredential Implementation
IFACEMETHODIMP NKBCredentialProviderCredential::Advise(ICredentialProviderCredentialEvents* pcpce)
{
    if (m_pPCE) m_pPCE->Release();
    m_pPCE = pcpce;
    if (m_pPCE) m_pPCE->AddRef();
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::UnAdvise()
{
    if (m_pPCE)
    {
        m_pPCE->Release();
        m_pPCE = NULL;
    }
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::SetSelected(BOOL* pbAutoLogon)
{
    *pbAutoLogon = FALSE;
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::SetDeselected()
{
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetFieldState(
    DWORD dwFieldID,
    CREDENTIAL_PROVIDER_FIELD_STATE* pcpfs,
    CREDENTIAL_PROVIDER_FIELD_INTERACTIVE_STATE* pcpfis)
{
    *pcpfis = CPFIS_NONE;

    switch (dwFieldID)
    {
    case NKB_FIELD_BRANDING_LABEL:
    case NKB_FIELD_IDENTIFIER_LABEL:
    case NKB_FIELD_IDENTIFIER_INPUT:
    case NKB_FIELD_PASSWORD_INPUT:
    case NKB_FIELD_SUBMIT_BUTTON:
        *pcpfs = CPFS_DISPLAY_IN_BOTH;
        break;
    case NKB_FIELD_STATUS_LABEL:
        *pcpfs = (m_pszStatusText && wcslen(m_pszStatusText) > 0) ? CPFS_DISPLAY_IN_BOTH : CPFS_HIDDEN;
        break;
    default:
        *pcpfs = CPFS_HIDDEN;
        break;
    }
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetStringValue(DWORD dwFieldID, PWSTR* ppsz)
{
    *ppsz = NULL;
    switch (dwFieldID)
    {
    case NKB_FIELD_BRANDING_LABEL:
        return SHStrDupW(L"NKB MANUFACTURING", ppsz);
    case NKB_FIELD_IDENTIFIER_LABEL:
        return SHStrDupW(L"NKB Email / ID Number", ppsz);
    case NKB_FIELD_IDENTIFIER_INPUT:
        return SHStrDupW(m_pszIdentifier ? m_pszIdentifier : L"", ppsz);
    case NKB_FIELD_PASSWORD_INPUT:
        return SHStrDupW(m_pszPassword ? m_pszPassword : L"", ppsz);
    case NKB_FIELD_STATUS_LABEL:
        return SHStrDupW(m_pszStatusText ? m_pszStatusText : L"", ppsz);
    default:
        return E_INVALIDARG;
    }
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetBitmapValue(DWORD dwFieldID, HBITMAP* phbmp)
{
    *phbmp = NULL;
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetCheckboxValue(DWORD dwFieldID, BOOL* pbChecked, PWSTR* ppszLabel)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetSubmitButtonValue(DWORD dwFieldID, DWORD* pdwAdjacentTo)
{
    if (dwFieldID == NKB_FIELD_SUBMIT_BUTTON)
    {
        *pdwAdjacentTo = NKB_FIELD_PASSWORD_INPUT;
        return S_OK;
    }
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetComboBoxValueCount(DWORD dwFieldID, DWORD* pcItems, DWORD* pdwSelectedItem)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetComboBoxValueAt(DWORD dwFieldID, DWORD dwItem, PWSTR* ppszItem)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::SetStringValue(DWORD dwFieldID, PCWSTR psz)
{
    switch (dwFieldID)
    {
    case NKB_FIELD_IDENTIFIER_INPUT:
        if (m_pszIdentifier) CoTaskMemFree(m_pszIdentifier);
        return SHStrDupW(psz, &m_pszIdentifier);
    case NKB_FIELD_PASSWORD_INPUT:
        if (m_pszPassword)
        {
            RtlSecureZeroMemory(m_pszPassword, wcslen(m_pszPassword) * sizeof(wchar_t));
            CoTaskMemFree(m_pszPassword);
        }
        return SHStrDupW(psz, &m_pszPassword);
    default:
        return S_OK;
    }
}

IFACEMETHODIMP NKBCredentialProviderCredential::SetCheckboxValue(DWORD dwFieldID, BOOL bChecked)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::SetComboBoxSelectedValue(DWORD dwFieldID, DWORD dwSelectedItem)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::CommandLinkClicked(DWORD dwFieldID)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProviderCredential::GetUserSid(PWSTR* ppszSid)
{
    *ppszSid = NULL;
    return E_NOTIMPL;
}

// -----------------------------------------------------------------------------
// Authentication Flow: NKB REST API Verification + LSASS Serialization
// -----------------------------------------------------------------------------
IFACEMETHODIMP NKBCredentialProviderCredential::GetSerialization(
    CREDENTIAL_PROVIDER_GET_SERIALIZATION_RESPONSE* pcpgsr,
    CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs,
    PWSTR* ppszOptionalStatusText,
    CREDENTIAL_PROVIDER_STATUS_ICON* pcpsiStatusIcon)
{
    *pcpgsr = CPGSR_NO_CREDENTIAL_FINISHED;
    *ppszOptionalStatusText = NULL;
    *pcpsiStatusIcon = CPSI_NONE;

    if (!m_pszIdentifier || wcslen(m_pszIdentifier) == 0 ||
        !m_pszPassword || wcslen(m_pszPassword) == 0)
    {
        SHStrDupW(L"Please enter your NKB Email or Employee ID and password.", ppszOptionalStatusText);
        *pcpsiStatusIcon = CPSI_ERROR;
        return S_OK;
    }

    // Retrieve Local Computer Hostname
    wchar_t szComputerName[MAX_COMPUTERNAME_LENGTH + 1] = { 0 };
    DWORD dwCompSize = ARRAYSIZE(szComputerName);
    GetComputerNameW(szComputerName, &dwCompSize);

    // Query Registry for API Endpoint Configuration
    std::wstring apiHost = L"login.nkbmanufacturing.com";
    int apiPort = 443;
    bool useHttps = true;

    HKEY hKey = NULL;
    if (RegOpenKeyExW(HKEY_LOCAL_MACHINE, L"SOFTWARE\\NKB Manufacturing\\CredentialProvider", 0, KEY_READ, &hKey) == ERROR_SUCCESS)
    {
        wchar_t szHost[256] = { 0 };
        DWORD cbHost = sizeof(szHost);
        if (RegQueryValueExW(hKey, L"ApiHost", NULL, NULL, (LPBYTE)szHost, &cbHost) == ERROR_SUCCESS && wcslen(szHost) > 0)
        {
            apiHost = szHost;
        }

        DWORD dwPort = 0;
        DWORD cbPort = sizeof(dwPort);
        if (RegQueryValueExW(hKey, L"ApiPort", NULL, NULL, (LPBYTE)&dwPort, &cbPort) == ERROR_SUCCESS && dwPort > 0)
        {
            apiPort = (int)dwPort;
        }

        DWORD dwHttps = 0;
        DWORD cbHttps = sizeof(dwHttps);
        if (RegQueryValueExW(hKey, L"UseHttps", NULL, NULL, (LPBYTE)&dwHttps, &cbHttps) == ERROR_SUCCESS)
        {
            useHttps = (dwHttps != 0);
        }
        RegCloseKey(hKey);
    }

    // Step 1: Execute NKB REST API Authentication Verification Request
    HttpClient client(apiHost, (INTERNET_PORT)apiPort, useHttps);
    AuthResponse authRes = client.AuthenticateUser(m_pszIdentifier, m_pszPassword, szComputerName);

    if (!authRes.success)
    {
        SHStrDupW(authRes.error_message.c_str(), ppszOptionalStatusText);
        *pcpsiStatusIcon = CPSI_ERROR;

        if (m_pszStatusText) CoTaskMemFree(m_pszStatusText);
        SHStrDupW(authRes.error_message.c_str(), &m_pszStatusText);

        if (m_pPCE)
        {
            m_pPCE->SetFieldState(this, NKB_FIELD_STATUS_LABEL, CPFS_DISPLAY_IN_BOTH);
            m_pPCE->SetFieldString(this, NKB_FIELD_STATUS_LABEL, authRes.error_message.c_str());
        }
        return S_OK;
    }

    // Store mapped Windows credentials for LSASS serialization
    m_windowsDomain = authRes.windows_domain;
    m_windowsUsername = authRes.windows_username;
    m_authenticated = true;

    // Package KERB_INTERACTIVE_LOGON structure for LSASS
    ULONG ulPackageId = 0;
    HANDLE hLsa = NULL;
    NTSTATUS status = LsaConnectUntrusted(&hLsa);
    if (status == 0 && hLsa)
    {
        LSA_STRING pkgName;
        pkgName.Buffer = (PCHAR)NEGOSSP_NAME_A; // "Negotiate" handles local & domain accounts
        pkgName.Length = (USHORT)strlen(pkgName.Buffer);
        pkgName.MaximumLength = pkgName.Length + 1;
        LsaLookupAuthenticationPackage(hLsa, &pkgName, &ulPackageId);
        LsaDeregisterLogonProcess(hLsa);
    }

    // Calculate buffer size with relative offsets
    DWORD cbDomain = (DWORD)(m_windowsDomain.length() * sizeof(wchar_t));
    DWORD cbUser = (DWORD)(m_windowsUsername.length() * sizeof(wchar_t));
    DWORD cbPassword = (DWORD)(wcslen(m_pszPassword) * sizeof(wchar_t));

    DWORD cbSerialization = (DWORD)(sizeof(KERB_INTERACTIVE_LOGON) + cbDomain + sizeof(wchar_t) + cbUser + sizeof(wchar_t) + cbPassword + sizeof(wchar_t));
    BYTE* pBuffer = (BYTE*)CoTaskMemAlloc(cbSerialization);

    if (!pBuffer)
    {
        return E_OUTOFMEMORY;
    }

    RtlZeroMemory(pBuffer, cbSerialization);
    KERB_INTERACTIVE_LOGON* pLogon = (KERB_INTERACTIVE_LOGON*)pBuffer;
    pLogon->MessageType = KerbInteractiveLogon;

    BYTE* pbOffset = pBuffer + sizeof(KERB_INTERACTIVE_LOGON);

    // 1. LogonDomainName (Offset relative to start of pBuffer)
    pLogon->LogonDomainName.Length = (USHORT)cbDomain;
    pLogon->LogonDomainName.MaximumLength = (USHORT)(cbDomain + sizeof(wchar_t));
    pLogon->LogonDomainName.Buffer = (PWSTR)(pbOffset - pBuffer);
    if (cbDomain > 0)
    {
        memcpy(pbOffset, m_windowsDomain.c_str(), cbDomain);
    }
    pbOffset += (cbDomain + sizeof(wchar_t));

    // 2. UserName (Offset relative to start of pBuffer)
    pLogon->UserName.Length = (USHORT)cbUser;
    pLogon->UserName.MaximumLength = (USHORT)(cbUser + sizeof(wchar_t));
    pLogon->UserName.Buffer = (PWSTR)(pbOffset - pBuffer);
    if (cbUser > 0)
    {
        memcpy(pbOffset, m_windowsUsername.c_str(), cbUser);
    }
    pbOffset += (cbUser + sizeof(wchar_t));

    // 3. Password (Offset relative to start of pBuffer)
    pLogon->Password.Length = (USHORT)cbPassword;
    pLogon->Password.MaximumLength = (USHORT)(cbPassword + sizeof(wchar_t));
    pLogon->Password.Buffer = (PWSTR)(pbOffset - pBuffer);
    if (cbPassword > 0)
    {
        memcpy(pbOffset, m_pszPassword, cbPassword);
    }

    // Return Credential Serialization
    pcpcs->clsidCredentialProvider = CLSID_NKBCredentialProvider;
    pcpcs->ulAuthenticationPackage = ulPackageId;
    pcpcs->cbSerialization = cbSerialization;
    pcpcs->rgbSerialization = pBuffer;

    *pcpgsr = CPGSR_RETURN_CREDENTIAL_FINISHED;
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProviderCredential::ReportResult(
    NTSTATUS ntsStatus,
    NTSTATUS ntsSubstatus,
    PWSTR* ppszOptionalStatusText,
    CREDENTIAL_PROVIDER_STATUS_ICON* pcpsiStatusIcon)
{
    *ppszOptionalStatusText = NULL;
    *pcpsiStatusIcon = CPSI_NONE;

    if (ntsStatus != 0) // STATUS_SUCCESS = 0
    {
        SHStrDupW(L"Windows Authentication failed. Please check Windows local/domain account mapping.", ppszOptionalStatusText);
        *pcpsiStatusIcon = CPSI_ERROR;
    }
    return S_OK;
}
