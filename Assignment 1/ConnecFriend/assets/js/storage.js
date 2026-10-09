// Central localStorage state API. Keep all relationship mutations consistent.
(() => {
 const KEY='connecfriend-data-v1';
 function clone(v){return JSON.parse(JSON.stringify(v));}
 function ensure(){if(!localStorage.getItem(KEY)) localStorage.setItem(KEY,JSON.stringify(clone(window.SEED_DATA))); return get();}
 function get(){try{return JSON.parse(localStorage.getItem(KEY))||clone(window.SEED_DATA)}catch{return clone(window.SEED_DATA)}}
 function save(data){localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('cf:change'));return data;}
 function reset(){realtimeSend({type:'reset'});localStorage.setItem(KEY,JSON.stringify(clone(window.SEED_DATA)));window.dispatchEvent(new CustomEvent('cf:change'));}
 function user(id){return get().users.find(u=>u.id===id)}
 // A live view avoids stale account fields in page modules after a mutation.
 function current(){if(!get().currentUserId)return null;return new Proxy({}, {get(_target,key){const d=get();const u=d.users.find(x=>x.id===d.currentUserId);return u?.[key]},ownKeys(){const d=get();return Reflect.ownKeys(d.users.find(x=>x.id===d.currentUserId)||{})},getOwnPropertyDescriptor(){return {enumerable:true,configurable:true}}})}
 function mutate(fn){const d=get();const result=fn(d);save(d);return result}
 let socket=null, pending=[], onlineUsers=new Set();
 function realtimeSend(payload){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(payload));else if(payload.type==='message')pending.push(payload);}
 function connectRealtime(){const me=current();if(!me||!location.hostname||!window.WebSocket)return;try{socket=new WebSocket(`ws://${location.hostname}:3000/socket?user=${encodeURIComponent(me.id)}`);socket.addEventListener('open',()=>{while(pending.length)socket.send(JSON.stringify(pending.shift()))});socket.addEventListener('message',event=>{let msg;try{msg=JSON.parse(event.data)}catch{return}if(msg.type==='history'&&Array.isArray(msg.messages)){mutate(d=>{for(const m of msg.messages)if(!d.messages.some(x=>x.id===m.id))d.messages.push(m)});window.dispatchEvent(new CustomEvent('cf:history'))}else if(msg.type==='message'&&msg.message){mutate(d=>{if(!d.messages.some(x=>x.id===msg.message.id))d.messages.push(msg.message)});window.dispatchEvent(new CustomEvent('cf:message',{detail:msg.message}))}else if(msg.type==='read'){mutate(d=>d.messages.forEach(m=>{if(msg.ids.includes(m.id))m.read=true}))}else if(msg.type==='presence'){onlineUsers=new Set(msg.users||[]);window.dispatchEvent(new CustomEvent('cf:presence',{detail:[...onlineUsers]}))}});socket.addEventListener('close',()=>{socket=null;onlineUsers.delete(me.id);window.dispatchEvent(new CustomEvent('cf:presence',{detail:[...onlineUsers]}))});}catch{socket=null}}
 window.CF={ensure,get,save,reset,user,current,mutate,connectRealtime,realtimeSend,isOnline:id=>onlineUsers.has(id),delay:(ms=350)=>new Promise(r=>setTimeout(r,ms)),id:()=>`x${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`};
 ensure();
})();
