import { describe, it, expect } from 'vitest';
import { shortenAddress } from '../utils/stellar';

describe('stellar utils', () => {
  describe('shortenAddress', () => {
    it('shortens a standard Stellar address', () => {
      const address = 'GBVM5MJUKE2LAQWE6EKPBMYBHJGIORVXK6SN7HVXJ42OMJHIMVDK2WLK';
      expect(shortenAddress(address)).toBe('GBVM5M...2WLK');
    });

    it('returns empty string for null/undefined', () => {
      expect(shortenAddress('')).toBe('');
      // @ts-ignore
      expect(shortenAddress(null)).toBe('');
    });

    it('handles short strings correctly (though unlikely for valid addresses)', () => {
      expect(shortenAddress('ABC')).toBe('ABC...ABC');
    });
  });
});
