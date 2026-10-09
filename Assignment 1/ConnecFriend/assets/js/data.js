// Seed records. Every user has the same demo password: friend123
window.SEED_DATA = {
 users: [
  ['u1','maya','Maya Chen','maya@connecfriend.test','Lahore','1998-04-12','Collecting small joys and good stories.'],
  ['u2','omar','Omar Farooq','omar@connecfriend.test','Karachi','1996-11-03','Designing things that make life easier.'],
  ['u3','sana','Sana Malik','sana@connecfriend.test','Islamabad','1999-07-21','Weekend hiker, weekday tea enthusiast.'],
  ['u4','zain','Zain Ahmed','zain@connecfriend.test','Lahore','1995-02-18','Learning something new every day.'],
  ['u5','noor','Noor Ali','noor@connecfriend.test','Peshawar','1997-09-30','Books, plants, and long walks.'],
  ['u6','adam','Adam Khan','adam@connecfriend.test','Quetta','1994-05-07','Photographer of ordinary moments.'],
  ['u7','lina','Lina Shah','lina@connecfriend.test','Karachi','2000-01-14','Building a life with more music.'],
  ['u8','hadi','Hadi Raza','hadi@connecfriend.test','Multan','1998-06-26','Curious about people and places.'],
  ['u9','iman','Iman Yusuf','iman@connecfriend.test','Faisalabad','1996-12-09','Food should always be shared.'],
  ['u10','ray','Ray Hassan','ray@connecfriend.test','Hyderabad','1993-08-16','Making useful things with code.']
 ].map((x,i)=>({id:x[0],username:x[1],password:'friend123',name:x[2],email:x[3],city:x[4],birthday:x[5],bio:x[6],avatar:'',lastLogin:new Date(Date.now()-i*3600000).toISOString(),friends:i===0?['u2','u3','u4','u5']:i<5?['u1','u2','u3','u4','u5'].filter(id=>id!==x[0]):[],ignoreList:i===5?['u1']:[],ratings:{},sentRequests:[],receivedRequests:[]})),
 posts: [
  {id:'p1',authorId:'u2',text:'Found a quiet little bookshop near the old market. Adding it to my weekend route.',createdAt:new Date(Date.now()-7200000).toISOString(),audience:'all',likes:['u3'],dislikes:[]},
  {id:'p2',authorId:'u3',text:'A slow morning, a strong cup of chai, and absolutely no plans. Exactly what I needed.',createdAt:new Date(Date.now()-18000000).toISOString(),audience:'all',likes:['u1','u4'],dislikes:[]},
  {id:'p3',authorId:'u4',text:'Finally finished the tiny balcony garden. The mint has already taken over.',createdAt:new Date(Date.now()-86400000).toISOString(),audience:['u1','u2'],likes:[],dislikes:['u2']}
 ], messages: [], currentUserId: null
};
