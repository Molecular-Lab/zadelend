# ZadeLend

> Privacy-Preserving Cross-Chain Collateralized Lending Protocol

## Overview

ZadeLend enables users to **deposit NFT collateral on Ethereum** and **withdraw private loans on any networks** without revealing the connection between the two transactions.

### The Problem

Traditional DeFi lending protocols expose your entire financial history on-chain. When you deposit collateral and take a loan, anyone can trace:
- Which wallet deposited assets
- How much was borrowed
- When withdrawals occurred

This transparency creates privacy risks, especially for high-value transactions.

### The Solution

ZadeLend uses **Zero-Knowledge proofs** combined with **Chainlink CCIP** to break the on-chain link between deposits and withdrawals:

1. **Deposit** your assets on the **source network** with a cryptographic commitment
2. **Bridge** only the commitment (not your identity) via CCIP to the destination network
3. **Withdraw** your loan on the **destination network** using a ZK proof that validates ownership without revealing which deposit is yours

![Architecture Diagram](web/public/zeadlend-calidraw.png)

## Key Features

- **Cross-Chain Liquidity**: Collateralize assets on source network, borrow on destination network
- **Privacy-Preserving Withdrawals**: ZK proofs unlink deposits from withdrawals
- **Proof-Based Ownership**: Cryptographic verification without identity exposure
- **NFT Collateral Support**: Lock NFTs for a configurable period (default: 7 days)
- **Nullifier Protection**: Prevents double-spending with on-chain nullifier tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  SOURCE NETWORK                       DESTINATION NETWORK
  ┌──────────────────┐                 ┌──────────────────┐
  │                  │   Chainlink     │                  │
  │  NFTDepositor    │     CCIP        │  LoanWithdrawer  │
  │                  │ ───────────────>│                  │
  │  - Lock Assets   │  (commitment)   │  - Merkle Tree   │
  │  - Generate      │                 │  - ZK Verifier   │
  │    commitment    │                 │  - Loan Payouts  │
  │                  │                 │                  │
  └──────────────────┘                 └──────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
  ┌──────────────────┐                 ┌──────────────────┐
  │ commitment =     │                 │ Prove:           │
  │ Poseidon(        │                 │ - Know secret    │
  │   secret[0],     │                 │ - Commitment in  │
  │   secret[1],     │                 │   Merkle tree    │
  │   loanAmount     │                 │ - Valid nullifier│
  │ )                │                 │                  │
  └──────────────────┘                 └──────────────────┘
```

### Flow Summary

1. **Deposit Phase (Source Network)**
   - User approves and deposits assets into `NFTDepositor`
   - Contract locks assets for a configurable period
   - User provides commitment: `Poseidon(secret[0], secret[1], loanAmount)`
   - Commitment bridged to destination network via Chainlink CCIP

2. **Commitment Bridging (CCIP)**
   - Only the 32-byte commitment crosses chains
   - No identity or wallet information is transmitted
   - `LoanWithdrawer` receives and inserts commitment into Merkle tree

3. **Withdrawal Phase (Destination Network)**
   - User generates ZK proof off-chain proving knowledge of:
     - Secret values that hash to a commitment in the Merkle tree
     - The loan amount embedded in the commitment
   - Contract verifies proof and releases loan funds
   - Nullifier prevents double-withdrawal

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Circuits** | Circom 2.1.6 + snarkjs | ZK proof generation & verification |
| **ZK Proof** | Groth16 + Poseidon Hash | Efficient on-chain verification |
| **Contracts** | Solidity 0.8.24 | Smart contract logic |
| **Cross-Chain** | Chainlink CCIP | Secure message bridging |
| **Frontend** | Next.js 15 + React 19 | Web application |
| **Wallet** | Wagmi + RainbowKit | Wallet connection |
| **Merkle Tree** | fixed-merkle-tree | Off-chain tree computation |

## Project Structure

```
zadelend-mono/
├── circuit/                    # ZK Circuit Implementation
│   ├── circuits/
│   │   ├── withdraw.circom     # Main withdrawal circuit
│   │   ├── merkleTreeInclusionProof.circom
│   │   └── selector.circom
│   ├── proof-source/           # Generated proving artifacts
│   ├── contracts/              # Generated Solidity verifier
│   └── Makefile                # Circuit build commands
│
├── contract/                   # Smart Contracts
│   ├── contracts/
│   │   ├── NFTDepositor.sol    # Source: Asset locking + CCIP sender
│   │   ├── LoanWithdrawer.sol  # Destination: ZK verification + loan payouts
│   │   ├── MerkleTreeWithHistory.sol
│   │   ├── Groth16Verifier.sol # Generated from circuit
│   │   └── tokens/             # Test tokens (NFT, USDC)
│   └── hardhat.config.ts
│
└── web/                        # Frontend Application
    ├── src/
    │   ├── app/                # Next.js app router
    │   ├── components/         # React components
    │   ├── lib/                # Utilities & contract configs
    │   └── store/              # Zustand state management
    └── public/
        └── zeadlend-calidraw.png
```

## Deployed Contracts (Testnet Demo)

### Source Network (Sepolia)

| Contract | Address |
|----------|---------|
| Test NFT | [`0x4B9D25236B30F01edF4D539ae8BDB04CcE029c75`](https://sepolia.etherscan.io/address/0x4B9D25236B30F01edF4D539ae8BDB04CcE029c75) |
| Test USDC | [`0xB58f04f651CDd8be01D3eA3266266Ce640C48C61`](https://sepolia.etherscan.io/address/0xB58f04f651CDd8be01D3eA3266266Ce640C48C61) |
| NFTDepositor | [`0x12B92D38c380F66f64fA2909E967B386b22CB07A`](https://sepolia.etherscan.io/address/0x12B92D38c380F66f64fA2909E967B386b22CB07A) |

### Destination Network (Scroll Sepolia)

| Contract | Address |
|----------|---------|
| LoanWithdrawer | [`0xf3BbAE47ef0e4A5C2AD77C9e49C9C2d65a0E0554`](https://sepolia.scrollscan.com/address/0xf3BbAE47ef0e4A5C2AD77C9e49C9C2d65a0E0554) |
| Test USDC | [`0x3832f87b02724D953e08906CaF3C73d84Ef08570`](https://sepolia.scrollscan.com/address/0x3832f87b02724D953e08906CaF3C73d84Ef08570) |

## Quick Start

### Prerequisites

- Node.js >= 18
- Circom 2.1.6 ([installation guide](https://docs.circom.io/getting-started/installation/))
- snarkjs (`npm install -g snarkjs`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd zadelend-mono

# Install circuit dependencies
cd circuit
npm install

# Install contract dependencies
cd ../contract
npm install

# Install web dependencies
cd ../web
npm install  # or pnpm install
```

### Build Circuit (Required for ZK Proofs)

```bash
cd circuit

# Full circuit build (compile → powers of tau → zkey → verifier)
make c-full

# Or step by step:
make c-com       # Compile circuit to R1CS + WASM
make c-p1        # Powers of tau ceremony (phase 1)
make c-p2        # Contribute to ceremony (phase 2)
make c-final     # Prepare phase 2
make zkey        # Generate proving key
make vkey        # Generate verification key
make gen-con     # Generate Solidity verifier
```

### Compile Contracts

```bash
cd contract

# Create .env file with your keys
echo "PRIVATE_KEY=your_private_key_here
SEPOLIA=https://sepolia.infura.io/v3/your_key
SCROLL=https://sepolia-rpc.scroll.io" > .env

# Compile
npx hardhat compile
```

### Run Frontend

```bash
cd web

# Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

## How It Works

### 1. Deposit (Source Network)

```solidity
// User generates secret off-chain
secret = [random1, random2]
loanAmount = 100  // loan amount

// Compute commitment
commitment = Poseidon(secret[0], secret[1], loanAmount)

// Deposit assets with commitment
depositor.depositNft(assetAddress, tokenId, destinationReceiver, commitment)
```

### 2. CCIP Bridging

The `NFTDepositor` sends a CCIP message containing only the commitment to the destination network:

```solidity
// CCIP message payload
data: abi.encode(commitment)  // Just 32 bytes - no identity info
```

### 3. Commitment Storage (Destination Network)

`LoanWithdrawer` receives the commitment and inserts it into a Merkle tree:

```solidity
function _ccipReceive(Any2EVMMessage memory message) internal {
    bytes32 commitment = abi.decode(message.data, (bytes32));
    uint leafIndex = _insert(commitment);  // Add to Merkle tree
}
```

### 4. Withdrawal (Destination Network)

User generates a ZK proof off-chain and submits to withdraw:

```solidity
function loanWithdraw(
    bytes32 nullifier,      // Prevents double-spend
    bytes32 _root,          // Merkle root
    uint[2] _pA,            // Groth16 proof
    uint[2][2] _pB,
    uint[2] _pC,
    uint[1] _pubSignals     // [loanAmount]
) external {
    require(!nullifiers[nullifier], "Already withdrawn");
    require(isKnownRoot(_root), "Invalid root");
    require(verifier.verifyProof(_pA, _pB, _pC, _pubSignals));

    usdc.transfer(msg.sender, loanAmount);
    nullifiers[nullifier] = true;
}
```

### The ZK Circuit

```circom
template Withdraw(N) {
    signal input root;
    signal input nullifier;
    signal input secret[2];
    signal input loanAmount;
    signal input pathElements[N];
    signal input pathIndices[N];
    signal output publicLoanAmount;

    // Verify commitment = Poseidon(secret[0], secret[1], loanAmount)
    component commitmentHash = Poseidon(3);
    commitmentHash.inputs[0] <== secret[0];
    commitmentHash.inputs[1] <== secret[1];
    commitmentHash.inputs[2] <== loanAmount;

    // Nullifier must match commitment
    nullifier === commitmentHash.out;

    // Prove commitment is in Merkle tree
    component merkle = MerkleTreeInclusionProof(N);
    merkle.leaf <== commitmentHash.out;
    // ... path verification ...

    root === merkle.root;
    publicLoanAmount <== loanAmount;
}
```

## Challenges & Solutions

### Cross-Chain Privacy with Correctness
**Challenge**: How to prove ownership across chains without revealing identity?
**Solution**: Bridge only cryptographic commitments via CCIP, verify ownership with ZK proofs on the destination chain.

### Custom Merkle Tree Implementation
**Challenge**: Standard Merkle trees don't support the specific insertion pattern needed for commitment tracking.
**Solution**: Implemented `MerkleTreeWithHistory` with a fixed-height tree and root history for asynchronous proof generation.

### Nullifier Reuse Prevention
**Challenge**: Users could potentially reuse proofs to withdraw multiple times.
**Solution**: Nullifier = commitment hash. Once used, it's marked on-chain and cannot be reused.

### ERC-20 Allowance with ZK Proofs
**Challenge**: Integrating token transfers with ZK verification flow.
**Solution**: Loan contract holds USDC liquidity; verification gate precedes transfer.

## Security Considerations

### Cryptographic Security
- **Poseidon Hash**: ZK-friendly hash function with proven security properties
- **Groth16**: Trusted setup ceremony required; production would use multi-party ceremony
- **Nullifier Binding**: Nullifier = commitment prevents proof replay

### Trust Assumptions
- **Chainlink CCIP**: Trusted for cross-chain message delivery
- **Merkle Root History**: Contract stores last 100 roots to handle async proof generation

### Known Limitations
- **Hackathon Scope**: Circuit uses small tree depth (N=2) for demo purposes
- **Liquidity**: Loan contract must be pre-funded with USDC
- **Collateral Valuation**: Fixed loan amounts; production would integrate oracles

## Contributing

This project was built for ETHGlobal hackathon. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT

---

Built with ZK proofs and Chainlink CCIP
