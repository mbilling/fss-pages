/*
 * FSS site data. Edit numbers and tools here, not in app.js.
 * Current figures: fss-mqtt-broker docs/benchmarks/EVIDENCE.md (dated 2026-11-04),
 * RIG2-RESULTS.md and data/headline.csv (rig of ADR 0090; v1.3.0 and its candidate,
 * 2026-10-27 .. 2026-11-07). A figure is the run's maximum lossless step unless noted.
 * "Earlier rig" figures (single-node comparison 2026-09-16) come from
 * SINGLE-NODE-COMPARISON.md; the broker repo keeps them as a record and says they are
 * not comparable with the current rig, so they are never mixed with current figures here.
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

  // Durable QoS 1 per vCPU, 2 copies (EVIDENCE.md "Node size"; headline.csv durable-per-vcpu)
  perVcpu: [
    { name: 'mqttd', ver: '4-vCPU nodes · 3 × CCX23', val: 11900, ours: true },
    { name: 'mqttd', ver: '16-vCPU nodes · 6 × m6i.4xlarge', val: 4066, ours: true },
    { name: 'mqttd', ver: "32-vCPU nodes · HiveMQ's shape", val: 3816, ours: true },
    { name: 'HiveMQ 4.18', ver: 'published · 3 × m6a.8xlarge', val: 2812 }
  ],

  // Earlier rig: single-node knee, msg/s at p99 <= 1 s (QoS 0, 200 B, Hetzner CCX23, 2026-09-16)
  bench: [
    { name: 'mqttd', ver: '1.0.17', val: 75000, ours: true },
    { name: 'Mosquitto', ver: '2.0.20', val: 45000 },
    { name: 'EMQX', ver: '5.8.6', val: 45000 },
    { name: 'HiveMQ CE', ver: '2024.3', val: 30000 }
  ],

  // Earlier rig: share delivered within 10 ms at 45,000 msg/s
  latency: [
    { name: 'mqttd', pct: 97.8, ours: true },
    { name: 'Mosquitto', pct: 30.6 },
    { name: 'EMQX', pct: 14.9 },
    { name: 'HiveMQ CE', pct: 0.4 }
  ],

  // TCO model. Price basis is the broker repo's: AWS m6a.8xlarge on-demand, us-east-1, Linux,
  // $1.3824/h for 32 vCPU = $31.54 per vCPU-month (730 h), the instance HiveMQ's run used.
  // mqttd: curve = [nodes, maximum lossless msg/s] on nodes of `vcpu` each; app.js interpolates
  // between measured points and extrapolates past the last on the curve's least-squares slope
  // (labelled when used), unless the workload sets extrapolate: false. Competitor: msg/s per vCPU, drawn straight through its one published
  // point, as EVIDENCE.md does; licence not included.
  tco: {
    defaultPrice: 1.3824 * 730 / 32,
    minNodes: 3,
    defaultWl: 'dur',
    workloads: {
      dur: {
        label: 'Durable QoS 1', vcpu: 4, node: 'Hetzner CCX23',
        // EVIDENCE.md: 3 nodes 142,800 (v1.3.0, ack p99 64.7 ms); 10 nodes 292,200 (candidate, ack p99 1.37 s)
        curve: [[3, 142800], [10, 292200]],
        // Per-node rate falls 3 -> 10 nodes in this workload (EVIDENCE.md), so no line past 10.
        extrapolate: false,
        desc: "Thousands of small publishers into persistent $share groups; ack after fsync and a quorum copy. HiveMQ 4.18's benchmark workload.",
        others: [
          { name: 'HiveMQ 4.18', perVcpu: 2812.5, note: 'Published 270,000 msg/s on 3 × 32 vCPU, 2 copies; not reproduced by us, payload not published. Drawn straight through its one point. Clustering licence extra, price not published.' }
        ]
      },
      plant: {
        label: 'Durable QoS 1, site bridges', vcpu: 16, node: 'AWS m6i.4xlarge',
        // README "Add a node, add 165k msg/s" (v1.3.0, 2026-11-06/07). 12 nodes ran on c6in.4xlarge
        // (same CPU, network-optimised card) and is a floor: the generators' 2M ceiling.
        curve: [[3, 495800], [5, 826300], [8, 1322000], [12, 2000000]],
        desc: 'Each site one bridge connection carrying 250 topics into one durable $share historian group. 12 nodes is a floor (the load generators\' ceiling).',
        others: []
      },
      q1: {
        label: 'QoS 1, clean', vcpu: 4, node: 'Hetzner CCX23',
        // EVIDENCE.md: 3 nodes 270,800 (ack p99 3.31 s); 10 nodes 875,900 (ack p99 4.54 s)
        curve: [[3, 270800], [10, 875900]],
        desc: 'QoS 1 both ways, no persistent session. Maximum lossless steps ran at ack p99 3–5 s; at p99 ≤ 1 s, 152,000 and 303,800.',
        others: []
      },
      q0: {
        label: 'QoS 0', vcpu: 4, node: 'Hetzner CCX23',
        // EVIDENCE.md: 3 nodes 340,300 (p99 2.52 s); 10 nodes 973,200 (p99 4.49 s)
        curve: [[3, 340300], [10, 973200]],
        desc: 'Fire and forget. Maximum lossless steps ran at end-to-end p99 2.5–4.5 s; at p99 ≤ 1 s, 253,200 and 506,300.',
        others: []
      }
    }
  },

  // "Switch from" section. Savings are computed live in app.js from tco above
  // (cmp = the tco.workloads[*].others[].name this competitor is priced from).
  switchFrom: {
    hivemq: {
      label: 'HiveMQ', cmp: 'HiveMQ 4.18', lic: 'Commercial clustering',
      facts: [
        ['1.36×', "durable msg/s on HiveMQ's own shape, 3 × 32 vCPU", '366,300 vs 270,000 published · v1.3.0 · no loss'],
        ['4.2×', 'durable QoS 1 per vCPU on 4-vCPU nodes', '11,900 vs 2,812 · 2 copies · same CPU family'],
        ['$0', 'licence for clustering', 'HiveMQ CE is single-node; clustering is commercial, price not published']
      ],
      steps: [
        ['Convert', 'The built-in HiveMQ converter turns your config and ACLs into a reviewed mqttd draft.'],
        ['Bridge', 'Run mqtt-bridge between HiveMQ and mqttd with deny-by-default rules, and move site by site.'],
        ['Cut over', 'Point devices at mqttd. Drop the bridge when the last site has moved.']
      ],
      keep: "HiveMQ's figure is its own: not reproduced, payload not published. HiveMQ has published 200M-connection runs; mqttd's runs used 7,200 to 20,000 connections, and mqttd has no production users yet."
    },
    emqx: {
      label: 'EMQX', lic: 'BSL 1.1 clustering',
      headline: 'and keep clustering free',
      sub: 'EMQX licenses production clustering under BSL 1.1 since 5.9. mqttd clusters, replicates sessions and runs its operator under Apache-2.0.',
      facts: [
        ['1.7×', 'single-node throughput on the same 4-vCPU host', '75k vs 45k msg/s QoS 0 · earlier rig, 2026-09-16'],
        ['97.8%', 'delivered within 10 ms at 45k msg/s', 'EMQX: 14.9% · earlier rig, same host'],
        ['$0', 'licence for clustering', 'EMQX 5.9+ clusters in production under BSL 1.1']
      ],
      noCost: 'No EMQX cluster has been measured on the current rig, so there is no like-for-like cost figure. The comparison above is the earlier single-node run, on one host, in sequence.',
      steps: [
        ['Convert', 'The built-in EMQX converter turns your config and ACLs into a reviewed mqttd draft.'],
        ['Bridge', 'Run mqtt-bridge between EMQX and mqttd with deny-by-default rules, and move site by site.'],
        ['Cut over', 'Point devices at mqttd. Drop the bridge when the last site has moved.']
      ],
      keep: 'Staying on EMQX makes sense if you rely on its dashboard, rule-engine data sinks or MQTT-SN/CoAP gateways.'
    }
  }
};
