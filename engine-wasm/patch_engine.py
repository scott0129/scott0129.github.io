#!/usr/bin/env python3
"""Patch a checkout of Adam-Kulju/Patricia so it builds as a single-threaded,
embeddable WebAssembly module. Usage: patch_engine.py <patricia-checkout> <nets_c_out>

Changes (all in the build copy, upstream is untouched):
  * nnue.h   - nets come from a generated C file instead of INCBIN (.incbin
               is not supported when targeting wasm)
  * fathom   - Syzygy tablebase probing replaced by a stub (no files in a browser)
  * utils.h  - no-op std::thread / mutex / condition_variable shims
  * uci.h    - the read-stdin loop becomes uci_init() + uci_handle(line), and
               searches run synchronously instead of on a std::thread
"""
import pathlib, sys, re

root = pathlib.Path(sys.argv[1]) / "engine"
nets_out = pathlib.Path(sys.argv[2])
src = root / "src"


def sub(path, old, new, count=1):
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"patch target not found in {path.name}: {old[:60]!r}")
    path.write_text(text.replace(old, new, count))


# --- nnue.h -------------------------------------------------------------
nnue = src / "nnue.h"
text = nnue.read_text()
text = re.sub(
    r'INCBIN\(nnue, "nets/fingolfin.nnue"\);\s*INCBIN\(nnue2, "nets/finarfin.nnue"\);\s*INCBIN\(nnue3, "nets/feanor.nnue"\);',
    'extern "C" const unsigned char g_nnueData[];\n'
    'extern "C" const unsigned char g_nnue2Data[];\n'
    'extern "C" const unsigned char g_nnue3Data[];',
    text,
)
assert "extern \"C\" const unsigned char g_nnueData" in text
nnue.write_text(text)

# --- generated nets -------------------------------------------------------
with nets_out.open("w") as f:
    for sym, name in (("g_nnueData", "fingolfin"), ("g_nnue2Data", "finarfin"), ("g_nnue3Data", "feanor")):
        data = (root / "nets" / f"{name}.nnue").read_bytes()
        f.write(f"__attribute__((aligned(64))) const unsigned char {sym}[{len(data)}] = {{\n")
        for i in range(0, len(data), 40):
            f.write(",".join(str(b) for b in data[i:i + 40]) + ",\n")
        f.write("};\n")

# --- fathom stub ------------------------------------------------------------
(src / "fathom" / "src").mkdir(parents=True, exist_ok=True)
(src / "fathom" / "src" / "tbprobe.h").write_text("""#pragma once
#include <cstdint>
typedef unsigned TbResult;
#define TB_RESULT_FAILED 0xFFFFFFFFu
#define TB_LOSS 0u
#define TB_WIN 4u
static unsigned TB_LARGEST = 0;
static inline bool tb_init(const char *) { return false; }
static inline TbResult tb_probe_wdl(uint64_t, uint64_t, uint64_t, uint64_t,
                                    uint64_t, uint64_t, uint64_t, uint64_t,
                                    unsigned, unsigned, unsigned, bool) {
  return TB_RESULT_FAILED;
}
""")

# --- thread shims ----------------------------------------------------------
sub(src / "utils.h", "#include <condition_variable>\n", '#include "wasm_threads.h"\n')
sub(src / "utils.h", "#include <mutex>\n", "")
sub(src / "utils.h", "#include <thread>\n", "")
(src / "wasm_threads.h").write_text("""#pragma once
// The browser build runs one search at a time on a Web Worker, so the thread
// primitives only need to exist, not do anything. (libc++ ships unique_lock
// for single-threaded targets but not mutex / condition_variable / thread.)
#include <chrono>
#include <functional>
#include <__mutex/unique_lock.h>
namespace std {
struct mutex {
  void lock() {}
  void unlock() {}
  bool try_lock() { return true; }
};
struct condition_variable {
  void notify_all() {}
  void notify_one() {}
  template <class L, class P> void wait(L &, P) {}
  template <class L> void wait(L &) {}
};
struct thread {
  thread() = default;
  template <class F, class... A> thread(F &&, A &&...) {}
  bool joinable() const { return false; }
  void join() {}
};
namespace this_thread {
inline void yield() {}
// Skill levels pad their moves with a sleep; the web UI adds its own delay.
template <class R, class P> inline void sleep_for(const chrono::duration<R, P> &) {}
}
}
""")

# --- uci.h -----------------------------------------------------------------
uci = src / "uci.h"
sub(uci, """  if (thread_info.is_human) {
    s = std::thread(search_human, std::ref(position), std::ref(thread_info));
  }

  else {
    s = std::thread(search_position, std::ref(position), std::ref(thread_info),
                    std::ref(TT));
  }""", """  (void)s;
  if (thread_info.is_human) {
    search_human(position, thread_info);
  }

  else {
    search_position(position, thread_info, TT);
  }""")
sub(uci, "void uci(ThreadInfo &thread_info, Position &position) {",
    "void uci_init(ThreadInfo &thread_info, Position &position) {")
sub(uci, """  std::string input;

  std::thread s;

  while (getline(std::cin, input)) {
""", """}

static std::thread s;

// Handles one UCI command line (the body of the original stdin loop).
void uci_handle(const std::string &input, ThreadInfo &thread_info,
                Position &position) {
  {
""")
sub(uci, "        continue;\n      }\n\n      else if (name == \"SyzygyPath\")",
         "        return;\n      }\n\n      else if (name == \"SyzygyPath\")")

# --- entry point ------------------------------------------------------------
(root / "wasm_entry.cpp").write_text("""#include "src/search.h"
#include "src/uci.h"
#include <memory>

static Position g_position;
static std::unique_ptr<ThreadInfo> g_thread_info;
static char g_input[8192];

extern "C" {
// JS writes a NUL-terminated UCI command here, then calls patricia_command().
__attribute__((export_name("patricia_input"))) char *patricia_input() {
  return g_input;
}

__attribute__((export_name("patricia_init"))) void patricia_init() {
  g_thread_info = std::make_unique<ThreadInfo>();
  init_LMR();
  init_bbs();
  uci_init(*g_thread_info, g_position);
}

__attribute__((export_name("patricia_command"))) void patricia_command() {
  uci_handle(std::string(g_input), *g_thread_info, g_position);
}
}
""")
print("patched OK")
