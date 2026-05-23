const os = require('os')

// CPU count abstraction used to size worker pools and pMap concurrency
// across the build pipeline. Exposes two distinct knobs by design:
//
//   - `logical`  : total schedulable threads. Used for I/O-bound or
//                  coordinating work (e.g. dispatching jobs to workers,
//                  awaiting native sharp/libvips callbacks). See
//                  lib/build.js, lib/workers/image-processor.js.
//
//   - `physical` : approximation of physical cores. Used where each unit
//                  of work saturates a core and SMT siblings would just
//                  contend (e.g. numWorkers for jest-worker forks running
//                  sharp, GraphQL execution on the main JS thread). See
//                  lib/workers/index.js, lib/app/build/executeQueries.js.
//
// Previously this used the `physical-cpu-count` package to read the true
// physical core count. That package is unmaintained and we removed it as
// part of the Node 22 bump. `os.availableParallelism()` (Node >=18.14)
// replaces it but reports *logical* CPUs — with the upside of honoring
// cgroups / CPU affinity, which matters in containerized CI.
//
// To preserve the two-tier semantics without the old dep, we derive
// `physical` as `availableParallelism() / 2`, assuming SMT-2 (the common
// case on x86 and Apple Silicon performance cores). This is an
// approximation:
//   - On non-SMT hardware (some ARM, E-cores only) we under-report by 2x,
//     leaving capacity on the table but not over-subscribing.
//   - On a cgroup-limited container with N logical CPUs allocated, we
//     scale to N/2 workers, which matches the spirit of the original
//     (don't oversubscribe the cores we were given).
// Both failure modes are safe; the prior package could also under-report
// in containers since it read /proc/cpuinfo without cgroup awareness.
//
// Override via GRIDMIX_CPU_COUNT env var if the heuristic is wrong for
// a given deployment.

const parallelism = os.availableParallelism()
const override = parseInt(process.env.GRIDMIX_CPU_COUNT, 10)

module.exports = {
  cpus: {
    logical: Number.isFinite(override) ? override : parallelism,
    physical: Number.isFinite(override) ? override : Math.max(1, Math.floor(parallelism / 2))
  }
}
