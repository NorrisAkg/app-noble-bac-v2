import { buildE164Phone } from '../utils/phone';

describe('buildE164Phone', () => {
  it('preserves leading zeros for UEMOA mobile numbers (CI/SN/BJ)', () => {
    expect(buildE164Phone('+225', '07000001')).toBe('+22507000001');
    expect(buildE164Phone('+221', '77000002')).toBe('+22177000002');
    expect(buildE164Phone('+229', '90000004')).toBe('+22990000004');
  });

  it('strips whitespace, dashes, parentheses and dots', () => {
    expect(buildE164Phone('+225', '07 00 00 01')).toBe('+22507000001');
    expect(buildE164Phone('+225', '07-00-00-01')).toBe('+22507000001');
    expect(buildE164Phone('+225', '(07) 00.00.01')).toBe('+22507000001');
  });

  it('returns input as-is if already in E.164 (+ prefix)', () => {
    expect(buildE164Phone('+225', '+22507000001')).toBe('+22507000001');
    expect(buildE164Phone('+221', '+22177000002')).toBe('+22177000002');
  });

  it('converts the 00<dial> notation to + form', () => {
    expect(buildE164Phone('+225', '0022507000001')).toBe('+22507000001');
  });

  it('handles dial prefix typed without the +', () => {
    expect(buildE164Phone('+225', '22507000001')).toBe('+22507000001');
  });

  it('does NOT strip a legitimate leading 0 (regression test)', () => {
    // Le bug originel : `phone.replace(/^0+/, '')` transformait 07000001 en
    // 7000001, produisant +2257000001 (11 chars) au lieu de +22507000001 (12).
    const result = buildE164Phone('+225', '07000001');
    expect(result).not.toBe('+2257000001');
    expect(result).toBe('+22507000001');
  });
});
