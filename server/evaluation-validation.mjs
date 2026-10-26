import { z } from 'zod';
const text=(max)=>z.string().trim().min(1).max(max);
const optional=(max)=>z.string().trim().max(max).nullable().optional().transform(v=>v||null);
export const uuid=z.string().uuid();
export const tokenSchema=z.string().regex(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/i);
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{
 const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;
});
export const evaluationSchema=z.object({
 submission_id:uuid,website:z.literal('').optional(),privacy_acknowledged:z.literal(true),
 first_name:text(150),last_name:text(150),email:z.string().trim().email().max(320).transform(v=>v.toLowerCase()),
 whatsapp_phone_e164:z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/),
 residence_country_code:z.string().regex(/^[A-Z]{2}$/),residence_city:text(150),
 target_study_level:z.enum(['foundation','undergraduate','postgraduate','phd','english_course','other']),
 subject_interest:text(500),intended_intake:text(100),
 budget_amount:z.number().finite().min(0).max(9999999999.99).nullable(),
 budget_currency:z.enum(['GBP','EUR','MAD','DZD','TND','USD']).nullable(),funding_plan:optional(2000),
 education:z.object({institution_name:text(300),qualification:text(300),field_of_study:optional(500),
 is_current:z.boolean(),result_text:optional(500)}).strict(),
 english_level:z.enum(['beginner','intermediate','advanced','certified','unknown']),
 english_test:optional(500),message:optional(4000)
}).strict().refine(v=>v.budget_amount===null||v.budget_currency!==null,{message:'Précisez la devise.',path:['budget_currency']});
export const bookingSchema=z.object({token:tokenSchema,advisor_id:uuid,
 starts_at:z.string().datetime({offset:true}),privacy_acknowledged:z.literal(true)}).strict();
