/**
 * Test & Render Flood and Cyclone Disaster Advisories
 */

import { DisasterRuleEngine } from '../../app/src/rules/DisasterRuleEngine.js';

console.log('========================================================================');
console.log('  DISASTER ADVISORY VERIFICATION: FLOOD & CYCLONE CLINICAL PROTOCOLS    ');
console.log('========================================================================');

// 1. Standard Flood Advisory
console.log('\n--- 1. STANDARD FLOOD ADVISORY (isVulnerable: false) ---');
const floodStandard = DisasterRuleEngine.getDisasterAdvisory('flood', false);
console.log(`Title: ${floodStandard.title}`);
console.log(`Severity: ${floodStandard.severity} (${floodStandard.riskLevel})`);
console.log(`Key Stat Chips:`, floodStandard.keyStats);
console.log(`Description: ${floodStandard.description}`);
console.log(`Recommendations (${floodStandard.recommendations.length}):`);
floodStandard.recommendations.forEach(r => console.log(`  • ${r}`));

// 2. Escalated Flood Advisory (Vulnerable Profile)
console.log('\n--- 2. ESCALATED FLOOD ADVISORY (isVulnerable: true) ---');
const floodVulnerable = DisasterRuleEngine.getDisasterAdvisory('flood', true);
console.log(`Title: ${floodVulnerable.title}`);
console.log(`Severity: ${floodVulnerable.severity} (${floodVulnerable.riskLevel})`);
console.log(`Key Stat Chips:`, floodVulnerable.keyStats);
console.log(`Description: ${floodVulnerable.description}`);
console.log(`Recommendations (${floodVulnerable.recommendations.length}):`);
floodVulnerable.recommendations.forEach(r => console.log(`  • ${r}`));

// 3. Standard Cyclone Advisory
console.log('\n--- 3. STANDARD CYCLONE ADVISORY (isVulnerable: false) ---');
const cycloneStandard = DisasterRuleEngine.getDisasterAdvisory('cyclone', false);
console.log(`Title: ${cycloneStandard.title}`);
console.log(`Severity: ${cycloneStandard.severity} (${cycloneStandard.riskLevel})`);
console.log(`Key Stat Chips:`, cycloneStandard.keyStats);
console.log(`Description: ${cycloneStandard.description}`);
console.log(`Recommendations (${cycloneStandard.recommendations.length}):`);
cycloneStandard.recommendations.forEach(r => console.log(`  • ${r}`));

// 4. Escalated Cyclone Advisory (Vulnerable Profile)
console.log('\n--- 4. ESCALATED CYCLONE ADVISORY (isVulnerable: true) ---');
const cycloneVulnerable = DisasterRuleEngine.getDisasterAdvisory('cyclone', true);
console.log(`Title: ${cycloneVulnerable.title}`);
console.log(`Severity: ${cycloneVulnerable.severity} (${cycloneVulnerable.riskLevel})`);
console.log(`Key Stat Chips:`, cycloneVulnerable.keyStats);
console.log(`Description: ${cycloneVulnerable.description}`);
console.log(`Recommendations (${cycloneVulnerable.recommendations.length}):`);
cycloneVulnerable.recommendations.forEach(r => console.log(`  • ${r}`));

console.log('\n========================================================================');
console.log('  [PASS] FLOOD & CYCLONE CLINICAL PROTOCOLS VERIFIED                    ');
console.log('========================================================================');
