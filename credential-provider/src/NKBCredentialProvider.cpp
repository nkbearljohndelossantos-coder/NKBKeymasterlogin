#include "../include/NKBCredentialProvider.h"
#include <shlwapi.h>

#pragma comment(lib, "shlwapi.lib")

NKBCredentialProvider::NKBCredentialProvider()
    : m_cRef(1), m_pCredential(NULL), m_cpus(CPUS_LOGON)
{
    m_pCredential = new NKBCredentialProviderCredential();
}

NKBCredentialProvider::~NKBCredentialProvider()
{
    if (m_pCredential)
    {
        m_pCredential->Release();
        m_pCredential = NULL;
    }
}

// IUnknown Implementation
IFACEMETHODIMP NKBCredentialProvider::QueryInterface(REFIID riid, void** ppv)
{
    static const QITAB qit[] = {
        QITABENT(NKBCredentialProvider, ICredentialProvider),
        { 0 },
    };
    return QISearch(this, qit, riid, ppv);
}

IFACEMETHODIMP_(ULONG) NKBCredentialProvider::AddRef()
{
    return InterlockedIncrement(&m_cRef);
}

IFACEMETHODIMP_(ULONG) NKBCredentialProvider::Release()
{
    ULONG cRef = InterlockedDecrement(&m_cRef);
    if (cRef == 0) delete this;
    return cRef;
}

// ICredentialProvider Implementation
IFACEMETHODIMP NKBCredentialProvider::SetUsageScenario(CREDENTIAL_PROVIDER_USAGE_SCENARIO cpus, DWORD dwFlags)
{
    switch (cpus)
    {
    case CPUS_LOGON:
    case CPUS_UNLOCK_WORKSTATION:
        m_cpus = cpus;
        return S_OK;
    default:
        return E_NOTIMPL;
    }
}

IFACEMETHODIMP NKBCredentialProvider::SetSerialization(const CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs)
{
    return E_NOTIMPL;
}

IFACEMETHODIMP NKBCredentialProvider::SetUserArray(ICredentialProviderUserArray* users)
{
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProvider::GetFieldDescriptorCount(DWORD* pdwCount)
{
    *pdwCount = NKB_FIELD_MAX;
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProvider::GetFieldDescriptorAt(DWORD dwIndex, CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR** ppcpfd)
{
    if (dwIndex >= NKB_FIELD_MAX || !ppcpfd) return E_INVALIDARG;

    CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR* pcpfd = (CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR*)CoTaskMemAlloc(sizeof(CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR));
    if (!pcpfd) return E_OUTOFMEMORY;

    RtlZeroMemory(pcpfd, sizeof(CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR));
    pcpfd->dwFieldID = dwIndex;

    switch (dwIndex)
    {
    case NKB_FIELD_BRANDING_LABEL:
        pcpfd->cpft = CPFT_LARGE_TEXT;
        SHStrDupW(L"NKB Manufacturing", &pcpfd->pszLabel);
        break;
    case NKB_FIELD_IDENTIFIER_LABEL:
        pcpfd->cpft = CPFT_SMALL_TEXT;
        SHStrDupW(L"NKB Email / ID Number", &pcpfd->pszLabel);
        break;
    case NKB_FIELD_IDENTIFIER_INPUT:
        pcpfd->cpft = CPFT_EDIT_TEXT;
        SHStrDupW(L"Enter NKB Email or Employee ID", &pcpfd->pszLabel);
        break;
    case NKB_FIELD_PASSWORD_INPUT:
        pcpfd->cpft = CPFT_PASSWORD_TEXT;
        SHStrDupW(L"Password", &pcpfd->pszLabel);
        break;
    case NKB_FIELD_SUBMIT_BUTTON:
        pcpfd->cpft = CPFT_SUBMIT_BUTTON;
        SHStrDupW(L"Sign In", &pcpfd->pszLabel);
        break;
    case NKB_FIELD_STATUS_LABEL:
        pcpfd->cpft = CPFT_SMALL_TEXT;
        SHStrDupW(L"", &pcpfd->pszLabel);
        break;
    }

    *ppcpfd = pcpfd;
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProvider::GetCredentialCount(DWORD* pdwCount, DWORD* pdwDefault, BOOL* pbAutoLogonWithDefault)
{
    *pdwCount = 1;
    *pdwDefault = 0;
    *pbAutoLogonWithDefault = FALSE;
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProvider::GetCredentialAt(DWORD dwIndex, ICredentialProviderCredential** ppcpc)
{
    if (dwIndex != 0 || !ppcpc) return E_INVALIDARG;

    if (m_pCredential)
    {
        m_pCredential->AddRef();
        *ppcpc = m_pCredential;
        return S_OK;
    }
    return E_FAIL;
}

IFACEMETHODIMP NKBCredentialProvider::Advise(ICredentialProviderEvents* pcpe, UINT_PTR upRef)
{
    return S_OK;
}

IFACEMETHODIMP NKBCredentialProvider::UnAdvise()
{
    return S_OK;
}
