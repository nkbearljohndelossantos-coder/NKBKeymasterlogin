#pragma once
#include "common.h"
#include "guid.h"
#include "NKBCredentialProviderCredential.h"

class NKBCredentialProvider : public ICredentialProvider
{
public:
    NKBCredentialProvider();
    ~NKBCredentialProvider();

    // IUnknown
    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv);
    IFACEMETHODIMP_(ULONG) AddRef();
    IFACEMETHODIMP_(ULONG) Release();

    // ICredentialProvider
    IFACEMETHODIMP SetUsageScenario(CREDENTIAL_PROVIDER_USAGE_SCENARIO cpus, DWORD dwFlags);
    IFACEMETHODIMP SetSerialization(const CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs);
    IFACEMETHODIMP SetUserArray(ICredentialProviderUserArray* users);

    IFACEMETHODIMP GetFieldDescriptorCount(DWORD* pdwCount);
    IFACEMETHODIMP GetFieldDescriptorAt(DWORD dwIndex, CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR** ppcpfd);

    IFACEMETHODIMP GetCredentialCount(DWORD* pdwCount, DWORD* pdwDefault, BOOL* pbAutoLogonWithDefault);
    IFACEMETHODIMP GetCredentialAt(DWORD dwIndex, ICredentialProviderCredential** ppcpc);

    IFACEMETHODIMP Advise(ICredentialProviderEvents* pcpe, UINT_PTR upRef);
    IFACEMETHODIMP UnAdvise();

private:
    LONG m_cRef;
    NKBCredentialProviderCredential* m_pCredential;
    CREDENTIAL_PROVIDER_USAGE_SCENARIO m_cpus;
};
