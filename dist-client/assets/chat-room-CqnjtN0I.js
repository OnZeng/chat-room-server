import{d as v,u as m,r as h,o as x,s as l,c as r,a as s,b as a,t as i,F as _,e as b,w as g,v as f,f as d,p as w,g as M,_ as S}from"./index-Cqze7h1S.js";const k=t=>(w("data-v-80e1409a"),t=t(),M(),t),I={class:"box-title"},B={class:"box2-1"},C=["src"],D={class:"box2-name"},F={class:"box1"},V=k(()=>s("div",{class:"box2"},null,-1)),y={class:"box3"},E={class:"box4"},L={class:"box5"},N=v({__name:"chat-room",setup(t){const o=m(),c=h([]),p=()=>{l.emit("newMessage",o.user,()=>{console.log("发送成功")}),o.user.content=""};return x(()=>{l.on("connection",e=>{c.value=e,console.log(e)}),l.on("newMessage",e=>{c.value=e,console.log(e)})}),(e,u)=>(d(),r(_,null,[s("div",I,[s("div",B,[s("img",{class:"box2-avatar",src:a(o).user.avatar},null,8,C),s("div",D,i(a(o).user.name),1)])]),s("div",F,[V,s("div",y,[s("div",E,[(d(!0),r(_,null,b(c.value,n=>(d(),r("div",null,i(n.name)+": "+i(n.content),1))),256))]),s("div",L,[g(s("input",{class:"input1","onUpdate:modelValue":u[0]||(u[0]=n=>a(o).user.content=n)},null,512),[[f,a(o).user.content]]),s("button",{class:"button1",onClick:p},"发送")])])])],64))}}),T=S(N,[["__scopeId","data-v-80e1409a"]]);export{T as default};