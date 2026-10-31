export function requirePasswordChange({api,mandatory=true}){
 return new Promise((resolve,reject)=>{
  const d=document.createElement('dialog');d.className='record-dialog';d.lang='en';
  const body=document.createElement('div');body.className='dialog-body';
  const title=document.createElement('h2');title.textContent=mandatory?'Secure your account':'Change password';
  title.id='employeePasswordTitle';d.setAttribute('aria-labelledby',title.id);
  const intro=document.createElement('p');intro.textContent=mandatory?
   'Before opening your workspace, replace your initial password with one that only you know.':'Enter your current password and choose a new one.';
  const form=document.createElement('form'),fields={};
  for(const [name,label,autocomplete]of [['current','Current password','current-password'],['next','New password (14–128 characters)','new-password'],['confirm','Confirm new password','new-password']]){
   const wrapper=document.createElement('div');wrapper.className='field';const caption=document.createElement('label');caption.textContent=label;
   const field=document.createElement('input');field.id='employee-password-'+name;field.type='password';field.autocomplete=autocomplete;field.required=true;field.maxLength=name==='current'?1024:128;
   if(name!=='current')field.minLength=14;caption.htmlFor=field.id;wrapper.append(caption,field);form.append(wrapper);fields[name]=field;
  }
  const message=document.createElement('p');message.className='message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const controls=document.createElement('div');controls.className='form-actions';const save=document.createElement('button');save.textContent='Save new password';save.type='submit';save.className='primary';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent=mandatory?'Cancel sign-in':'Cancel';cancel.className='secondary';controls.append(save,cancel);form.append(message,controls);body.append(title,intro,form);d.append(body);document.body.append(d);
  let busy=false;
  function clear(){for(const f of Object.values(fields))f.value='';d.remove();}
  function dismiss(){if(busy)return;clear();if(mandatory)reject(new Error('Sign-in cancelled. Change your initial password next time to access your workspace.'));else resolve(false);}
  cancel.onclick=dismiss;d.oncancel=e=>{e.preventDefault();dismiss();};
  form.onsubmit=async e=>{e.preventDefault();if(busy||!form.reportValidity())return;
   if(fields.next.value!==fields.confirm.value){message.textContent='The new passwords do not match.';return;}
   if(fields.next.value===fields.current.value){message.textContent='Choose a password different from your current password.';return;}
   busy=true;save.disabled=cancel.disabled=true;message.classList.remove('error');message.textContent='Updating your password…';
   try{await api('/api/employee-security/password',{method:'POST',body:JSON.stringify({current_password:fields.current.value,new_password:fields.next.value})});clear();resolve(true);}
   catch(error){message.textContent=error.message;message.classList.add('error');for(const f of Object.values(fields))f.value='';}
   finally{busy=false;save.disabled=cancel.disabled=false;}
  };
  d.showModal();fields.current.focus();
 });
}


