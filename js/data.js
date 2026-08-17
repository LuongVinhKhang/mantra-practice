/* Mantra Practice — content + tunable constants.
 *
 * Plain JS, not JSON, on purpose: fetch() is blocked on file:// so a .json
 * file would make the app unusable when opened by double-clicking index.html.
 *
 * CONTENT POLICY: only short, widely-known invocations ship here. Full sutras
 * (Heart Sutra, Great Compassion Mantra, ...) are deliberately NOT included —
 * reproducing them from memory risks errors. Paste a verified copy into the
 * text box instead, or add it below once you have checked it against a source
 * you trust.
 */
window.Mantra = window.Mantra || {};

window.Mantra.TEXTS = [
  {
    id: 'custom',
    group: 'custom',
    name: 'My own text',
    language: '',
    type: 'custom',
    text: ''
  },
  {
    id: 'guanyin',
    group: 'short',
    name: '南無觀世音菩薩 · Guanyin',
    language: 'zh',
    type: 'invocation',
    text: '南無觀世音菩薩'
  },
  {
    id: 'amitabha',
    group: 'short',
    name: '南無阿彌陀佛 · Amitabha',
    language: 'zh',
    type: 'invocation',
    text: '南無阿彌陀佛'
  },
  {
    id: 'shakyamuni',
    group: 'short',
    name: '南無本師釋迦牟尼佛 · Shakyamuni',
    language: 'zh',
    type: 'invocation',
    text: '南無本師釋迦牟尼佛'
  },
  {
    id: 'sixsyllable',
    group: 'short',
    name: '唵嘛呢叭咪吽 · Six syllables',
    language: 'zh',
    type: 'invocation',
    text: '唵嘛呢叭咪吽'
  },
  {
    id: 'manjushri',
    group: 'long',
    name: '文殊菩薩祈請文 · Manjushri (13 verses)',
    language: 'zh',
    type: 'prayer',
    source: 'Supplied and verified by the user (YouTube 1UvewDv0X2A)',
    /* 13 verses × 4 lines of 9 characters. One line per newline, so chanting
       mode gives you exactly one line at a time. */
    text:
      '在那深廣知識天空中\n圓滿智慧金輪所放光\n消除一切眾生愚昧暗\n文殊師佛妙音我頂禮\n從現在起直至證菩提\n除您之外我無救護主\n因業力故無論生何道\n世難之中救我文殊師\n我從今世舍身離去時\n一切親人好友均別離\n落入兇狠死神手中時\n拯救死亡恐怖文殊師\n無始時來多造惡業故\n在中陰界煩惱狂風勁\n會被吹到兇險惡趣中\n擋住煩惱風口文殊師\n中陰意識轉生投胎時\n遠離八類修法無暇地\n生為手持佛法勝法幢\n有福種姓之家文殊師\n來世獲得人天高貴相\n七德莊嚴暇滿人類身\n幸逢持正法脈善知識\n助緣獲善教誨文殊師\n具慈悲與方便善法師\n教我精通海量諸經論\n並能如法教授諸眾生\n賜與決擇智慧文殊師\n生生世世我為利眾生\n所有財富無吝作施舍\n無散亂心修習禪定等\n圓滿六度大行文殊師\n消除世苦熱惱清涼劑\n經論冰山之峪願遊覽\n掉入散逸泥海難成行\n慈悲救我出泥文殊師\n舉步進入甚深智見道\n一心想去解脫安樂島\n緣淺世心如繩作羈絆\n斬斷戀世牽繩文殊師\n放棄入寂自利夜荷林\n觀看廣大佛道千頃蓮\n智眼蒙受無明黑暗障\n消出無明煙霧文殊師\n祈求使我生生與世世\n依止深廣佛法大海洋\n變為滿足眾生所需求\n如願生成大寶文殊師\n我對文殊誠心祈求力\n啟動福智資糧大航船\n運送一切眾生出世海\n助我神力如您文殊師'
  },
  {
    id: 'tara21',
    group: 'long',
    name: '二十一度母讚 · 21 Taras',
    language: 'zh',
    type: 'praise',
    source: 'Supplied by the user; 15 conversion artifacts corrected (see below)',
    /* 21 verses × 4 lines of 7 characters.
     *
     * The source came through a simplified→traditional converter that picked
     * the wrong traditional character 15 times. Those 15 have been corrected:
     *
     *   麵 → 面   ×4   麵 is "noodles"; 面 is "face"        (蓮花面, 無垢面, 蓮華面, 眉面)
     *   儘 → 盡   ×5   儘 is "to the utmost"; 盡 is "entirely" (盡無餘 ×4, 如盡劫火母)
     *   噁 → 惡   ×3   噁 is "nausea"; 惡 is "evil"          (惡冤輪, 惡夢, 惡毒)
     *   髮 → 發   ×2   髮 is "hair"; 發 is "to emit"         (口發, 作發聲)
     *   佈 → 布   ×1   佈 is "announce"; 布 is "spread out"  (妙嚴布)
     *
     * Nothing else was touched. 鬥 in 鬥爭 is correct traditional and was left
     * alone. Run `node test/lint-content.mjs` to re-check. */
    text:
      '敬禮迅捷勇度母\n目如電光剎那照\n三世界尊蓮花面\n從妙花中現端嚴\n敬禮秋宵朗月母\n普遍圓滿無垢面\n如千星宿俱時聚\n殊勝威光超於彼\n敬禮紫磨金色母\n妙蓮花手勝莊嚴\n施勤苦行寂滅者\n忍辱禪定行境母\n敬禮如來頂髻母\n最勝能滿無邊行\n得到彼岸盡無餘\n勝勢佛子極所愛\n敬禮嘟答惹吽字\n聲愛方所遍虛空\n運足遍履七世界\n悉能鉤召盡無餘\n敬禮釋梵火天母\n風神自在衆聚集\n部多起屍尋香等\n諸藥叉衆作稱嘆\n敬禮口發齋呸母\n於他加行極摧壞\n蜷左展右作足踏\n頂髻熾甚極明耀\n敬禮嘟熱大畏母\n勇猛能摧怨魔類\n於蓮華面作顰眉\n摧壞一切冤家衆\n敬禮三寶嚴印母\n手指當心威嚴相\n自身熾盛光聚禮\n嚴飾方輪盡無餘\n敬禮威德歡悅母\n寶冠珠鬘衆光飾\n最極喜笑嘟答熱\n鎮世間魔作攝伏\n敬禮守護衆地母\n亦能鉤召諸神衆\n搖顰眉面吽字聲\n一切衰敗令度脫\n敬禮頂冠寶月母\n冠中現勝妙嚴光\n阿彌陀佛髻中現\n常放衆妙寶光明\n敬禮如盡劫火母\n安住熾盛火鬘中\n普遍喜悅半趺坐\n能摧滅壞惡冤輪\n敬禮手按大地母\n以足踐踏作鎮壓\n現顰眉目作吽聲\n能破七險鎮降伏\n敬禮安穩柔善母\n涅槃寂滅最樂境\n娑哈嗡清淨相應\n善能消滅大災禍\n敬禮普遍極喜母\n諸怨支體令脫離\n十字真言妙嚴布\n明咒吽聲常朗耀\n敬禮嘟熱巴帝母\n足躡相勢吽字種\n須彌曼陀及寶陀\n於此三界能動搖\n敬禮薩囉天海母\n手中執住神獸像\n誦二答熱作發聲\n能滅諸毒盡無餘\n敬禮諸天集會母\n天緊那羅所依愛\n威德歡悅若堅鎧\n滅除鬥爭及惡夢\n敬禮日月廣圓母\n目睹猶勝普光照\n誦二哈惹嘟答惹\n善除惡毒溫熱病\n敬禮具三真實母\n善靜威力皆具足\n魑魅起屍夜叉母\n都熱最極除災禍'
  },
  {
    id: 'shurangama',
    group: 'long',
    name: '楞嚴咒 · Śūraṅgama Mantra',
    language: 'zh',
    type: 'mantra',
    source: 'Supplied by the user as a WebVTT caption track, stored verbatim',
    /* 141 caption lines, 455 space-separated phrases, 2619 characters.
       Line breaks and spaces are the reciter\u2019s own phrasing \u2014 chanting
       mode follows them exactly. Contains \ud852\ude56 (U+24656), a non-BMP
       character, which is why the app splits with Array.from(). */
    text:
      '南無薩怛他蘇伽多耶 阿囉訶帝\n三藐三菩陀寫 薩怛他 佛陀俱胝瑟尼釤\n南無薩婆勃陀勃地 薩跢鞞弊\n南無薩多南 三藐三菩陀 俱知喃\n娑舍囉婆迦 僧伽喃\n南無盧雞阿羅漢跢喃\n南無蘇盧多波那喃\n南無娑羯唎陀伽彌喃\n南無盧雞三藐伽跢喃\n三藐伽波囉底波多那喃\n南無提婆離瑟赧\n南無悉陀耶 毗地耶 陀囉離瑟赧\n舍波奴 揭囉訶 娑訶娑囉摩他喃\n南無跋囉訶摩尼\n南無因陀囉耶\n南無婆伽婆帝 嚧陀囉耶 烏摩般帝 娑醯夜耶\n南無婆伽婆帝 那囉野拏耶 槃遮摩訶三慕陀囉 南無悉羯唎多耶\n南無婆伽婆帝 摩訶迦囉耶 地唎般剌那伽囉 毗陀囉波拏迦囉耶\n阿地目帝 尸摩舍那泥婆悉泥 摩怛唎伽拏 南無悉羯唎多耶\n南無婆伽婆帝 多他伽跢俱囉耶 南無般頭摩俱囉耶\n南無跋闍囉俱囉耶 南無摩尼俱囉耶 南無伽闍俱囉耶\n南無婆伽婆帝 帝唎茶輸囉西那 波囉訶囉拏囉闍耶 跢他伽多耶\n南無婆伽婆帝 南無阿彌多婆耶 跢他伽多耶\n阿囉訶帝 三藐三菩陀耶\n南無婆伽婆帝 阿芻鞞耶 跢他伽多耶 阿囉訶帝 三藐三菩陀耶\n南無婆伽婆帝 鞞沙闍耶俱盧吠柱唎耶 般囉婆囉闍耶 跢他伽多耶\n南無婆伽婆帝 三補師毖多 薩憐捺囉剌闍耶\n跢他伽多耶 阿囉訶帝 三藐三菩陀耶\n南無婆伽婆帝 舍雞野母那曳\n跢他伽多耶 阿囉訶帝 三藐三菩陀耶\n南無婆伽婆帝 剌怛那雞都囉闍耶\n跢他伽多耶 阿囉訶帝 三藐三菩陀耶\n帝瓢 南無薩羯唎多 翳曇婆伽婆多 薩怛他伽都瑟尼釤\n薩怛多般怛藍 南無阿婆囉視耽 般囉帝揚岐囉\n薩囉婆部多揭囉訶 尼揭囉訶羯迦囉訶尼 跋囉毖地耶叱陀你\n阿迦囉蜜唎柱 般唎怛囉耶儜揭唎\n薩囉婆槃陀那目叉尼\n薩囉婆突瑟吒 突悉乏 般那你伐囉尼\n赭都囉失帝南 羯囉訶娑訶薩囉若闍\n毗多崩娑那羯唎 阿瑟吒冰舍帝南\n那叉刹怛囉若闍 波囉薩陀那羯唎\n阿瑟吒南 摩訶揭囉訶若闍 毗多崩薩那羯唎\n薩婆舍都嚧你婆囉若闍 呼藍突悉乏難遮那舍尼\n毖沙舍悉怛囉 阿吉尼烏陀迦囉若闍\n阿般囉視多具囉 摩訶般囉戰持 摩訶疊多 摩訶帝闍\n摩訶稅多闍婆囉 摩訶跋囉槃陀囉 婆悉你 阿唎耶多囉\n毗唎俱知 誓婆毗闍耶 跋闍囉摩禮底\n毗舍嚧多 勃騰罔迦 跋闍囉制喝那阿遮\n摩囉制婆般囉質多 跋闍囉擅持 毗舍囉遮\n扇多舍鞞提婆補視多 蘇摩嚧波 摩訶稅多 阿唎耶多囉\n摩訶婆囉阿般囉 跋闍囉商揭囉制婆 跋闍囉俱摩唎\n俱藍陀唎 跋闍囉喝薩多遮 毗地耶乾遮那摩唎迦\n啒蘇母婆羯囉多那 鞞嚧遮那俱唎耶 夜囉菟瑟尼釤\n毗折藍婆摩尼遮 跋闍囉迦那迦波囉婆 嚧闍那\n跋闍囉頓稚遮 稅多遮迦摩囉 刹奢尸波囉婆\n翳帝夷帝 母陀囉羯拏 娑鞞囉懺\n掘梵都 印兔那麼麼寫\n烏𤙖 唎瑟揭拏 般刺舍悉多 薩怛他 伽都瑟尼釤\n虎𤙖 都盧雍 瞻婆那\n虎𤙖 都盧雍 悉耽婆那\n虎𤙖 都盧雍 波羅瑟地耶 三般叉拏羯囉\n虎𤙖 都盧雍 薩婆藥叉喝囉刹娑 揭囉訶若闍 毗騰崩薩那羯囉\n虎𤙖 都盧雍 者都囉尸底南 揭囉訶娑訶薩囉南 毗騰崩薩那囉\n虎𤙖 都盧雍 囉叉 婆伽梵 薩怛他伽都瑟尼釤 波囉點闍吉唎\n摩訶娑訶薩囉 勃樹娑訶薩囉 室唎沙\n俱知娑訶薩泥 帝隸 阿弊提視婆唎多\n吒吒甖迦 摩訶跋闍嚧陀囉 帝唎菩婆那 曼茶囉\n烏𤙖 莎悉帝薄婆都 麼麼 印兔那麼麼寫\n囉闍婆夜 主囉跋夜 阿祇尼婆夜 烏陀迦婆夜\n毗沙婆夜 舍薩多囉婆夜 婆囉斫羯囉婆夜 突瑟叉婆夜\n阿舍你婆夜 阿迦囉蜜唎柱婆夜 陀囉尼部彌劍 波伽波陀婆夜\n烏囉迦婆多婆夜 剌闍壇茶婆夜\n那伽婆夜 毗條怛婆夜 蘇波囉拏婆夜\n藥叉揭囉訶 囉叉私揭囉訶 畢唎多揭囉訶 毗舍遮揭囉訶\n部多揭囉訶 鳩槃茶揭囉訶 補單那揭囉訶 迦吒補單那揭囉訶\n悉乾度揭囉訶 阿播悉摩囉揭囉訶 烏檀摩陀揭囉訶 車夜揭囉訶\n醯唎婆帝揭囉訶 社多訶唎南 揭婆訶唎南 嚧地囉訶唎南\n忙娑訶唎南 謎陀訶唎南 摩闍訶唎南 闍多訶唎女\n視比多訶唎南 毗多訶唎南 婆多訶唎南 阿輸遮訶唎女\n質多訶唎女 帝釤薩鞞釤 薩婆揭囉訶南\n毗陀耶闍嗔陀夜彌 雞囉夜彌 波唎跋囉者迦訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 茶演尼訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌\n摩訶般輸般怛夜 嚧陀囉訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 那囉夜拏訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 怛埵伽嚧茶西訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 摩訶迦囉摩怛唎伽拏訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 迦波唎迦訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌\n闍耶羯囉摩度羯囉 薩婆囉他娑達那訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 赭咄囉婆耆你訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 毗唎羊訖唎知\n難陀雞沙囉伽拏般帝 索醯夜訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 那揭那舍囉婆拏訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 阿羅漢訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 毗多囉伽訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 跋闍囉波你\n具醯夜具醯夜 迦地般帝訖唎擔\n毗陀夜闍嗔陀夜彌 雞囉夜彌 囉叉罔 婆伽梵 印兔那麼麼寫\n婆伽梵 薩怛多般怛囉 南無粹都帝 阿悉多那囉剌迦\n波囉婆悉普吒 毗迦薩怛多鉢帝唎 什佛囉什佛囉 陀囉陀囉\n頻陀囉 頻陀囉 嗔陀 嗔陀 虎𤙖 虎𤙖\n泮吒 泮吒泮吒泮吒泮吒 娑訶 醯醯泮\n阿牟迦耶泮 阿波囉提訶多泮 婆囉波囉陀泮 阿素囉毗陀囉波迦泮\n薩婆提鞞弊泮 薩婆那伽弊泮 薩婆藥叉弊泮 薩婆乾闥婆弊泮\n薩婆補丹那弊泮 迦吒補丹那弊泮\n薩婆突狼枳帝弊泮 薩婆突澁比犁訖瑟帝弊泮\n薩婆什婆利弊泮 薩婆阿播悉摩犁弊泮\n薩婆舍囉婆拏弊泮 薩婆地帝雞弊泮\n薩婆怛摩陀繼弊泮 薩婆毗陀耶囉誓遮犁弊泮 闍夜羯囉摩度羯囉\n薩婆囉他娑陀雞弊泮 毗地夜遮唎弊泮 者都囉縛耆你弊泮\n跋闍囉俱摩唎 毗陀夜囉誓弊泮 摩訶波囉丁羊乂耆唎弊泮\n跋闍囉商羯囉夜 波囉丈耆囉闍耶泮 摩訶迦囉夜 摩訶末怛唎迦拏\n南無娑羯唎多夜泮 毖瑟拏婢曳泮 勃囉訶牟尼曳泮 阿耆尼曳泮\n摩訶羯唎曳泮 羯囉檀遲曳泮 蔑怛唎曳泮 嘮怛唎曳泮\n遮文茶曳泮 羯邏囉怛唎曳泮 迦般唎曳泮 阿地目質多迦尸摩舍那\n婆私你曳泮 演吉質 薩埵婆寫 麼麼印兔那麼麼寫\n突瑟吒質多 阿末怛唎質多 烏闍訶囉 伽婆訶囉\n嚧地囉訶囉 婆娑訶囉 摩闍訶囉 闍多訶囉 視毖多訶囉\n跋略夜訶囉 乾陀訶囉 布史波訶囉 頗囉訶囉 婆寫訶囉\n般波質多 突瑟吒質多 嘮陀囉質多 藥叉揭囉訶\n囉刹娑揭囉訶 閉隸多揭囉訶 毗舍遮揭囉訶 部多揭囉訶\n鳩槃茶揭囉訶 悉乾陀揭囉訶 烏怛摩陀揭囉訶 車夜揭囉訶\n阿播薩摩囉揭囉訶 宅袪革茶耆尼揭囉訶 唎佛帝揭囉訶\n闍彌迦揭囉訶 舍俱尼揭囉訶 姥陀囉難地迦揭囉訶\n阿藍婆揭囉訶 乾度波尼揭囉訶 什伐囉堙迦醯迦 墜帝藥迦\n怛隸帝藥迦 者突託迦 尼提什伐囉毖釤摩什伐囉\n薄底迦 鼻底迦 室隸瑟密迦 娑你般帝迦\n薩婆什伐囉 室嚧吉帝 末陀鞞達嚧制劍 阿綺嚧鉗 目佉嚧鉗\n羯唎突嚧鉗 揭囉訶揭藍 羯拏輸藍 憚多輸藍 迄唎夜輸藍\n末麼輸藍 跋唎室婆輸藍 毖栗瑟吒輸藍 烏陀囉輸藍 羯知輸藍\n跋悉帝輸藍 鄔嚧輸藍 常伽輸藍 喝悉多輸藍 跋陀輸藍\n娑房盎伽般囉丈伽輸藍 部多毖哆茶 茶耆尼什婆囉\n陀突嚧迦建咄嚧吉知婆路多毗 薩般嚧訶凌伽 輸沙怛囉 娑那羯囉\n毗沙喻迦 阿耆尼烏陀迦 末囉鞞囉建跢囉 阿迦囉蜜唎咄怛斂部迦\n地栗剌吒 毖唎瑟質迦 薩婆那俱囉 肆引伽弊揭囉唎藥叉 怛囉芻\n末囉視吠帝釤娑鞞釤 悉怛多鉢怛囉 摩訶跋闍嚧瑟尼釤\n摩訶般賴丈耆藍 夜波突陀舍喻闍那 辮怛隸拏 毗陀耶槃曇迦嚧彌\n帝殊槃曇迦嚧彌 般囉毘陀槃曇迦嚧彌 哆姪他\n唵 阿那隸 毘舍提 鞞囉跋闍囉陀唎 槃陀槃陀你 跋闍囉謗尼泮\n虎𤙖 都嚧甕泮 莎訶'
  },
  {
    id: 'qzw',
    group: 'practice',
    name: '千字文 · opening lines',
    language: 'zh',
    type: 'classic',
    text: '天地玄黃，宇宙洪荒。日月盈昃，辰宿列張。寒來暑往，秋收冬藏。'
  },
];

/* Milliseconds per item. Deliberately hardcoded and experimental —
 * change these after your first real session. */
window.Mantra.SPEEDS = {
  writing:  { slow: 4000, normal: 2500, fast: 1500 },
  chanting: { slow: 5000, normal: 3000, fast: 2000 }
};

window.Mantra.DEFAULTS = {
  mode: 'writing',
  speed: 'normal',
  progression: 'auto',
  repeat: 1
};
