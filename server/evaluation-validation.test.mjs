import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluationSchema,bookingSchema,dateSchema} from './evaluation-validation.mjs';
const valid=()=>({submission_id:'125b6c40-708d-4470-81f6-dc0650f8c101',website:'',privacy_acknowledged:true,
 first_name:'Test',last_name:'Candidate',email:'test@example.com',whatsapp_phone_e164:'+212600000000',
 residence_country_code:'MA',residence_city:'Rabat',target_study_level:'undergraduate',subject_interest:'Computing',
 intended_intake:'À définir',budget_amount:null,budget_currency:null,funding_plan:null,
 education:{institution_name:'Établissement test',qualification:'Baccalauréat',field_of_study:null,is_current:true,result_text:null},
 english_level:'intermediate',english_test:null,message:null});
test('accepts valid structured evaluation',()=>assert.equal(evaluationSchema.parse(valid()).first_name,'Test'));
test('rejects administrative field injection',()=>assert.equal(evaluationSchema.safeParse({...valid(),status:'closed'}).success,false));
test('rejects missing privacy acknowledgement',()=>assert.equal(evaluationSchema.safeParse({...valid(),privacy_acknowledged:false}).success,false));
test('rejects invalid telephone',()=>assert.equal(evaluationSchema.safeParse({...valid(),whatsapp_phone_e164:'0600000000'}).success,false));
test('rejects negative budget',()=>assert.equal(evaluationSchema.safeParse({...valid(),budget_amount:-1,budget_currency:'GBP'}).success,false));
test('requires currency for budget',()=>assert.equal(evaluationSchema.safeParse({...valid(),budget_amount:100}).success,false));
test('rejects unbounded budget',()=>assert.equal(evaluationSchema.safeParse({...valid(),budget_amount:1e20,budget_currency:'GBP'}).success,false));
test('rejects honeypot',()=>assert.equal(evaluationSchema.safeParse({...valid(),website:'spam'}).success,false));
test('rejects invalid study level',()=>assert.equal(evaluationSchema.safeParse({...valid(),target_study_level:'admin'}).success,false));
test('rejects oversized field',()=>assert.equal(evaluationSchema.safeParse({...valid(),first_name:'a'.repeat(151)}).success,false));
test('rejects impossible calendar day',()=>assert.equal(dateSchema.safeParse('2026-02-30').success,false));
test('accepts real calendar day',()=>assert.equal(dateSchema.safeParse('2026-10-26').success,true));
test('rejects arbitrary booking token',()=>assert.equal(bookingSchema.safeParse({token:'wrong',advisor_id:valid().submission_id,starts_at:'2026-10-27T10:00:00Z',privacy_acknowledged:true}).success,false));
