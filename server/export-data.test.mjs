
import test from 'node:test';import assert from 'node:assert/strict';
import {partnerRows,overview,fieldGroup,intakeYear,budgetBand,text} from './export-data.mjs';
const c={first_name:'PRIVATE_NAME',last_name:'PRIVATE_SURNAME',email:'private@example.com',phone_e164:'+212600000000',residence_city:'PRIVATE_CITY',subject_interest:'PRIVATE_NAME computer science',status:'new',residence_country_code:'MA',target_study_level:'undergraduate',intended_intake:'September 2027',budget_amount:15000,budget_currency:'GBP',evaluation_payload:{english_level:'intermediate',message:'PRIVATE_MESSAGE'}};
test('minimised rows omit direct contact details and free text',()=>{const s=JSON.stringify(partnerRows([c]));for(const v of ['PRIVATE_NAME','PRIVATE_SURNAME','private@example.com','+212600000000','PRIVATE_CITY','PRIVATE_MESSAGE'])assert.ok(!s.includes(v));});
test('archived candidates excluded from partner rows',()=>assert.equal(partnerRows([{...c,archived_at:'2026-01-01'}]).length,0));
test('group study field, do not copy free text',()=>assert.equal(fieldGroup(c.subject_interest),'Computing & technology'));
test('extract only broad intake year',()=>assert.equal(intakeYear(c.intended_intake),'2027'));
test('unknown intake is not copied',()=>assert.equal(intakeYear('PRIVATE_MESSAGE'),'To define'));
test('budget band instead of exact amount',()=>assert.equal(budgetBand(15000),'10,000–19,999'));
test('missing budget is not zero',()=>assert.equal(budgetBand(null),'Not stated'));
test('unrecognised phase does not become an offer',()=>assert.equal(partnerRows([{...c,status:'something'}])[0][8],'Unknown / review required'));
test('overview excludes archive from stage counts',()=>assert.equal(overview([c,{...c,archived_at:'2026-01-01'}]).phases.new,1));
test('remove invalid XML control characters',()=>assert.equal(text('ab\u0000cd'),'abcd'));
test('unvalidated English is not copied',()=>assert.equal(partnerRows([{...c,evaluation_payload:{english_level:'PRIVATE'}}])[0][7],'Not specified'));
