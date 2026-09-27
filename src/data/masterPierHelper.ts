import { PierMaster, PierSection, ContractorId, PierStatus } from '../types';

/**
 * Helper to determine section classification:
 * - 'Ramp': RAO* (Ramp Ancol Off/On), R*
 * - 'Frontage': RAF*, RSF* (Frontage Ancol/Sunter)
 * - 'Sisi Utara': ends with 'N' (P*N) or located on north carriageway
 * - 'Main Road Awal': P15S s/d P35S, P16N s/d P35N
 * - 'Sisi Selatan': P36S s/d P110S
 * - 'Main Road Akhir': P111S s/d P192S, P100N s/d P178N
 */
export function determinePierSection(pierNumber: string): PierSection {
  const p = pierNumber.toUpperCase().trim();
  
  // 1. Ramp & Frontage detection
  if (p.startsWith('RAF') || p.startsWith('RSF') || p.includes('FRONTAGE')) {
    return 'Frontage';
  }
  if (p.startsWith('RAO') || p.startsWith('RAMP') || p.startsWith('R-') || (p.startsWith('R') && !p.startsWith('RSF') && !p.startsWith('RAF'))) {
    return 'Ramp';
  }

  // 2. North alignment (Sisi Utara)
  if (p.endsWith('N') || p.includes('NU')) {
    return 'Sisi Utara';
  }

  // 3. Number parsing for Main Road Awal / Sisi Selatan / Main Road Akhir
  const numMatch = p.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num <= 35) {
      return 'Main Road Awal';
    } else if (num <= 110) {
      return 'Sisi Selatan';
    } else {
      return 'Main Road Akhir';
    }
  }

  return 'Sisi Selatan';
}

/**
 * Helper to assign appropriate zoneId based on section and pierNumber
 */
export function determinePierZone(pierNumber: string, section: PierSection): string {
  if (section === 'Ramp') return 'Z-RAMP';
  if (section === 'Frontage') return 'Z-FRONT';
  if (section === 'Sisi Utara') {
    const numMatch = pierNumber.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 1;
    return num <= 62 ? 'Z-1N' : 'Z-2N';
  }
  if (section === 'Main Road Awal') return 'Z-1S';
  if (section === 'Sisi Selatan') return 'Z-2S';
  if (section === 'Main Road Akhir') return 'Z-3S';
  return 'Z-2S';
}

/**
 * Generate coordinates sequentially along HBR II elevated alignment (Tanjung Priok - Pluit)
 */
export function generatePierCoordinates(pierNumber: string, section: PierSection, index: number): { lat: number; lng: number } {
  // Base line along Jakarta coastal toll corridor (~ -6.1260 to -6.1380, 106.8700 to 106.9300)
  const baseLat = -6.1265;
  const baseLng = 106.8720;
  
  const numMatch = pierNumber.match(/\d+/);
  const offsetIndex = numMatch ? parseInt(numMatch[0], 10) : index;

  let latOffset = (offsetIndex * 0.00015);
  let lngOffset = (offsetIndex * 0.00045);

  if (section === 'Sisi Utara') {
    latOffset += 0.0020; // North shift
  } else if (section === 'Ramp') {
    latOffset += 0.0012;
    lngOffset += 0.0008;
  } else if (section === 'Frontage') {
    latOffset -= 0.0015;
  }

  return {
    lat: Number((baseLat - (latOffset * 0.25)).toFixed(6)),
    lng: Number((baseLng + lngOffset).toFixed(6))
  };
}
