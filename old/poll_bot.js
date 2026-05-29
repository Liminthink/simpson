tgTopic=(tme,sent,   m=/t\.me\/c\/(-?\d+)(?:\/(\d+))?/.exec(tme), id=+sent.B, SK=(this.$?.SK_TG?? location.href).replace(/getMe$/,''))=>
fetch(SK+(sent['']?? (sent.B? 'editMessageText':'sendMessage')), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: m[1]>0? '-100'+m[1] : -m[1],
    message_thread_id: m[2],
    message_id: (sent.B=undefined, id),
    parse_mode: 'MarkdownV2',
    ...sent,
  })
}).then(async(r)=>With((await r.json()).result??Error('-> Network Tab'), (u, c,mt)=>{
  u.valueOf=()=>u.message_id
  u.toJSON=()=>(c=('-'+u.chat.id).replace(/^--100/,''), {text:sent.text, A:u.from.id, B:u.message_id, C:(mt=u.message_thread_id)? `t.me/c/${c}/${mt}` : +c })
}))

LocalStorage=async(pre, T=JSON)=>{
  pre=pre.substr()+'.'
  let mem={}, st
  if(st=this.localStorage) return new Proxy(st, {get:(_,k)=>T.parse(_[k]??'null'), set(_,k,v){_[k]=T.stringify(v); return'dump!'} })
  st = globalThis.sharedStorage
  for (let {name:k} of (await st.list({prefix: pre})).keys) {
    mem[k.slice(pre.length)] = T.parse(await st.get(k)); 
  }
  return new Proxy(mem, {get:(_,k)=>k=='then'? Promise.all(LocalStorage.atexit):(_[k]), set(_,k,v){LocalStorage.atexit.push(st.put(pre+k, T.stringify(_[k]=v))); return'unfinish'} })
}
LocalStorage.atexit=[];

fetchChat = (SK_AI, api='https://openrouter.ai/api/v1/chat/completions') => async (am,sys={}) => {
  /** Try: https://openrouter.ai/docs/api-reference/parameters#seed
    Use event.waitUntil(max=30s) or fastcron.com: https://developers.cloudflare.com/workers/platform/limits/#how-long-can-a-subrequest-take
    Learn more: Bref.sh, babel-preset-php */

  let[ai,tok] = SK_AI.split(':', 2), apai=api
  am = am.substr ? [{
    role: 'user',
    content: am
  }] : am
  if (sys.rule) {
    am.unshift({ role: 'system', content: sys.rule })
    if(/^JSON (example|示例)/.test(sys.rule)) sys.response_format={type:'json_object'}
    sys.rule=undefined
  }
  if(!/^http/.test(api)) { if(tok= api.find?.(r=>am[0].content.includes(r[0]))?.[1]) return {content:tok, valueOf:()=>tok};  apai='https://openrouter.ai/api/v1/chat/completions' } //MOCK
  const chat = {
    model: ai,
    messages: am, ...sys
  },
   response = await fetch(apai, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tok}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chat)
  }),
    data = await response.json(),
    res = With(data.choices?.[0]?.message, u=>u.toString=()=>u.content)
  return !res? Error(data.error.message) : (sys.response_format? JSON.parse(res+'') : res)
}
// aii= fetchChat('',[['鸡','太美']])


With=(u,f)=>u!=null? (f(u),u) : u
shuf=a=>a.sort(() => Math.random() - 0.5)
md=(lit, ...val)=>val.reduce((A,B,i)=>A+String(B).replace(/([*_#`>\-![\.\]()|~+={}])/g, '\\$1')+lit[i+1], lit[0])

function* listWeekAmPmDates(dt=new Date, apm=[[8, 0, 0, 0], [20, 0, 0, 0]]) {
  let week1 = With(dt, u=>new Date(u.setDate(u.getDate() - u.getDay() + 1)));
  // 遍历7天
  for (let i = 0; i < 7; i++) {
    const day = new Date(week1);
    day.setDate(week1.getDate() + i);
    for(hr of apm) { dt=new Date(day); dt.setHours(...hr); yield dt }
  }
}

/////
let
ai = fetchChat('google/gemini-2.5-pro:sk'),
curl=(s)=>fetch(s).then(u=>u.text()),
cmpFn=f=>(A,B)=>f(A)-f(B),
weeks=[
  "周末不单休🍔！",
  "☕还剩2天··",
  "💪就在明天",
  "📅有奖提名",
  "🍾周五等空投！",
  "🎉获奖名单公布",
  " 周六日 自由日🎮！"
]

async function dayNotify() {
let
tada=shuf([...'🎉🕊🌈🥳🎈🛋✨🎆🎁🎀']),
hdr=(await curl(`https://v1.hitokoto.cn/?c=j&c=d&min_length=20&encode=text`)).replace('.','·'),
week=newDate.getDay(),
isAM=newDate.getHours()<12,

text=$.mPinn.text.replace(/(.*\n){1}/, `【${hdr}】 [${weeks[week]}](https://t.me/whyyoutouzhele_memecoin/8754/507225)\n`),
juHint=`${isAM? "主题在和平主义、政治历史、乐观主义里随机选择":"需要随机选择，来源于中美流行文化、作家画家等人物"}${/[24]/.test(week)?'。包含emoji': '\n随机风格：'+hdr}`,
mUI={
  reply_markup: {
    inline_keyboard: [
      [{ text: '接力打卡'+tada[0], url: 't.me/rfk_liBot?startapp=' }] // 内联App按钮
    ]
  }
};

await $m({text, B:$.mPinn.B,       disable_web_page_preview: true})
if(!isAM && !/[34]/.test(week)) await juLong()

// 一周7*2 -3 = 11条：周三周五上午at人，周五下午发赏析，每天评3句置顶。 周二下午为下周第一条
let
sendDice={'':'sendDice', emoji: shuf([...'🎲🎯🏀⚽🎳🎰'])[0]},
  
pollInvolve = {'':
  'sendPoll',
  question: '你需要跳过本周的李币激励吗？',
  options: ['😾接受空投！', '😼跳过本周', '🙋🏻‍♀️我还不在排行榜top10里……'],
  is_anonymous: false,  // 必须为 false 以获取用户 ID
  type: 'regular'
},
atMention=(u,i)=>md`\\#${i+1} [${tada[i%tada.length]} ${u.first_name}](tg://user?id=${u.tg_id}) ||${u.points}₧||\n>  **${$.juPoll[i]??'😽'}**`


if(week==3&&isAM) {
  await $m(sendDice); $.mInvolve=+await $m(pollInvolve);
  await $m({text: `😺😽😾 \\#打卡周周礼\n__空投请加入！__\n\n\`== 获奖提名 ==\`\n${$.uTops.toReversed().map(atMention).join('\n') }` })
  $.juExp=$.juPoll; $.juPoll=[]
} else
if(week==5&&isAM) {
  $m({'':'stopPoll', B:$.mInvolve});  await $m(sendDice)
  await $m({text: `\\#打卡周周礼 [🍾恭喜${$.uTops.length}位获奖成员！](https://t.me/whyyoutouzhele_memecoin/92/${$.mInvolve})\n\n😺本喵已将转账票据链接，记录于 $LI 管理员群组。\n\n😾稍后，将由管理员进行打码后公布！` })
} else if(!/[5]/.test(week)) {
  let ju, old, n=5
  do { ju=(await ai(`说${n}句名人名言，输出限制为${n}行。${juHint}`)).content.concat('\n看结果😺').split(/\n+/) } while(ju.length!=n+1)
  $mm('unpin',$.mPoll); old=(await $m({'':'stopPoll', B:$.mPoll})).options
  $.juPoll=[...$.juPoll, !old? '（投票被删除）' : old.slice(0,-1).sort(cmpFn(x=>x.voter_count)).at(-1).text]

  await $m({
    text:md`__${$.juPoll.at(-1).split('—')[0]}__ 这样么？\n很有道理哦！${tada[1]}\n\n😽 请大家多多参与每日打卡呢～`, 
    reply_parameters:{message_id:$.mPoll, allow_sending_without_reply:true}})
  
  $mm('pin', $.mPoll=+await $m({'':'sendPoll', question:tada[2]+'哪一条名言说的最有道理？ ', options:ju, allows_multiple_answers: false, ...mUI, }))
}
}//dayNotify

juLong=async(nExp=3)=>{
  if(!$.juExp.length) return;
  let s=await ai(`请从政治经济和个人生活的角度赏析以下名人名言，用一句话介绍其生平。 请只输出纯文本，用 '__' 包围名言，将 '>' 前置于名言和人物生平行，多使用emoji和全角括号。 \n ${$.juExp.slice(0,nExp).join('\n')}`) +'',
    m=await $m({text: '是的！\n\n'+s.replace(/[().\-]/g, '')})

  $mm('pin', $.mPinn= m)
  $.juExp=$.juExp.slice(nExp)
}

MD_OPEN=`以下

🎉 为答谢李社区岛友对TG社群的认可和参与，李老师决定，对每天打卡的岛友，空投 $LI 币奖励，长期有效 😾😾😾

 
**🎄 奖励模式暂定为：**

每周五，对打卡排行的前10名空投共 200 $LI ，并清除14点积分。 每周三通过参与群投票，即刻加入本周的 \\#打卡周周礼 活动

**🙋🏻‍♀️ 参与方法：**

点击消息下方按钮，进入 [我的信息/钱包地址](https://54web3.cc/tool) 填写EVM/SOL收款地址并保存

**每天点击置顶消息打卡，** 并在周三参与 \\#打卡周周礼 投票，即可接受免费空投。

欲获取链上钱包，请访问 Phantom\\.com （[APK](https://play.google.com/store/apps/details?id=app.phantom)），无 Google Play 的方法请看[加密货币学习区](https://t.me/whyyoutouzhele_memecoin/202549/505028)

自十月十五日起正式实行 😼😼😼
`

app=async(ev)=>{
  $=await LocalStorage('rfkbot')
  newDate=With(new Date(ev.scheduledTime?? Date.now()), dt=>dt.setUTCHours(dt.getUTCHours() + 8))
  ev.waitUntil(new Promise(ok=>console.warn("KeepAlive+30s")))

  if(!$.mPinn) Object.assign($, {mPinn:{text:MD_OPEN}, mInvolve:0, uTops:[], juPoll:['支持活动'],juExp:[], })
  $m= tgTopic.bind(0, $.TG_GRP)
  $mm=(k,m)=>LocalStorage.atexit.push($m({'':k+'ChatMessage', B:+m}));
  if(!$.mPoll) $.mPoll= +await $m({'':'sendPoll', question:'即将展开活动！',options:['支持活动','OK！']})

  await dayNotify()
  await $
  let r = new Response(`sent. ${newDate}\n`)
  setTimeout(()=>ev.respondWith(r), 29*1000); return r
}
addEventListener('scheduled', ev=>ev.waitUntil(app(ev)) )
addEventListener('fetch', (ev)=>{
  ev.request.method=='POST'? ev.respondWith(app(ev)) :0
})