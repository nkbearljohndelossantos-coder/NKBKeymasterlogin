#include "../include/NKBCredentialProviderCredential.h"
#include "../include/HttpClient.h"
#include <shlwapi.h>

#pragma comment(lib, "shlwapi.lib")

NKBCredentialProviderCredential::NKBCredentialProviderCredential()
    : m_cRef(1), m_pPCE(NULL), m_pszIdentifier(NULL), m_pszPassword(NULL),
      m_pszStatusText(NULL), m_windowsDomain(L"NKB"), m_windowsUsername(L""), m_authenticated(false)
{
}

NKBCredentialProviderCredential::~NKBCredentialProviderCredential()
{
    if (m_pszIdentifier) { CoTaskMemFree(m_pszIdentifier); m_pszIdentifier = NULL; }
    if (m_pszPassword)
    {
        SAFE_ZERO_MEMORY(m_pszPassword, wcslen(m_pszPassword) * sizeof(wchar_t));
        CoTaskMemFree(m_pszPassword);
        m_pszPassword = NULL;
    }
    if (m_pszStatusText) { CoTaskMemFree(m_pszStatusText); m_pszStatusText = NULL; }
    if (m_pPCE) { m_pPCE->Release(); m_pPCE = NULL; }
}

// IUnknown Implementation
IFACEMETHODIMP NKBCredentialProviderCredential::QueryInterface(REFIID riid, void** ppv)
{
    static const QITAB qit[] = {
        QITABENT(NKBCredentialProviderCredential, ICredentialProviderCredential),
        QITABENT(NKBCredentialProviderCredential, ICredentialProviderCredential2),
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

IFACEMETHODIMP NKBCredentialProviderCredential::SetDormant(BOOL bDormant)
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
        *pcpfs = CPFS_DISPLAY_IN_BOTH;
        break;
    case NKB_FIELD_IDENTIFIER_INPUT:
    case NKB_FIELD_PASSWORD_INPUT:
    case NKB_FIELD_SUBMIT_BUTTON:
        *pcpfs = CPFS_DISPLAY_IN_BOTH;
        *pcpfis = CPFIS_FOCUSED;
        break;
    case NKB_FIELD_STATUS_LABEL:
        *pcpfs = m_pszStatusText ? CPFS_DISPLAY_IN_BOTH : CPFS_HIDDEN;
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
    HRESULT hr = S_OK;

    switch (dwFieldID)
    {
    case NKB_FIELD_BRANDING_LABEL:
        hr = SHStrDupW(L"NKB MANUFACTURING", ppsz);
        break;
    case NKB_FIELD_IDENTIFIER_LABEL:
        hr = SHStrDupW(L"NKB Email / ID Number", ppsz);
        break;
    case NKB_FIELD_IDENTIFIER_INPUT:
        if (m_pszIdentifier) hr = SHStrDupW(m_pszIdentifier, ppsz);
        else hr = SHStrDupW(L"", ppsz);
        break;
    case NKB_FIELD_PASSWORD_INPUT:
        if (m_pszPassword) hr = SHStrDupW(m_pszPassword, ppsz);
        else hr = SHStrDupW(L"", ppsz);
        break;
    case NKB_FIELD_SUBMIT_BUTTON:
        hr = SHStrDupW(L"Sign In", ppsz);
        break;
    case NKB_FIELD_STATUS_LABEL:
        if (m_pszStatusText) hr = SHStrDupW(m_pszStatusText, ppsz);
        else hr = SHStrDupW(L"", ppsz);
        break;
    default:
        hr = E_INVALIDARG;
        break;
    }
    return hr;
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
    return E_INVALIDARG;
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
    HRESULT hr = S_OK;
    if (dwFieldID == NKB_FIELD_IDENTIFIER_INPUT)
    {
        if (m_pszIdentifier) CoTaskMemFree(m_pszIdentifier);
        hr = SHStrDupW(psz ? psz : L"", &m_pszIdentifier);
    }
    else if (dwFieldID == NKB_FIELD_PASSWORD_INPUT)
    {
        if (m_pszPassword)
        {
            SAFE_ZERO_MEMORY(m_pszPassword, wcslen(m_pszPassword) * sizeof(wchar_t));
            CoTaskMemFree(m_pszPassword);
        }
        hr = SHStrDupW(psz ? psz : L"", &m_pszPassword);
    }
    return hr;
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

IFACEMETHODIMP NKBCredentialProviderCredential::GetSerialization(
    CREDENTIAL_PROVIDER_GET_SERIALIZATION_RESPONSE* pcpgsr,
    CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs,
    PWSTR* ppszOptionalStatusText,
    CREDENTIAL_PROVIDER_STATUS_ICON* pcpsiStatusIcon)
{
    *pcpgsr = CPGSR_NO_CREDENTIAL_FINISHED;
    *ppszOptionalStatusText = NULL;
    *pcpsiStatusIcon = CPSI_NONE;

    if (!m_pszIdentifier || wcslen(m_pszIdentifier) == 0 || !m_pszPassword || wcslen(m_pszPassword) == 0)
    {
        SHStrDupW(L"Please enter both your NKB Email / ID Number and Password.", ppszOptionalStatusText);
        *pcpsiStatusIcon = CPSI_ERROR;
        return S_OK;
    }

    // Get current workstation computer name
    wchar_t computerName[MAX_COMPUTERNAME_LENGTH + 1] = { 0 };
    DWORD size = MAX_COMPUTERNAME_LENGTH + 1;
    GetComputerNameW(computerName, &size);

    // Call NKB Authentication API
    HttpClient client(L"127.0.0.1", 3000, false);
    AuthResponse authRes = client.AuthenticateUser(m_pszIdentifier, m_pszPassword, computerName);

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

    // Package MSV1_0_INTERACTIVE_LOGON structure for LSASS (LsaLogonUser)
    ULONG ulPackageId = 0;
    
    // Retrieve MSV1_0 Authentication Package ID from LSA
    HANDLE hLsa = NULL;
    LsaConnectUntrusted(&hLsa);
    if (hLsa)
    {
        LSA_STRING pkgName;
        pkgName.Buffer = (PCHAR)"MSV1_0";
        pkgName.Length = (USHORT)strlen(pkgName.Buffer);
        pkgName.MaximumLength = pkgName.Length + 1;
        LsaLookupAuthenticationPackage(hLsa, &pkgName, &ulPackageId);
        LsaDeregisterLogonProcess(hLsa);
    }

    // Allocate MSV1_0_INTERACTIVE_LOGON buffer
    size_t domainBytes = (m_windowsDomain.length() + 1) * sizeof(wchar_t);
    size_t userBytes = (m_windowsUsername.length() + 1) * sizeof(wchar_t);
    size_t passBytes = (wcslen(m_pszPassword) + 1) * sizeof(wchar_t);
    
    DWORD cbSerialization = (DWORD)(sizeof(MSV1_0_INTERACTIVE_LOGON) + domainBytes + userBytes + passBytes);
    BYTE* pBuffer = (BYTE*)CoTaskMemAlloc(cbSerialization);

    if (!pBuffer)
    {
        return E_OUTOFMEMORY;
    }

    RtlZeroMemory(pBuffer, cbSerialization);
    MSV1_0_INTERACTIVE_LOGON* pLogon = (MSV1_0_INTERACTIVE_LOGON*)pBuffer;
    pLogon->MessageType = MsV1_0InteractiveLogon;

    BYTE* pOffset = pBuffer + sizeof(MSV1_0_INTERACTIVE_LOGON);

    // Copy Domain
    memcpy(pOffset, m_windowsDomain.c_str(), domainBytes);
    pLogon->LogonDomainName.Buffer = (PWSTR)pOffset;
    pLogon->LogonDomainName.Length = (USHORT)(domainBytes - sizeof(wchar_t));
    pLogon->LogonDomainName.MaximumLength = (USHORT)domainBytes;
    pOffset += domainBytes;

    // Copy Username
    memcpy(pOffset, m_windowsUsername.c_str(), userBytes);
    pLogon->UserName.Buffer = (PWSTR)pOffset;
    pLogon->UserName.Length = (USHORT)(userBytes - sizeof(wchar_t));
    pLogon->UserName.MaximumLength = (USHORT)userBytes;
    pOffset += userBytes;

    // Copy Password
    memcpy(pOffset, m_pszPassword, passBytes);
    pLogon->Password.Buffer = (PWSTR)pOffset;
    pLogon->Password.Length = (USHORT)(passBytes - sizeof(wchar_t));
    pLogon->Password.MaximumLength = (USHORT)passBytes;

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

IFACEMETHODIMP NKBCredentialProviderCredential::GetUserSid(PWSTR* ppszSid)
{
    *ppszSid = NULL;
    return E_NOTIMPL;
}
