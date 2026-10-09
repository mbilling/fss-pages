/*
 * FSS site data. Edit numbers and tools here, not in app.js.
 * Every benchmark figure comes from the fss-mqtt-broker README / docs/benchmarks
 * (single-node comparison 2026-09-16/17, scale-out 2026-09-26, durable 2026-09-30).
 */
window.FSS = {
  suite: [
    { phase: 'OPERATE · OBSERVE', name: 'fss-mqtt', status: 'available', href: 'https://github.com/mbilling/fss-mqtt',
      desc: 'Keyboard-driven MQTT v5 explorer. Several brokers at once, filter 100k topics in milliseconds, JSON, raw or hex. Static 1 MB binary for Linux, macOS, Windows.' },
    { phase: 'INSTALL · RUN', name: 'mqttd broker', status: 'available', href: 'https://github.com/mbilling/fss-mqtt-broker',
      desc: 'Security-first, cluster-native MQTT 3.1.1 + 5.0 broker in Rust. Quorum-replicated sessions, TLS 1.3, WebSocket and QUIC, Helm chart and Kubernetes operator.' },
    { phase: 'CONNECT', name: 'mqtt-bridge', status: 'available', href: 'https://github.com/mbilling/fss-mqtt-broker',
      desc: 'Signed bridge between zones and sites: deny-by-default directional rules, loop prevention, bounded spool, HA pairs. Plus config converters from Mosquitto, EMQX and HiveMQ.' },
    { phase: 'PLAN', name: 'Sizing planner', status: 'planned', href: '#tco',
      desc: 'From devices and message rates to node count, memory and monthly cost, built on the published benchmark data.' },
    { phase: 'TEST', name: 'Load lab', status: 'planned', href: '#scale',
      desc: 'Reproducible load ladders against your own cluster, graded GREEN, YELLOW or RED with the same rules as the published runs.' },
    { phase: 'LEARN', name: 'Playground', status: 'planned', href: '#flow',
      desc: 'A broker and live simulated plant in the browser: publish, subscribe, kill a node and watch nothing get lost.' },
    { phase: 'OPERATE · AI', name: 'AI ops agent', status: 'planned', href: '#top',
      desc: 'An assistant that reads metrics, audit trail and admin CLI to explain incidents and propose fixes. Every action stays a reviewable command.' }
  ],

  // Single-node knee, msg/s at p99 <= 1 s (QoS 0, 200 B, Hetzner CCX23)
  bench: [
    { name: 'mqttd', ver: '1.0.17', val: 75000, ours: true },
    { name: 'Mosquitto', ver: '2.0.20', val: 45000 },
    { name: 'EMQX', ver: '5.8.6', val: 45000 },
    { name: 'HiveMQ CE', ver: '2024.3', val: 30000 }
  ],

  // Share delivered within 10 ms at 45,000 msg/s
  latency: [
    { name: 'mqttd', pct: 97.8, ours: true },
    { name: 'Mosquitto', pct: 30.6 },
    { name: 'EMQX', pct: 14.9 },
    { name: 'HiveMQ CE', pct: 0.4 }
  ],

  // TCO model: msg/s per 4-vCPU node
  tco: {
    defaultPrice: 86,   // EUR/month, Hetzner CCX23 list after June 2026 repricing — verify before relying on it
    minNodes: 3,        // HA minimum
    workloads: {
      q0: {
        label: 'QoS 0 telemetry', mqttd: 114000,
        others: [
          { name: 'EMQX 5.8', per: 45000, note: 'Same-host knee, scaled linearly. Clustering under BSL licence: add its cost.' },
          { name: 'HiveMQ', per: 30000, note: 'CE knee, scaled linearly. CE is single-node; clustering is commercial.' },
          { name: 'Mosquitto 2.0', per: 45000, single: true, note: 'Single-threaded and no clustering: one node tops out near 45k msg/s.' }
        ]
      },
      q1: {
        label: 'QoS 1, clean', mqttd: 39000,
        others: [
          { name: 'Others', per: 0, note: 'No like-for-like published QoS 1 clean-session cluster data to compare against.' }
        ]
      },
      dur: {
        label: 'Durable QoS 1', mqttd: 30000,
        others: [
          { name: 'HiveMQ 4.18', per: 11250, note: 'Published 2,812 msg/s per vCPU, durable, 2 copies, same CPU family. Commercial licence extra.' }
        ]
      }
    }
  },

  // "Switch from" section. Savings are computed live in app.js from tco above
  // (tcoName must match a tco.workloads[*].others[].name). Facts trace to bench/latency
  // above and the feature comparison (docs/COMPARISON.md, 2026-08-19).
  switchFrom: {
    emqx: {
      label: 'EMQX', tcoName: 'EMQX 5.8', lic: 'BSL 1.1 clustering',
      facts: [
        ['1.7×', 'throughput on the same 4-vCPU host', '75k vs 45k msg/s at p99 ≤ 1 s'],
        ['97.8%', 'delivered within 10 ms at 45k msg/s', 'EMQX: 14.9%'],
        ['€0', 'licence for clustering', 'EMQX 6.x clusters under BSL 1.1']
      ],
      steps: [
        ['Convert', 'The built-in EMQX converter turns your config and ACLs into a reviewed mqttd draft.'],
        ['Bridge', 'Run mqtt-bridge between EMQX and mqttd with deny-by-default rules, and move site by site.'],
        ['Cut over', 'Point devices at mqttd. Drop the bridge when the last site has moved.']
      ],
      keep: 'Staying on EMQX makes sense if you rely on its dashboard, SQL rule engine or MQTT-SN/CoAP gateways.'
    },
    hivemq: {
      label: 'HiveMQ', tcoName: 'HiveMQ', durName: 'HiveMQ 4.18', lic: 'Commercial clustering',
      facts: [
        ['2.5×', 'throughput vs HiveMQ CE, same host', '75k vs 30k msg/s at p99 ≤ 1 s'],
        ['2.7×', 'durable QoS 1 per vCPU vs HiveMQ 4.18', '7,500 vs ~2,800, 2 copies, same CPU'],
        ['€0', 'licence for clustering', 'HiveMQ CE is single-node; clustering is commercial']
      ],
      steps: [
        ['Convert', 'The built-in HiveMQ converter turns your config and ACLs into a reviewed mqttd draft.'],
        ['Bridge', 'Run mqtt-bridge between HiveMQ and mqttd with deny-by-default rules, and move site by site.'],
        ['Cut over', 'Point devices at mqttd. Drop the bridge when the last site has moved.']
      ],
      keep: 'HiveMQ has published 100–200M-connection runs; mqttd is measured to 50k connections and has no production users yet.'
    }
  }
};
