/* Prepared only: no network, no identifiers, no free text or medical data.
Install an approved consent-aware sink separately after privacy review. */
(()=>{'use strict';
const allowed=new Set(['whatsapp_click','booking_click','lead_form_success','booking_complete']);
window.SITrack=(event)=>{if(!allowed.has(event)||!window.SIConsent?.get()?.analytics)return;
// Deliberately omit URL, referrer, service, form fields, contact details and identifiers.
window.dispatchEvent(new CustomEvent('si:conversion',{detail:{event}}));};
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.hostname==='wa.me')window.SITrack('whatsapp_click');});
})();