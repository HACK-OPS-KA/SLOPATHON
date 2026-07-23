#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <cstdio>

static HHOOK g_hook = NULL;
static HANDLE g_exit_event = NULL;

static const int VK_E = 0x45;

static BOOL IsExitCombo() {
    return (GetAsyncKeyState(VK_CONTROL) & 0x8000) &&
           (GetAsyncKeyState(VK_MENU) & 0x8000) &&
           (GetAsyncKeyState(VK_SHIFT) & 0x8000) &&
           (GetAsyncKeyState(VK_E) & 0x8000);
}

static LRESULT CALLBACK HookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode < 0) {
        return CallNextHookEx(g_hook, nCode, wParam, lParam);
    }

    if ((wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) && IsExitCombo()) {
        SetEvent(g_exit_event);
        return CallNextHookEx(g_hook, nCode, wParam, lParam);
    }

    return 1;
}

int main() {
    g_exit_event = CreateEventA(NULL, TRUE, FALSE, NULL);
    if (!g_exit_event) return 1;

    g_hook = SetWindowsHookExW(WH_KEYBOARD_LL, HookProc, GetModuleHandleW(NULL), 0);
    if (!g_hook) {
        CloseHandle(g_exit_event);
        return 1;
    }

    fprintf(stdout, "READY\n");
    fflush(stdout);

    MSG msg;
    HANDLE handles[2] = { g_exit_event };
    DWORD wait;

    do {
        wait = MsgWaitForMultipleObjects(1, handles, FALSE, INFINITE, QS_ALLINPUT);
        if (wait == WAIT_OBJECT_0) {
            fprintf(stdout, "EXIT\n");
            fflush(stdout);
            break;
        }
        while (PeekMessageW(&msg, NULL, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) break;
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    } while (wait != WAIT_FAILED);

    if (g_hook) {
        UnhookWindowsHookEx(g_hook);
        g_hook = NULL;
    }
    CloseHandle(g_exit_event);
    return 0;
}
