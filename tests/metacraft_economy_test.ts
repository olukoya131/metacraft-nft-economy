import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure that NFTs can be minted by contract owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'mint-nft', [
        types.ascii("Sword of Light"),
        types.ascii("A powerful magical sword"),
        types.ascii("ipfs://Qm..."),
        types.list([types.ascii("weapon"), types.ascii("magical")]),
        types.uint(100)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk();
    assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
  }
});

Clarinet.test({
  name: "Ensure that NFTs can be transferred between accounts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // First mint an NFT
    let mintBlock = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'mint-nft', [
        types.ascii("Sword of Light"),
        types.ascii("A powerful magical sword"),
        types.ascii("ipfs://Qm..."),
        types.list([types.ascii("weapon"), types.ascii("magical")]),
        types.uint(100)
      ], deployer.address)
    ]);
    
    // Then transfer it
    let transferBlock = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'transfer-nft', [
        types.uint(1),
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    transferBlock.receipts[0].result.expectOk();
    
    // Verify new owner
    let ownerBlock = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'get-token-owner', [
        types.uint(1)
      ], deployer.address)
    ]);
    
    assertEquals(
      ownerBlock.receipts[0].result.expectSome(),
      wallet1.address
    );
  }
});

Clarinet.test({
  name: "Ensure that NFTs can be bought with metacoin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // First mint an NFT
    let mintBlock = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'mint-nft', [
        types.ascii("Sword of Light"),
        types.ascii("A powerful magical sword"),
        types.ascii("ipfs://Qm..."),
        types.list([types.ascii("weapon"), types.ascii("magical")]),
        types.uint(100)
      ], deployer.address)
    ]);
    
    // Attempt to buy NFT
    let buyBlock = chain.mineBlock([
      Tx.contractCall('metacraft_economy', 'buy-nft', [
        types.uint(1)
      ], wallet1.address)
    ]);
    
    buyBlock.receipts[0].result.expectOk();
  }
});