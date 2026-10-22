import logging
import os
import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from web3 import Web3

load_dotenv()

logger = logging.getLogger(__name__)

ARBITRUM_SEPOLIA_CHAIN_ID = 421614
DEFAULT_ARBITRUM_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc"
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

TREE_LEDGER_AUDIT_ABI: List[Dict[str, Any]] = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "string",
                "name": "treeId",
                "type": "string",
            },
            {
                "indexed": False,
                "internalType": "string",
                "name": "actionType",
                "type": "string",
            },
            {
                "indexed": False,
                "internalType": "string",
                "name": "proofHash",
                "type": "string",
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256",
            },
            {
                "indexed": True,
                "internalType": "address",
                "name": "contractor",
                "type": "address",
            },
        ],
        "name": "MaintenanceLogged",
        "type": "event",
    },
    {
        "inputs": [
            {"internalType": "string", "name": "treeId", "type": "string"},
            {"internalType": "string", "name": "actionType", "type": "string"},
            {"internalType": "string", "name": "proofHash", "type": "string"},
        ],
        "name": "logMaintenance",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class AuditLogReceipt(BaseModel):
    tree_id: str
    action_type: str
    proof_hash: str = Field(..., description="0x-prefixed keccak256 hash of photographic proof payload")
    arbitrum_tx_hash: str = Field(..., description="0x-prefixed 32-byte transaction or audit record hash")
    record_hash: str = Field(..., description="0x-prefixed keccak256 audit digest matching TreeLedgerAudit.sol")
    block_number: Optional[int] = None
    chain_id: int = ARBITRUM_SEPOLIA_CHAIN_ID
    simulated: bool = Field(
        default=False,
        description="True when resilient local keccak256 fallback was used due to unavailable RPC/key",
    )


class Web3AuditService:
    """Arbitrum Sepolia smart contract client for TreeLedgerAudit.sol with resilient keccak256 fallback."""

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None,
        private_key: Optional[str] = None,
    ) -> None:
        self.rpc_url = (rpc_url or os.getenv("ARBITRUM_RPC_URL") or DEFAULT_ARBITRUM_SEPOLIA_RPC).strip()
        self.contract_address = (contract_address or os.getenv("CONTRACT_ADDRESS") or ZERO_ADDRESS).strip()
        self.private_key = (private_key or os.getenv("PRIVATE_KEY") or "").strip()
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 8}))

    @staticmethod
    def _is_usable_private_key(private_key: str) -> bool:
        if not private_key:
            return False
        normalized = private_key[2:] if private_key.startswith("0x") else private_key
        if len(normalized) != 64:
            return False
        try:
            int(normalized, 16)
            return int(normalized, 16) != 0
        except ValueError:
            return False

    @staticmethod
    def _is_usable_contract_address(address: str) -> bool:
        if not address or address.lower() == ZERO_ADDRESS.lower():
            return False
        return Web3.is_address(address)

    @staticmethod
    def compute_photo_proof_hash(
        before_photo_url: str,
        after_photo_url: str,
        contractor_id: Optional[str] = None,
    ) -> str:
        """Computes a 0x-prefixed keccak256 proofHash over the before/after photographic evidence."""
        payload = f"{before_photo_url.strip()}|{after_photo_url.strip()}|{(contractor_id or '').strip()}"
        digest = Web3.keccak(text=payload).hex()
        return digest if digest.startswith("0x") else f"0x{digest}"

    @staticmethod
    def compute_audit_record_hash(
        tree_id: str,
        action_type: str,
        proof_hash: str,
        timestamp: Optional[int] = None,
        contractor_address: str = ZERO_ADDRESS,
    ) -> str:
        """Mirrors TreeLedgerAudit.sol keccak256(abi.encodePacked(treeId, actionType, proofHash, timestamp, sender))."""
        ts = int(timestamp if timestamp is not None else time.time())
        checksum_sender = (
            Web3.to_checksum_address(contractor_address)
            if Web3.is_address(contractor_address)
            else Web3.to_checksum_address(ZERO_ADDRESS)
        )
        digest = Web3.solidity_keccak(
            ["string", "string", "string", "uint256", "address"],
            [tree_id, action_type, proof_hash, ts, checksum_sender],
        ).hex()
        return digest if digest.startswith("0x") else f"0x{digest}"

    def log_maintenance_on_chain(
        self,
        tree_id: str,
        action_type: str,
        before_photo_url: str,
        after_photo_url: str,
        contractor_id: Optional[str] = None,
        timestamp: Optional[int] = None,
    ) -> AuditLogReceipt:
        """Writes maintenance verification proof to Arbitrum Sepolia or falls back to deterministic keccak256."""
        ts = int(timestamp if timestamp is not None else time.time())
        proof_hash = self.compute_photo_proof_hash(
            before_photo_url=before_photo_url,
            after_photo_url=after_photo_url,
            contractor_id=contractor_id,
        )

        if self._is_usable_private_key(self.private_key) and self._is_usable_contract_address(self.contract_address):
            try:
                account = self.w3.eth.account.from_key(self.private_key)
                checksum_contract = Web3.to_checksum_address(self.contract_address)
                contract = self.w3.eth.contract(address=checksum_contract, abi=TREE_LEDGER_AUDIT_ABI)

                record_hash = self.compute_audit_record_hash(
                    tree_id=tree_id,
                    action_type=action_type,
                    proof_hash=proof_hash,
                    timestamp=ts,
                    contractor_address=account.address,
                )

                nonce = self.w3.eth.get_transaction_count(account.address, "pending")
                chain_id = self.w3.eth.chain_id or ARBITRUM_SEPOLIA_CHAIN_ID
                latest_block = self.w3.eth.get_block("latest")
                base_fee = latest_block.get("baseFeePerGas", self.w3.eth.gas_price)
                max_priority_fee = self.w3.to_wei(0.1, "gwei")
                max_fee = int(base_fee * 2) + max_priority_fee

                tx_func = contract.functions.logMaintenance(tree_id, action_type, proof_hash)
                try:
                    estimated_gas = tx_func.estimate_gas({"from": account.address})
                    gas_limit = int(estimated_gas * 1.3)
                except Exception:
                    gas_limit = 200_000

                unsigned_tx = tx_func.build_transaction(
                    {
                        "chainId": chain_id,
                        "from": account.address,
                        "nonce": nonce,
                        "gas": gas_limit,
                        "maxFeePerGas": max_fee,
                        "maxPriorityFeePerGas": max_priority_fee,
                    }
                )
                signed_tx = self.w3.eth.account.sign_transaction(unsigned_tx, private_key=self.private_key)
                raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction")
                tx_hash_bytes = self.w3.eth.send_raw_transaction(raw_tx)
                tx_hash_hex = tx_hash_bytes.hex()
                if not tx_hash_hex.startswith("0x"):
                    tx_hash_hex = f"0x{tx_hash_hex}"

                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=20)
                return AuditLogReceipt(
                    tree_id=tree_id,
                    action_type=action_type,
                    proof_hash=proof_hash,
                    arbitrum_tx_hash=tx_hash_hex,
                    record_hash=record_hash,
                    block_number=receipt.get("blockNumber"),
                    chain_id=chain_id,
                    simulated=False,
                )
            except Exception as exc:
                logger.warning(
                    "Arbitrum Sepolia RPC transaction failed, falling back to local keccak256 audit hash: %s",
                    exc,
                )

        fallback_record_hash = self.compute_audit_record_hash(
            tree_id=tree_id,
            action_type=action_type,
            proof_hash=proof_hash,
            timestamp=ts,
            contractor_address=ZERO_ADDRESS,
        )
        return AuditLogReceipt(
            tree_id=tree_id,
            action_type=action_type,
            proof_hash=proof_hash,
            arbitrum_tx_hash=fallback_record_hash,
            record_hash=fallback_record_hash,
            block_number=None,
            chain_id=ARBITRUM_SEPOLIA_CHAIN_ID,
            simulated=True,
        )


web3_audit_service = Web3AuditService()
