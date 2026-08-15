#pragma once

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#ifndef SECURITY_WIN32
#define SECURITY_WIN32
#endif

#include <windows.h>
#include <strsafe.h>
#include <credentialprovider.h>
#include <ntsecapi.h>
#include <security.h>
#include <winhttp.h>
#include <string>

// Field IDs for NKB Credential Provider UI Tile
enum NKB_FIELD_ID
{
    NKB_FIELD_BRANDING_LABEL = 0,   // "NKB MANUFACTURING" Header Label
    NKB_FIELD_IDENTIFIER_LABEL = 1, // "NKB Email / ID Number" Label
    NKB_FIELD_IDENTIFIER_INPUT = 2, // Text Input Box (Email or Employee ID)
    NKB_FIELD_PASSWORD_INPUT = 3,   // Password Input Box
    NKB_FIELD_SUBMIT_BUTTON = 4,    // [ Sign In ] Push Button
    NKB_FIELD_STATUS_LABEL = 5,     // Error / Status Message
    NKB_FIELD_MAX = 6
};

// Helper macro for safely zeroing memory containing credentials
#define SAFE_ZERO_MEMORY(ptr, size) \
    if ((ptr) != NULL && (size) > 0) { \
        RtlSecureZeroMemory((ptr), (size)); \
    }
