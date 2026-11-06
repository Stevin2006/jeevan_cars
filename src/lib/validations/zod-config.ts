import { z } from "zod";

// Our CSP forbids eval. Without this, Zod probes `new Function("")` on first use
// to decide whether to JIT-compile validators, which logs a CSP violation.
z.config({ jitless: true });
