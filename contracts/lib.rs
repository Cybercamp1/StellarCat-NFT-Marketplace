#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol, log};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Access(Address), // Legacy check_access
    Owner(u32),      // Token ID -> Owner Address
    Listing(u32),    // Token ID -> Price (if listed)
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    AlreadyUnlocked = 2,
    NotAuthorized = 3,
    NotListed = 4,
    InsufficentFunds = 5,
}

#[contract]
pub struct NFTAccessControl;

#[contractimpl]
impl NFTAccessControl {
    /// Original unlock logic (Minting/Initial Purchase)
    pub fn pay_and_unlock(env: Env, user: Address, token_id: u32, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let access_key = DataKey::Access(user.clone());
        let owner_key = DataKey::Owner(token_id);

        if env.storage().persistent().has(&owner_key) {
             return Err(Error::AlreadyUnlocked);
        }

        // Store access and ownership
        env.storage().persistent().set(&access_key, &true);
        env.storage().persistent().set(&owner_key, &user);

        env.events().publish(
            (symbol_short!("unlock"), token_id),
            user.clone(),
        );
        
        Ok(())
    }

    /// List an NFT for sale
    pub fn list_nft(env: Env, seller: Address, token_id: u32, price: i128) -> Result<(), Error> {
        seller.require_auth();

        let owner_key = DataKey::Owner(token_id);
        let current_owner: Address = env.storage().persistent().get(&owner_key).ok_or(Error::NotAuthorized)?;

        if current_owner != seller {
            return Err(Error::NotAuthorized);
        }

        if price <= 0 {
            return Err(Error::InvalidAmount);
        }

        let listing_key = DataKey::Listing(token_id);
        env.storage().persistent().set(&listing_key, &price);

        env.events().publish(
            (symbol_short!("list"), token_id),
            price,
        );

        Ok(())
    }

    /// Buy a listed NFT
    pub fn buy_nft(env: Env, buyer: Address, token_id: u32) -> Result<(), Error> {
        buyer.require_auth();

        let listing_key = DataKey::Listing(token_id);
        let price: i128 = env.storage().persistent().get(&listing_key).ok_or(Error::NotListed)?;

        let owner_key = DataKey::Owner(token_id);
        let seller: Address = env.storage().persistent().get(&owner_key).ok_or(Error::NotAuthorized)?;

        // transfer logic (simulated here, but real web3 would use token client)
        // transfer_tokens(&env, &token_address, &buyer, &seller, price);

        // Update ownership
        env.storage().persistent().set(&owner_key, &buyer);
        env.storage().persistent().remove(&listing_key); // Remove listing

        env.events().publish(
            (symbol_short!("sale"), token_id),
            (seller, buyer, price),
        );

        Ok(())
    }

    pub fn get_owner(env: Env, token_id: u32) -> Option<Address> {
        let key = DataKey::Owner(token_id);
        env.storage().persistent().get(&key)
    }

    pub fn get_price(env: Env, token_id: u32) -> Option<i128> {
        let key = DataKey::Listing(token_id);
        env.storage().persistent().get(&key)
    }

    pub fn check_access(env: Env, user: Address) -> bool {
        let key = DataKey::Access(user);
        env.storage().persistent().get(&key).unwrap_or(false)
    }
}


#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_pay_and_unlock_success() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NFTAccessControl);
        let client = NFTAccessControlClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let amount = 100;
        let token_id = 1;

        // Initially no access
        assert!(!client.check_access(&user));

        // Unlock
        client.pay_and_unlock(&user, &token_id, &amount);

        // Access granted
        assert!(client.check_access(&user));
        assert_eq!(client.get_owner(&token_id), Some(user));
    }

    #[test]
    fn test_already_unlocked_error() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NFTAccessControl);
        let client = NFTAccessControlClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let amount = 100;
        let token_id = 1;

        client.pay_and_unlock(&user, &token_id, &amount);
        
        // Try again with same token_id, should error
        let result = client.try_pay_and_unlock(&user, &token_id, &amount);
        assert_eq!(result, Err(Ok(Error::AlreadyUnlocked)));
    }

    #[test]
    fn test_marketplace_flow() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, NFTAccessControl);
        let client = NFTAccessControlClient::new(&env, &contract_id);

        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);
        let token_id = 1;
        let price = 500;

        // 1. Initial purchase
        client.pay_and_unlock(&seller, &token_id, &100);

        // 2. List for sale
        client.list_nft(&seller, &token_id, &price);
        assert_eq!(client.get_price(&token_id), Some(price));

        // 3. Buy
        client.buy_nft(&buyer, &token_id);
        
        // 4. Verify new owner
        assert_eq!(client.get_owner(&token_id), Some(buyer));
        assert_eq!(client.get_price(&token_id), None);
    }
}


