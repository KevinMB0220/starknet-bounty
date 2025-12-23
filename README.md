# Zylith Protocol

**Version**: 1.0 (MVP)
**Network**: Starknet
**Status**: Active Development

---

## Overview

Zylith is a privacy-preserving Concentrated Liquidity Market Maker (CLMM) built on Starknet. It combines the capital efficiency of concentrated liquidity with zero-knowledge privacy features, enabling users to trade and provide liquidity with complete privacy while maintaining the precision of traditional CLMMs.

### Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Concentrated Liquidity** | Ekubo-compatible CLMM with efficient capital utilization | ✅ Complete |
| **Privacy Layer** | ZK-proof-based private swaps and positions | ✅ Complete |
| **Commitment-based Ownership** | Cryptographic ownership instead of addresses | ✅ Complete |
| **Merkle Tree** | Poseidon BN254 tree for membership proofs (depth 25) | ✅ Complete |
| **Private Swaps** | Zero-knowledge verified swap execution | ✅ Complete |
| **Private LP Operations** | Privacy-preserving liquidity management | ✅ Complete |
| **Garaga Verifiers** | Groth16 proof verification on-chain | ✅ Complete (4 verifiers deployed) |
| **ASP Server** | Off-chain Merkle path reconstruction | ✅ Complete |
| **Circom Circuits** | ZK circuits for membership, swap, withdraw, LP | ✅ Complete |

---

## Project Structure

```
starknet-bounty/
├── README.md                    # This file - project overview
├── docs/                        # All documentation
│   ├── README.md               # Documentation index
│   ├── architecture/           # Architecture documentation
│   │   └── system-architecture.md
│   ├── api/                    # API documentation
│   │   └── api-reference.md
│   ├── reference/              # Reference documentation
│   │   ├── requirements.md
│   │   └── technology-stack.md
│   └── product/                # Product documentation
│       └── product-requirements.md
├── circuits/                    # Circom ZK circuits (root level)
│   ├── membership.circom
│   ├── swap.circom
│   ├── withdraw.circom
│   ├── lp.circom
│   └── out/                    # Generated verification keys
├── asp/                         # ASP server (Rust) - root level
│   ├── src/
│   │   ├── main.rs
│   │   ├── merkle.rs
│   │   └── syncer.rs
│   └── Cargo.toml
├── circuits-noir/              # Noir circuit implementation
└── zylith/                     # Main protocol implementation
    ├── src/                    # Cairo smart contracts
    │   ├── clmm/              # CLMM layer (math, ticks, swaps)
    │   ├── privacy/           # Privacy layer (Merkle tree, commitments)
    │   │   └── verifiers/     # Garaga-generated verifiers
    │   │       ├── membership/
    │   │       ├── swap/
    │   │       ├── withdraw/
    │   │       └── lp/
    │   └── zylith.cairo        # Main contract
    ├── tests/                  # Comprehensive test suite
    ├── scripts/                # Setup and deployment scripts
    └── docs/                   # Implementation documentation
        ├── DEPLOYMENT.md
        └── USAGE.md
```

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Scarb** | Latest | Cairo package manager |
| **Starknet Foundry** | 0.50.0+ | Testing framework |
| **Node.js** | 16+ | Circuit compilation |
| **Python** | 3.10+ | Garaga setup |

### Installation

```bash
# Clone the repository
git clone https://github.com/KevinMB0220/starknet-bounty.git
cd starknet-bounty/zylith

# Build contracts
scarb build

# Run tests
snforge test
```

### Running Tests

```bash
# Run all tests
scarb test

# Run specific test suite
snforge test test_clmm        # CLMM core tests
snforge test test_privacy     # Privacy layer tests
snforge test test_integration # Integration tests
```

---

## Implementation Status

### Core Components

| Component | Status | Test Coverage | Notes |
|-----------|--------|---------------|-------|
| **CLMM Engine** | ✅ Complete | 100% | Swap engine, tick management, liquidity - all tests passing |
| **Privacy Layer** | ✅ Complete | 100% | Merkle tree, commitments, nullifiers - all tests passing |
| **Integration Layer** | ✅ Complete | 100% | Private swaps, deposits, withdrawals - all tests passing |
| **ZK Circuits** | ✅ Complete | N/A | Circom circuits implemented, VKs generated |
| **Garaga Verifiers** | ✅ Complete | N/A | All 4 verifiers deployed on Sepolia |
| **ASP Server** | ✅ Complete | N/A | Rust server with Merkle path reconstruction |

### Test Results

| Test Suite | Tests Passing | Total Tests | Status |
|------------|--------------|-------------|--------|
| **Privacy Tests** | 12/12 | 12 | ✅ All Passing |
| **CLMM Tests** | 15/15 | 15 | ✅ All Passing |
| **Integration Tests** | 8/8 | 8 | ✅ All Passing |
| **E2E Proof Tests** | 4/4 | 4 | ✅ All Passing |
| **Zylith Contract Tests** | 5/5 | 5 | ✅ All Passing |
| **Overall** | **44/44** | **44** | **✅ 100% Passing** |

---

## Documentation

### Core Documentation

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| **[System Architecture](docs/architecture/system-architecture.md)** | System architecture and design | Developers, Architects |
| **[API Reference](docs/api/api-reference.md)** | Complete API documentation | Integrators, Developers |
| **[Product Requirements](docs/product/product-requirements.md)** | Product requirements document | Stakeholders, Product Team |
| **[Requirements](docs/reference/requirements.md)** | System requirements | Developers, Product Team |
| **[Technology Stack](docs/reference/technology-stack.md)** | Technology stack reference | Developers |
| **[Implementation Guide](zylith/README.md)** | Implementation guide | Developers |

### Quick Links

- **Documentation Index**: See [docs/README.md](docs/README.md)
- **Architecture**: See [docs/architecture/system-architecture.md](docs/architecture/system-architecture.md)
- **API Reference**: See [docs/api/api-reference.md](docs/api/api-reference.md)
- **Setup Guide**: See [docs/reference/technology-stack.md](docs/reference/technology-stack.md)
- **Testing**: See [zylith/README.md](zylith/README.md#testing)
- **Deployment**: See [zylith/docs/DEPLOYMENT.md](zylith/docs/DEPLOYMENT.md)

---

## Roadmap

### Phase 1: MVP (✅ Complete)

- ✅ Core CLMM implementation (100% test coverage)
- ✅ Privacy layer with ZK proofs (100% test coverage)
- ✅ Garaga verifier integration (all 4 verifiers deployed)
- ✅ ASP server implementation
- ✅ Circom circuits and VK generation
- ✅ Integration layer (private swaps, LP operations) - 100% test coverage
- ✅ Test framework - **All 44 tests passing (100%)**

### Phase 2: Production Readiness (In Progress)

| Task | Status | Target Date |
|------|--------|-------------|
| Garaga verifier integration | ✅ Complete | Deployed on Sepolia |
| ASP server implementation | ✅ Complete | Rust server functional |
| Test coverage | ✅ Complete | **100% - All 44 tests passing** |
| Security hardening | 🔄 In Progress | Q1 2026 |
| Documentation completion | ✅ Complete | Updated |

### Phase 3: Testnet Deployment (✅ In Progress)

- ✅ Deploy to Starknet Sepolia testnet
- ✅ All contracts deployed and verified
- 🔄 Public testing period
- 🔄 Bug bounty program
- 🔄 Community feedback integration

### Phase 4: Mainnet Launch (Planned)

- Security audits (2x independent)
- Mainnet deployment
- Monitoring and support infrastructure
- Production ASP deployment

---

## Contributing

We welcome contributions from the community. Before contributing, please:

1. Review the [System Architecture](docs/architecture/system-architecture.md) to understand the system design
2. Check the [API Reference](docs/api/api-reference.md) for API specifications
3. Follow Cairo coding standards and style guides
4. Ensure all tests pass before submitting
5. Update documentation for any API changes

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
scarb build
scarb test

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# Open pull request
```

---

## Community and Support

### Resources

| Resource | Link | Purpose |
|----------|------|---------|
| **Documentation** | [docs/README.md](docs/README.md) | Complete docs index |
| **GitHub Issues** | GitHub Issues | Bug reports, feature requests |
| **Architecture** | [docs/architecture/system-architecture.md](docs/architecture/system-architecture.md) | System design |
| **API Reference** | [docs/api/api-reference.md](docs/api/api-reference.md) | API documentation |

### Contact

- **Technical Questions**: Open a GitHub issue
- **Security Issues**: Contact security team (see [Product Requirements](docs/product/product-requirements.md))
- **General Inquiries**: See [Documentation Index](docs/README.md)

---

## License

[License information to be added]

---

**Version**: 1.0 (MVP)
**Last Updated**: January 2025
**Maintained By**: Zylith Protocol Team

## Deployed Contracts (Sepolia)

### Main Contract
- **Zylith Contract**: `0x031b5bd7f4c436b53b17113028a3c3b903c928f5dad9dd80d34b425cf084c4c3`
  - [View on Starkscan](https://sepolia.starkscan.co/contract/0x031b5bd7f4c436b53b17113028a3c3b903c928f5dad9dd80d34b425cf084c4c3)

### Verifiers
- **Membership Verifier**: `0x066448de8e457554d16155f215386dc9c8052a5d99212586840494142aedc165`
- **Swap Verifier**: `0x0432a5184b4e187cf68a7c476c653528b7da14f6851de8c8e1ce76b1e1bb9e36`
- **Withdraw Verifier**: `0x037f7a9fed4daa5ec5ff69e5a101ccf40c219f6cb3c0cb081c64d34ac4a26ad0`
- **LP Verifier**: `0x0745acde8db05d4b4a49dc1f2cd313a3a8960e812d41d0b71ff90457f8ebbe7e`

For detailed deployment information, see `zylith/CONTRACT_ADDRESS.md`.

