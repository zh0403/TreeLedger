import os
import sys
import solcx
from pathlib import Path
from web3 import Web3

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CONTRACT_FILE = ROOT_DIR / "contracts" / "TreeLedgerAudit.sol"
ENV_FILE = Path(__file__).resolve().parent / ".env"

RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc"
PRIVATE_KEY = os.environ.get("PRIVATE_KEY") or "e628275ea9fa7bb1c82037faa09e5d9b0f57a778b54380a62a3c50db120b7aca"


def main():
    print(f"Reading contract from: {CONTRACT_FILE}")
    with open(CONTRACT_FILE, "r", encoding="utf-8") as f:
        source_code = f.read()

    print("Compiling TreeLedgerAudit.sol with solc 0.8.20...")
    compiled = solcx.compile_standard(
        {
            "language": "Solidity",
            "sources": {"TreeLedgerAudit.sol": {"content": source_code}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.8.20",
    )

    contract_data = compiled["contracts"]["TreeLedgerAudit.sol"]["TreeLedgerAudit"]
    abi = contract_data["abi"]
    bytecode = contract_data["evm"]["bytecode"]["object"]

    print("Connecting to Arbitrum Sepolia RPC...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("Failed to connect to Arbitrum Sepolia RPC")
        sys.exit(1)

    account = w3.eth.account.from_key(PRIVATE_KEY)
    balance = w3.from_wei(w3.eth.get_balance(account.address), "ether")
    print(f"Deployer account: {account.address}")
    print(f"Deployer balance: {balance} ETH")

    if balance == 0:
        print("Error: Account has 0 ETH. Please fund the wallet.")
        sys.exit(1)

    print("Constructing deployment transaction...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(account.address)

    latest_block = w3.eth.get_block("latest")
    base_fee = latest_block.get("baseFeePerGas", w3.eth.gas_price)
    max_priority_fee = w3.to_wei(0.1, "gwei")
    max_fee = int(base_fee * 2) + max_priority_fee

    deploy_tx = Contract.constructor().build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": 421614,
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": max_priority_fee,
        }
    )

    print(f"Estimated gas: {w3.eth.estimate_gas(deploy_tx)}")
    print("Signing deployment transaction...")
    signed_tx = w3.eth.account.sign_transaction(deploy_tx, private_key=PRIVATE_KEY)

    print("Broadcasting transaction to Arbitrum Sepolia...")
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction broadcasted! Tx Hash: {tx_hash.hex()}")
    print("Waiting for transaction receipt...")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    contract_address = receipt.contractAddress
    print(f"\n[SUCCESS] TreeLedgerAudit deployed to: {contract_address}")
    print(f"Block number: {receipt.blockNumber}")
    print(f"Gas used: {receipt.gasUsed}")
    print(f"Arbitrum Sepolia Explorer: https://sepolia.arbiscan.io/address/{contract_address}")

    # Update apps/api/.env with new contract address
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
        new_lines = []
        for line in lines:
            if line.startswith("CONTRACT_ADDRESS="):
                new_lines.append(f"CONTRACT_ADDRESS={contract_address}\n")
            else:
                new_lines.append(line)
        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"Updated CONTRACT_ADDRESS in {ENV_FILE}")

    return contract_address


if __name__ == "__main__":
    main()
