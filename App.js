import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, Dimensions, ImageBackground, Linking, Modal, Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { setIsAudioActiveAsync, useAudioPlayer } from 'expo-audio';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';

const SOUND = {
  shortWhistle: require('./assets/whistle_short.mp3'),
  finishWhistle: require('./assets/whistle_finish.mp3'),
  startVoice: require('./assets/start.mp3'),
  halfVoice: require('./assets/Half.mp3'),
  alertBeep: require('./assets/alert_1.mp3'),
  intervalAlert: require('./assets/interval.mp3'),
  thirtyAlert: require('./assets/30.mp3'),
  timeup: require('./assets/voice_timeup.mp3'),
  countdown: require('./assets/voice_countdown_109876543210.mp3'),
  n1: require('./assets/voice_1.mp3'), n2: require('./assets/voice_2.mp3'), n3: require('./assets/voice_3.mp3'), n4: require('./assets/voice_4.mp3')
};
const AUDIO_PLAYER_OPTIONS = { updateInterval: 1000 };
const THEME_ASSETS = {
  cyberBg: require('./assets/theme/cyber/fab3c438-2398-43b2-b912-0af026f70468.png'),
  cyberTexture: require('./assets/theme/cyber/50b1263f-660b-4d0a-bdb3-6fcb52861bec.png'),
  cyberStrike: require('./assets/theme/cyber/da2c8d05-f1b8-47be-93e6-0ca4f4544b6a.png'),
  darkBg: require('./assets/theme/dark/9d10986c-737d-4ff1-89c6-1adeff7283b1.png'),
  lightBg: require('./assets/theme/light/9d8f8e55-07e6-4541-aa5f-1526da033991.png'),
  popBg: require('./assets/theme/pop/ChatGPT Image 2026年6月13日 14_43_47 (1).png'),
};
// SF/HUD（電撃ブルー）デザインはサイバー専用。ほかのテーマには持ち込まない。
const HUD={bg:'#01040a',cyan:'#2bd4ff',cyanBright:'#a8f4ff',line:'rgba(43,212,255,.65)',lineSoft:'rgba(43,212,255,.22)',glow:'rgba(43,212,255,.6)',panelTop:'rgba(10,30,58,.85)',panelBot:'rgba(3,10,22,.94)',text:'#eafaff',muted:'#9fc8dd',electric:'#1f9bff'};
const HUD_COLORS={ bg:HUD.bg, bgImage:THEME_ASSETS.cyberBg, overlay:['rgba(1,4,10,.25)','rgba(1,4,10,.68)'], card:'#081424', card2:'#0d2038', text:HUD.text, muted:HUD.muted, primary:HUD.cyan, danger:'#ff453a', accent:HUD.cyan, border:'rgba(43,212,255,.35)', gradTimer:['rgba(10,30,58,.85)','rgba(3,10,22,.94)'], gradBtn:['#46e2ff','#1487d8'] };
const THEMES = {
  dark: { variant:'dark', label:'ダーク', bg:'#071307', bgImage:THEME_ASSETS.darkBg, overlay:['rgba(3,14,3,.34)','rgba(2,8,2,.78)'], card:'rgba(8,28,10,.88)', card2:'rgba(18,54,18,.9)', text:'#f3ffe8', muted:'#b5d2a6', primary:'#dfffd0', danger:'#ff5a4f', accent:'#7ee35d', border:'rgba(151,230,112,.34)', gradTimer:['rgba(16,62,18,.92)','rgba(5,25,7,.94)'], gradBtn:['#8ce35f','#2f8a2f'] },
  light:{ variant:'light', label:'ライト', bg:'#f5fbff', bgImage:THEME_ASSETS.lightBg, overlay:['rgba(255,255,255,.42)','rgba(236,247,255,.72)'], card:'rgba(255,255,255,.9)', card2:'rgba(232,244,255,.92)', text:'#10243d', muted:'#60748a', primary:'#0b64d8', danger:'#e4352d', accent:'#0b74df', border:'rgba(31,111,220,.22)', gradTimer:['rgba(255,255,255,.96)','rgba(232,244,255,.96)'], gradBtn:['#2d8cff','#085fc0'] },
  pop:  { variant:'pop', label:'ポップ', bg:'#eff9ff', bgImage:THEME_ASSETS.popBg, overlay:['rgba(255,255,255,.08)','rgba(241,249,255,.62)'], card:'rgba(255,255,255,.84)', card2:'rgba(255,232,155,.9)', text:'#211f35', muted:'#6d6480', primary:'#ff8a00', danger:'#ff3f54', accent:'#ff8a00', border:'rgba(255,126,0,.28)', gradTimer:['rgba(255,255,255,.88)','rgba(255,244,218,.9)'], gradBtn:['#ffcf25','#ff7a00'] },
  cyber:{ variant:'cyber', label:'サイバー', ...HUD_COLORS }
};
const FONT_NUM='Tomorrow_900Black', FONT_ORB='Orbitron_700Bold', FONT_CP='ChakraPetch_700Bold';
const hexRgba=(hex,a)=>{ const h=hex.replace('#',''); const v=h.length===3?h.split('').map(c=>c+c).join(''):h; const n=parseInt(v,16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
const hexTint=(hex,p=0.55)=>{ const h=hex.replace('#',''); const v=h.length===3?h.split('').map(c=>c+c).join(''):h; const n=parseInt(v,16); const m=(c)=>Math.round(c+(255-c)*p); return `rgb(${m((n>>16)&255)},${m((n>>8)&255)},${m(n&255)})`; };
const SHAPES={
  dark:{panel:18,button:12,chip:14},
  light:{panel:20,button:14,chip:14},
  pop:{panel:26,button:22,chip:22},
  cyber:{panel:18,button:14,chip:14}
};
const shapeOf=(t)=>SHAPES[t?.variant]||SHAPES.dark;
function ThemeTexture(){ return null; }
function CyberButtonSkin(){ return null; }
// ハザードストライプ（パネル/ボタンの斜線装飾）
function Hz({w=78,dim,style}){ const n=Math.max(1,Math.floor(w/11)); return <View pointerEvents='none' style={[{flexDirection:'row',height:8,opacity:dim?0.4:0.85,overflow:'hidden',width:w},style]}>{Array.from({length:n}).map((_,i)=><View key={i} style={{width:5,height:8,marginRight:6,backgroundColor:HUD.cyan,transform:[{skewX:'-32deg'}]}}/>)}</View>; }
// パネル四隅: 面取り(斜めカット)の表現 + 斜辺に沿う発光アクセントバー
const CUT_COVER=23;
function Corner({pos}){
  const o=-Math.round(CUT_COVER/2);
  const cov={tl:{left:o,top:o,borderRightWidth:1.5},tr:{right:o,top:o,borderBottomWidth:1.5},br:{right:o,bottom:o,borderLeftWidth:1.5},bl:{left:o,bottom:o,borderTopWidth:1.5}}[pos];
  const bar={tl:{left:-2,top:8,transform:[{rotate:'-45deg'}]},tr:{right:-2,top:8,transform:[{rotate:'45deg'}]},bl:{left:-2,bottom:8,transform:[{rotate:'45deg'}]},br:{right:-2,bottom:8,transform:[{rotate:'-45deg'}]}}[pos];
  return <>
    <View pointerEvents='none' style={[cyberHud.cover,cov,{transform:[{rotate:'45deg'}]}]}/>
    <View pointerEvents='none' style={[cyberHud.cornerBar,bar]}/>
  </>;
}
// HUDパネル: グラデ背景 + 二重枠(外枠+内側ヘアライン) + 面取りコーナー + グロウ
function HudPanel({style,children,stripes,t}){
  const shape=shapeOf(t);
  if(t){
    return <View style={[{
      marginTop:12,
      padding:16,
      borderRadius:shape.panel,
      borderWidth:1,
      borderColor:t.border,
      backgroundColor:t.card,
      shadowColor:'#000',
      shadowOffset:{width:0,height:4},
      shadowOpacity:t.variant==='light'?0.12:0.28,
      shadowRadius:t.variant==='pop'?12:10,
      elevation:3
    },style]}>{children}</View>;
  }
  return <LinearGradient colors={['rgba(3,8,22,.92)','rgba(7,32,76,.86)','rgba(1,6,18,.96)']} start={{x:0,y:0}} end={{x:1,y:1}} style={[cyberHud.panel,style]}>
    <ThemeTexture source={THEME_ASSETS.cyberTexture} opacity={0.18}/>
    <LinearGradient pointerEvents='none' colors={['rgba(0,229,255,.12)','rgba(0,0,0,0)','rgba(15,80,180,.16)']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
    <View pointerEvents='none' style={cyberHud.hairline}/>
    {stripes&&<><Hz dim w={52} style={{position:'absolute',top:9,left:26}}/><Hz dim w={40} style={{position:'absolute',top:9,right:26}}/></>}
    {children}
    <Corner pos='tl'/><Corner pos='tr'/><Corner pos='bl'/><Corner pos='br'/>
  </LinearGradient>;
}
// 背景FX: 回路グリッド + 斜めブラシストローク + 発光スリヴァー
function ScreenFX({t}){
  const {width:W,height:H}=Dimensions.get('window');
  const base = t?.bgImage ? <ImageBackground source={t.bgImage} resizeMode='cover' style={StyleSheet.absoluteFill}/> : null;
  const overlayColors = t?.overlay || ['rgba(0,0,0,0)','rgba(0,0,0,.2)'];
  if(t&&t.variant==='light'){
    return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {base}
      <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill}/>
      <View style={{position:'absolute',left:-60,top:90,width:230,height:230,borderRadius:115,backgroundColor:'rgba(11,100,160,.06)'}}/>
      <View style={{position:'absolute',right:-80,bottom:180,width:260,height:260,borderRadius:130,backgroundColor:'rgba(255,181,71,.10)'}}/>
    </View>;
  }
  if(t&&t.variant==='pop'){
    return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {base}
      <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill}/>
      <View style={{position:'absolute',left:-34,top:120,width:150,height:150,borderRadius:34,backgroundColor:'rgba(255,107,157,.10)',transform:[{rotate:'-16deg'}]}}/>
      <View style={{position:'absolute',right:-26,top:320,width:130,height:130,borderRadius:65,backgroundColor:'rgba(255,204,51,.20)'}}/>
    </View>;
  }
  if(t&&t.variant==='dark'){
    return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {base}
      <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill}/>
      <View style={{position:'absolute',left:0,right:0,top:0,height:220,backgroundColor:'rgba(126,227,93,.06)'}}/>
      <View style={{position:'absolute',left:18,right:18,top:130,height:1,backgroundColor:'rgba(210,255,190,.12)'}}/>
    </View>;
  }
  if(t&&t.variant==='cyber'){
    return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {base}
      <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill}/>
      <View style={{position:'absolute',left:0,right:0,top:0,height:220,backgroundColor:'rgba(43,160,255,.08)'}}/>
      <View style={{position:'absolute',left:20,right:20,top:132,height:1,backgroundColor:'rgba(168,244,255,.14)'}}/>
    </View>;
  }
  const cols=[]; for(let x=36;x<W;x+=36)cols.push(x);
  const rows=[]; for(let y=36;y<H;y+=36)rows.push(y);
  return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
    {base}
    <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill}/>
    <LinearGradient colors={['rgba(13,48,92,.5)','rgba(4,12,24,0)']} style={{position:'absolute',left:0,right:0,top:0,height:Math.round(H*0.45)}}/>
    {cols.map(x=><View key={'c'+x} style={[cyberHud.gridV,{left:x}]}/>)}
    {rows.map(y=><View key={'r'+y} style={[cyberHud.gridH,{top:y}]}/>)}
    <LinearGradient colors={['rgba(38,140,255,0)','rgba(38,140,255,.5)','rgba(120,220,255,.7)','rgba(38,140,255,.4)','rgba(38,140,255,0)']} start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={{position:'absolute',width:340,height:90,right:-120,top:-18,transform:[{rotate:'-32deg'}],opacity:.5}}/>
    <LinearGradient colors={['rgba(38,140,255,0)','rgba(38,140,255,.45)','rgba(140,225,255,.55)','rgba(38,140,255,0)']} start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={{position:'absolute',width:240,height:46,left:-110,top:300,transform:[{rotate:'-30deg'}],opacity:.45}}/>
    <LinearGradient colors={['rgba(30,120,240,0)','rgba(30,120,240,.4)','rgba(110,210,255,.5)','rgba(30,120,240,0)']} start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={{position:'absolute',width:300,height:60,right:-130,top:620,transform:[{rotate:'-28deg'}],opacity:.45}}/>
    <View style={[cyberHud.gbar,{width:130,right:-10,top:64,transform:[{rotate:'-32deg'}]}]}/>
    <View style={[cyberHud.gbar,{width:90,left:-6,top:360,transform:[{rotate:'-30deg'}]}]}/>
    <View style={[cyberHud.gbar,{width:120,right:6,top:670,transform:[{rotate:'-28deg'}]}]}/>
  </View>;
}
const cyberHud=StyleSheet.create({
  panel:{position:'relative',marginTop:14,padding:18,borderWidth:1.5,borderColor:HUD.line,backgroundColor:'#061224',shadowColor:HUD.electric,shadowOffset:{width:0,height:0},shadowOpacity:0.5,shadowRadius:10,elevation:6,overflow:'hidden'},
  hairline:{position:'absolute',left:6,right:6,top:6,bottom:6,borderWidth:1,borderColor:HUD.lineSoft},
  cover:{position:'absolute',width:CUT_COVER,height:CUT_COVER,backgroundColor:'#020711',borderColor:HUD.line},
  cornerBar:{position:'absolute',width:24,height:3,backgroundColor:'#bdf3ff',shadowColor:HUD.cyan,shadowOffset:{width:0,height:0},shadowOpacity:0.9,shadowRadius:6,zIndex:3},
  gridV:{position:'absolute',top:0,bottom:0,width:1,backgroundColor:'rgba(43,160,255,.07)'},
  gridH:{position:'absolute',left:0,right:0,height:1,backgroundColor:'rgba(43,160,255,.07)'},
  gbar:{position:'absolute',height:3,backgroundColor:'#7fdcff',opacity:.8,shadowColor:'#6ed7ff',shadowOffset:{width:0,height:0},shadowOpacity:0.8,shadowRadius:8},
  lockLineTop:{position:'absolute',left:10,top:5,width:42,height:2,backgroundColor:'#e9fbff',opacity:.9,shadowColor:HUD.cyan,shadowOffset:{width:0,height:0},shadowOpacity:1,shadowRadius:6,transform:[{skewX:'-26deg'}]},
  lockLineBottom:{position:'absolute',right:10,bottom:5,width:42,height:2,backgroundColor:'#21dfff',opacity:.82,shadowColor:HUD.cyan,shadowOffset:{width:0,height:0},shadowOpacity:1,shadowRadius:6,transform:[{skewX:'-26deg'}]},
  // タイマー: ステッパー / 数字 / レーダー背景
  timerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6,minHeight:100},
  radarWrap:{position:'absolute',left:'50%',top:'50%'},
  radar:{position:'absolute',borderWidth:1,borderColor:'rgba(43,170,255,.12)'},
  stepBtn:{width:58,height:96,alignItems:'center',justifyContent:'center',gap:2,borderWidth:1.5,borderColor:HUD.line,backgroundColor:'rgba(7,20,38,.9)',shadowColor:HUD.electric,shadowOffset:{width:0,height:0},shadowOpacity:0.4,shadowRadius:6,elevation:4,overflow:'hidden'},
  stepBtnSm:{width:54,height:64,alignItems:'center',justifyContent:'center',gap:2,borderWidth:1.5,borderColor:HUD.line,backgroundColor:'rgba(7,20,38,.9)',shadowColor:HUD.electric,shadowOffset:{width:0,height:0},shadowOpacity:0.4,shadowRadius:6,elevation:4,overflow:'hidden'},
  stepSign:{fontFamily:FONT_CP,fontSize:28,lineHeight:32,color:HUD.cyanBright},
  stepSignSm:{fontFamily:FONT_CP,fontSize:28,lineHeight:32,color:HUD.cyanBright},
  stepUnit:{fontSize:13,fontWeight:'900',color:'#dff2fc'},
  timeEditor:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',minWidth:0},
  timePart:{position:'relative',paddingHorizontal:2},
  timeEdit:{fontFamily:FONT_NUM,fontSize:54,color:'#f4fcff',fontVariant:['tabular-nums'],textShadowColor:'rgba(120,200,255,.9)',textShadowOffset:{width:0,height:0},textShadowRadius:16},
  timeEditSel:{color:HUD.cyan,textShadowColor:HUD.glow},
  timeEditSep:{fontFamily:FONT_NUM,fontSize:54,color:'#cfeeff',paddingHorizontal:1,textShadowColor:'rgba(120,200,255,.9)',textShadowOffset:{width:0,height:0},textShadowRadius:16},
  selBar:{position:'absolute',left:2,right:2,bottom:-7,height:5,backgroundColor:HUD.cyan,shadowColor:HUD.cyan,shadowOffset:{width:0,height:0},shadowOpacity:1,shadowRadius:8},
  time:{flex:1,textAlign:'center',fontFamily:FONT_NUM,fontSize:64,color:'#f4fcff',fontVariant:['tabular-nums'],textShadowColor:'rgba(120,200,255,.9)',textShadowOffset:{width:0,height:0},textShadowRadius:18,marginVertical:6},
  timeRunning:{fontSize:86},
  // アクションボタン
  actionRow:{flexDirection:'row',gap:12,marginTop:18},
  startBtn:{position:'relative',flex:1.8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingVertical:16,borderWidth:2,borderColor:HUD.cyan,backgroundColor:'rgba(14,52,96,.95)',shadowColor:HUD.cyan,shadowOffset:{width:0,height:0},shadowOpacity:0.65,shadowRadius:14,elevation:7,overflow:'hidden'},
  startBtnSm:{flex:1,paddingVertical:11,gap:7},
  startText:{color:HUD.cyanBright,fontSize:21,fontWeight:'900',fontStyle:'italic',letterSpacing:2,textShadowColor:HUD.glow,textShadowOffset:{width:0,height:0},textShadowRadius:12},
  startTextSm:{fontSize:16,letterSpacing:1},
  ghostBtn:{position:'relative',flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:16,borderWidth:1.5,borderColor:'rgba(43,180,255,.45)',backgroundColor:'rgba(5,14,28,.8)',overflow:'hidden'},
  ghostText:{color:'#dff2fc',fontSize:16,fontWeight:'900'},
  endBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:16,borderWidth:1.5,borderColor:'#ff453a',backgroundColor:'rgba(40,8,8,.8)'},
  endText:{color:'#ffb3ad',fontSize:16,fontWeight:'900'},
  // ステータスピル
  phaseRow:{alignItems:'center',justifyContent:'flex-end',flex:1,flexDirection:'row'},
  phase:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:16,paddingVertical:6,borderWidth:2,borderColor:HUD.cyan,backgroundColor:'rgba(8,24,44,.9)'},
  phaseText:{color:HUD.cyanBright,fontSize:14,fontWeight:'900',letterSpacing:2},
  // セクション見出し（試合パネル）
  secHead:{flexDirection:'row',alignItems:'center',gap:11},
  secIc:{width:40,height:40,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:'rgba(43,200,255,.5)',backgroundColor:'rgba(14,44,80,.9)',overflow:'hidden'},
  secTitle:{flex:1,color:'#fff',fontSize:20,fontWeight:'900'},
  editBtn:{width:50,height:46,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:HUD.line,backgroundColor:'rgba(7,20,38,.9)',overflow:'hidden'},
  // チームチップ（国旗スウォッチ + 極太数字）
  versus:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:14,marginTop:16,marginBottom:4},
  versusSm:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:6},
  chip:{minWidth:130,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingHorizontal:16,paddingVertical:10,borderWidth:2,shadowOffset:{width:0,height:0},shadowOpacity:0.5,shadowRadius:10,elevation:5},
  chipSm:{minWidth:96,paddingHorizontal:12,paddingVertical:7,gap:8},
  chipSide:{alignItems:'center',gap:6},
  flag:{width:30,height:20,borderRadius:2,borderWidth:1,borderColor:'rgba(255,255,255,.55)',shadowOffset:{width:0,height:0},shadowOpacity:0.8,shadowRadius:8},
  flagSm:{width:22,height:14},
  chipLbl:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#e8f7ff',opacity:.85},
  chipLblSm:{fontSize:10},
  chipNum:{fontFamily:FONT_NUM,textShadowOffset:{width:0,height:0},textShadowRadius:16},
  vsBig:{fontFamily:FONT_CP,fontStyle:'italic',fontSize:24,color:HUD.cyan,textShadowColor:HUD.glow,textShadowOffset:{width:0,height:0},textShadowRadius:10},
  vsSm:{fontFamily:FONT_CP,fontStyle:'italic',fontSize:17,color:HUD.cyan,textShadowColor:HUD.glow,textShadowOffset:{width:0,height:0},textShadowRadius:8},
  // 前/次（左下・右下に小さく）
  matchNav:{flexDirection:'row',justifyContent:'space-between',marginTop:14},
  navBtn:{position:'relative',width:84,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:8,borderWidth:1.5,borderColor:'rgba(43,180,255,.45)',backgroundColor:'rgba(5,14,28,.8)',overflow:'hidden'},
  navBtnWide:{width:110},
  navText:{color:'#dff2fc',fontSize:12.5,fontWeight:'900'},
  navSpacer:{width:84},
  // フッター ウォーターマーク
  wm:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:22},
  wmText:{fontFamily:FONT_ORB,fontSize:10,letterSpacing:3,color:'rgba(140,215,255,.6)'},
  // コートカード（2面）
  courtPanel:{padding:12},
  courtPanelActive:{borderColor:HUD.cyan,shadowOpacity:0.8,elevation:9},
});
function makeHud(t){
  const isPop=t.variant==='pop';
  const isLight=t.variant==='light';
  const shape=shapeOf(t);
  const radius=shape.button;
  const panelShadow=isLight?0.08:0.22;
  return StyleSheet.create({
    timerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,minHeight:96},
    radarWrap:{display:'none'},
    radar:{display:'none'},
    stepBtn:{width:58,height:88,alignItems:'center',justifyContent:'center',gap:2,borderRadius:radius,borderWidth:1.5,borderColor:t.border,backgroundColor:t.card2,shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:panelShadow,shadowRadius:6,elevation:2},
    stepBtnSm:{width:54,height:62,alignItems:'center',justifyContent:'center',gap:2,borderRadius:radius,borderWidth:1.5,borderColor:t.border,backgroundColor:t.card2,shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:panelShadow,shadowRadius:6,elevation:2},
    stepSign:{fontFamily:FONT_CP,fontSize:28,lineHeight:32,color:t.accent},
    stepSignSm:{fontFamily:FONT_CP,fontSize:28,lineHeight:32,color:t.accent},
    stepUnit:{fontSize:13,fontWeight:'900',color:t.muted},
    timeEditor:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',minWidth:0},
    timePart:{position:'relative',paddingHorizontal:2},
    timeEdit:{fontFamily:FONT_NUM,fontSize:54,color:t.text,fontVariant:['tabular-nums']},
    timeEditSel:{color:t.accent},
    timeEditSep:{fontFamily:FONT_NUM,fontSize:54,color:t.muted,paddingHorizontal:1},
    selBar:{position:'absolute',left:2,right:2,bottom:-7,height:4,borderRadius:4,backgroundColor:t.accent},
    time:{flex:1,textAlign:'center',fontFamily:FONT_NUM,fontSize:64,color:t.text,fontVariant:['tabular-nums'],marginVertical:6},
    timeRunning:{fontSize:86,color:t.accent},
    clock:{fontFamily:FONT_NUM,fontSize:32,color:t.muted,fontVariant:['tabular-nums'],letterSpacing:1},
    actionRow:{flexDirection:'row',gap:12,marginTop:18},
    startBtn:{flex:1.8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,paddingVertical:16,borderRadius:radius,borderWidth:isPop?2:0,borderColor:isPop?'#fff7d2':'transparent',backgroundColor:t.accent,shadowColor:t.accent,shadowOffset:{width:0,height:5},shadowOpacity:isLight?0.22:0.36,shadowRadius:10,elevation:4},
    startBtnSm:{flex:1,paddingVertical:11,gap:7},
    startText:{color:isPop?'#2d2330':'#ffffff',fontSize:21,fontWeight:'900',fontStyle:isPop?'normal':'italic',letterSpacing:isPop?0.5:1.2},
    startTextSm:{fontSize:16,letterSpacing:0.5},
    ghostBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:16,borderRadius:radius,borderWidth:1,borderColor:t.border,backgroundColor:t.card2},
    ghostText:{color:t.text,fontSize:16,fontWeight:'900'},
    endBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:16,borderRadius:radius,borderWidth:0,backgroundColor:t.danger},
    endText:{color:'#fff',fontSize:16,fontWeight:'900'},
    clockRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
    phase:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:16,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:t.border,backgroundColor:t.card2},
    phaseText:{color:t.accent,fontSize:14,fontWeight:'900',letterSpacing:1},
    secHead:{flexDirection:'row',alignItems:'center',gap:11},
    secIc:{width:40,height:40,borderRadius:shape.button,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.border,backgroundColor:t.card2},
    secTitle:{flex:1,color:t.text,fontSize:20,fontWeight:'900'},
    editBtn:{width:50,height:46,borderRadius:shape.button,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.border,backgroundColor:t.card2},
    versus:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:14,marginTop:16,marginBottom:4},
    versusSm:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:6},
    chip:{minWidth:130,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingHorizontal:16,paddingVertical:10,borderRadius:shape.chip,borderWidth:3,shadowOffset:{width:0,height:3},shadowOpacity:isLight?0.12:0.32,shadowRadius:8,elevation:3},
    chipSm:{minWidth:86,paddingHorizontal:10,paddingVertical:6,gap:7},
    chipSide:{alignItems:'center',gap:6},
    flag:{width:30,height:20,borderRadius:6,borderWidth:1,borderColor:'rgba(255,255,255,.65)'},
    flagSm:{width:20,height:13},
    chipLbl:{fontSize:12,fontWeight:'900',letterSpacing:0.5,color:t.text,opacity:.78},
    chipLblSm:{fontSize:10},
    chipNum:{fontFamily:FONT_NUM},
    vsBig:{fontFamily:FONT_CP,fontStyle:'italic',fontSize:24,color:t.accent},
    vsSm:{fontFamily:FONT_CP,fontStyle:'italic',fontSize:17,color:t.accent},
    matchNav:{flexDirection:'row',justifyContent:'space-between',marginTop:14},
    navBtn:{width:84,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:8,borderRadius:shape.button,borderWidth:1,borderColor:t.border,backgroundColor:t.card2},
    navBtnWide:{width:110},
    navText:{color:t.text,fontSize:12.5,fontWeight:'900'},
    navSpacer:{width:84},
    wm:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:22},
    wmText:{fontFamily:FONT_ORB,fontSize:10,letterSpacing:3,color:t.muted},
    courtPanel:{padding:10},
    courtPanelActive:{borderColor:t.accent,elevation:4},
  });
}
const SND_DEFAULT = {start:'both', half:'both', interval:'both', finish:'both', countdown:'voice'};
const LEGACY_SND_DEFAULT = {start:'whistle', half:'whistle', interval:'whistle', finish:'whistle', countdown:'none'};
// ビブスでよく使う色（チーム1〜7に割り当て）
const BIB_COLORS = ['#e53935','#fb8c00','#fdd835','#43a047','#00acc1','#1e88e5','#3949ab','#8e24aa','#ec407a','#6d4c41','#000000','#ffffff','#9e9e9e'];
const DEFAULT_TEAM_COLORS = ['#e53935','#1e88e5','#43a047','#fdd835','#fb8c00','#ec407a','#8e24aa'];
const LIGHT_SWATCH = ['#fdd835','#ffffff'];
const teamNum=(name)=>{ const i=TEAM_NAMES.indexOf(name); return i>=0?i+1:''; };
const DEFAULTS = {
  dark:{seconds:240, alertMode:'half', intervalMin:1, notify30:true, enableGoalkeeperSubOnHalf:true, enableGoalkeeperSubOnInterval:false, sounds:{...SND_DEFAULT}, teamColors:[...DEFAULT_TEAM_COLORS]},
  light:{seconds:480, alertMode:'minute', intervalMin:2, notify30:true, enableGoalkeeperSubOnHalf:true, enableGoalkeeperSubOnInterval:false, sounds:{...SND_DEFAULT}, teamColors:[...DEFAULT_TEAM_COLORS]},
  pop:{seconds:240, alertMode:'half', intervalMin:1, notify30:true, enableGoalkeeperSubOnHalf:true, enableGoalkeeperSubOnInterval:false, sounds:{...SND_DEFAULT}, teamColors:[...DEFAULT_TEAM_COLORS]},
  cyber:{seconds:480, alertMode:'minute', intervalMin:2, notify30:true, enableGoalkeeperSubOnHalf:true, enableGoalkeeperSubOnInterval:false, sounds:{...SND_DEFAULT}, teamColors:[...DEFAULT_TEAM_COLORS]}
};
// イベント音の設定: 'whistle' | 'voice' | 'both' | 'none'
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const fmt = (s)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const labelTime = (s)=>{ const m=Math.floor(s/60), sec=s%60; if(sec===0)return `${m}分`; if(m===0)return `${sec}秒`; return `${m}分${sec}秒`; };
const DRAWER_W = Math.round(Dimensions.get('window').width*0.82);
const TEAM_NAMES = ['チーム1','チーム2','チーム3','チーム4','チーム5','チーム6','チーム7'];
const COMBO_DEFAULTS = {
  dark: { enabled:true, teams:3, courts:1 },
  light:{ enabled:true, teams:3, courts:1 },
  pop:  { enabled:true, teams:4, courts:1 },
  cyber:{ enabled:true, teams:3, courts:1 }
};
const COMBO_DEFAULT = COMBO_DEFAULTS.dark;
const comboDefaultForTheme=(theme)=>COMBO_DEFAULTS[theme]||COMBO_DEFAULT;
// コート数で選べるチーム数が変わる: 1面=2,3,4 / 2面=4,5,6,7
const COURT_TEAMS = { 1:[2,3,4], 2:[4,5,6,7] };
function normalizeCombo(c){ const n={...c}; n.enabled=true; if(n.courts!==1&&n.courts!==2)n.courts=1; const allowed=COURT_TEAMS[n.courts]; if(!allowed.includes(n.teams)) n.teams=allowed.reduce((b,v)=>Math.abs(v-n.teams)<Math.abs(b-n.teams)?v:b,allowed[0]); return n; }
function generateMatchRounds(teamCount, courtCount, teams=TEAM_NAMES){
  const T=(n)=>teams[n-1];
  const C=(court,h,a)=>({court,home:T(h),away:T(a)});
  if(courtCount===1&&teamCount===2) return [
    {round:1,courts:[C('A',1,2)]}];
  if(courtCount===1&&teamCount===3) return [
    {round:1,courts:[C('A',1,2)]},{round:2,courts:[C('A',1,3)]},{round:3,courts:[C('A',2,3)]}];
  if(courtCount===1&&teamCount===4) return [
    {round:1,courts:[C('A',1,2)]},{round:2,courts:[C('A',3,4)]},{round:3,courts:[C('A',1,3)]},
    {round:4,courts:[C('A',2,4)]},{round:5,courts:[C('A',1,4)]},{round:6,courts:[C('A',2,3)]}];
  if(courtCount===2&&teamCount===4) return [
    {round:1,courts:[C('A',1,2),C('B',3,4)]},{round:2,courts:[C('A',1,3),C('B',2,4)]},{round:3,courts:[C('A',1,4),C('B',2,3)]}];
  if(courtCount===2&&teamCount===5) return [
    {round:1,courts:[C('A',1,2),C('B',3,4)],rest:[T(5)]},
    {round:2,courts:[C('A',1,3),C('B',2,5)],rest:[T(4)]},
    {round:3,courts:[C('A',1,4),C('B',3,5)],rest:[T(2)]},
    {round:4,courts:[C('A',1,5),C('B',2,4)],rest:[T(3)]},
    {round:5,courts:[C('A',2,3),C('B',4,5)],rest:[T(1)]}];
  if(courtCount===2&&teamCount===6) return [
    {round:1,courts:[C('A',1,2),C('B',3,4)],rest:[T(5),T(6)]},
    {round:2,courts:[C('A',5,6),C('B',1,3)],rest:[T(2),T(4)]},
    {round:3,courts:[C('A',2,4),C('B',1,5)],rest:[T(3),T(6)]},
    {round:4,courts:[C('A',3,6),C('B',1,4)],rest:[T(2),T(5)]},
    {round:5,courts:[C('A',2,5),C('B',3,4)],rest:[T(1),T(6)]}];
  if(courtCount===2&&teamCount===7) return [
    {round:1,courts:[C('A',1,2),C('B',3,4)],rest:[T(5),T(6),T(7)]},
    {round:2,courts:[C('A',5,6),C('B',1,3)],rest:[T(2),T(4),T(7)]},
    {round:3,courts:[C('A',4,7),C('B',2,5)],rest:[T(1),T(3),T(6)]},
    {round:4,courts:[C('A',1,6),C('B',3,7)],rest:[T(2),T(4),T(5)]},
    {round:5,courts:[C('A',2,4),C('B',5,7)],rest:[T(1),T(3),T(6)]},
    {round:6,courts:[C('A',1,4),C('B',3,6)],rest:[T(2),T(5),T(7)]},
    {round:7,courts:[C('A',2,7),C('B',4,5)],rest:[T(1),T(3),T(6)]},
    {round:8,courts:[C('A',1,5),C('B',6,7)],rest:[T(2),T(3),T(4)]},
    {round:9,courts:[C('A',2,3),C('B',4,6)],rest:[T(1),T(5),T(7)]},
    {round:10,courts:[C('A',1,7),C('B',3,5)],rest:[T(2),T(4),T(6)]},
    {round:11,courts:[C('A',2,6)],rest:[T(1),T(3),T(4),T(5),T(7)]}];
  return [];
}

export default function App(){
  const fontsLoaded=true;
  const fontsError=null;
  const [themeName,setThemeName]=useState('dark');
  const [settings,setSettings]=useState(DEFAULTS);
  const [status,setStatus]=useState('ready');
  const [baseSeconds,setBaseSeconds]=useState(240);
  const [remaining,setRemaining]=useState(240);
  const [showSettings,setShowSettings]=useState(false);
  const [showCombo,setShowCombo]=useState(false);
  const [showSchedule,setShowSchedule]=useState(false);
  const [colorPickerTeam,setColorPickerTeam]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [adjustMode,setAdjustMode]=useState('min');
  const [combo,setCombo]=useState(comboDefaultForTheme('dark'));
  const [comboByTheme,setComboByTheme]=useState({});
  const [roundByTheme,setRoundByTheme]=useState({});
  const [roundIndex,setRoundIndex]=useState(0);
  const [testingSound,setTestingSound]=useState(null);
  const [statusB,setStatusB]=useState('ready');
  const [remainingB,setRemainingB]=useState(240);
  const [activeCourt,setActiveCourt]=useState('A');
  const [clock,setClock]=useState('');
  const matchRounds=useMemo(()=>combo.enabled?generateMatchRounds(combo.teams,combo.courts):[],[combo.enabled,combo.teams,combo.courts]);
  const totalRounds=matchRounds.length;
  const endAt=useRef(null), timer=useRef(null), halfDone=useRef(false), lastMinute=useRef(null), countdownDone=useRef(false);
  const thirtyDone=useRef(false);
  const endAtB=useRef(null), timerB=useRef(null), halfDoneB=useRef(false), lastMinuteB=useRef(null), countdownDoneB=useRef(false), thirtyDoneB=useRef(false);
  const activeCourtRef=useRef('A'), twoCourtRef=useRef(false);
  const testTimer=useRef(null);
  const updateByClockRef=useRef(null), updateByClockBRef=useRef(null);
  const theme=THEMES[themeName], cur=settings[themeName] || DEFAULTS[themeName];
  const isTwo=combo.enabled&&combo.courts===2;
  const anyRunning=status==='running'||(isTwo&&statusB==='running');
  useEffect(()=>{ activeCourtRef.current=activeCourt; },[activeCourt]);
  useEffect(()=>{ const tick=()=>{ const d=new Date(); setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`); }; tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id); },[]);
  useEffect(()=>{ twoCourtRef.current=isTwo; if(!isTwo){ clearInterval(timerB.current); timerB.current=null; endAtB.current=null; setStatusB('ready'); setActiveCourt('A'); } },[isTwo]);
  const s=styles(theme);
  const hud=useMemo(()=>makeHud(theme),[theme]);
  const drawerAnim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{ Animated.timing(drawerAnim,{toValue:showSettings?1:0,duration:220,useNativeDriver:true}).start(); },[showSettings,drawerAnim]);
  const drawerX=drawerAnim.interpolate({inputRange:[0,1],outputRange:[DRAWER_W,0]});
  const backdropOpacity=drawerAnim.interpolate({inputRange:[0,1],outputRange:[0,0.5]});
  const shortWhistle=useAudioPlayer(SOUND.shortWhistle,AUDIO_PLAYER_OPTIONS), finishWhistle=useAudioPlayer(SOUND.finishWhistle,AUDIO_PLAYER_OPTIONS);
  const startVoice=useAudioPlayer(SOUND.startVoice,AUDIO_PLAYER_OPTIONS);
  const halfVoice=useAudioPlayer(SOUND.halfVoice,AUDIO_PLAYER_OPTIONS), alertBeep=useAudioPlayer(SOUND.alertBeep,AUDIO_PLAYER_OPTIONS), intervalAlert=useAudioPlayer(SOUND.intervalAlert,AUDIO_PLAYER_OPTIONS), thirtyAlert=useAudioPlayer(SOUND.thirtyAlert,AUDIO_PLAYER_OPTIONS);
  const timeup=useAudioPlayer(SOUND.timeup,AUDIO_PLAYER_OPTIONS), countdown=useAudioPlayer(SOUND.countdown,AUDIO_PLAYER_OPTIONS);
  const nums={1:useAudioPlayer(SOUND.n1,AUDIO_PLAYER_OPTIONS),2:useAudioPlayer(SOUND.n2,AUDIO_PLAYER_OPTIONS),3:useAudioPlayer(SOUND.n3,AUDIO_PLAYER_OPTIONS),4:useAudioPlayer(SOUND.n4,AUDIO_PLAYER_OPTIONS)};
  const previewPlayers=[shortWhistle,finishWhistle,startVoice,halfVoice,alertBeep,intervalAlert,thirtyAlert,timeup,countdown,...Object.values(nums)];
  useEffect(()=>{ void setIsAudioActiveAsync(true).catch(()=>{}); },[]);
  const play=(p)=>{ if(!p) return; try{ void p.seekTo(0).catch(()=>{}); const result=p.play(); if(result?.catch) result.catch(e=>console.warn('🔊 play error:', e)); }catch(e){ console.warn('🔊 play error:', e); } };
  const stopPreviewPlayers=()=>{ if(testTimer.current){ clearTimeout(testTimer.current); testTimer.current=null; } previewPlayers.forEach((p)=>{ try{ p.pause(); }catch(e){} try{ void p.seekTo(0).catch(()=>{}); }catch(e){} }); setTestingSound(null); };
  const sndOf=(ev)=>(cur.sounds&&cur.sounds[ev])||'none';
  const evWhistle=(ev)=>{const m=sndOf(ev);return m==='whistle'||m==='both';};
  const evVoice=(ev)=>{const m=sndOf(ev);return m==='voice'||m==='both';};
  // 残り時間アナウンスは「1〜4分ちょうど」のときだけ voice_1〜4 を鳴らす（合成「あと○分」は廃止）
  const speakRemaining=(sec,delay=0)=>{
    const min=Math.ceil(sec/60);
    if(sec%60===0 && min>=1 && min<=4){
      setTimeout(()=>play(nums[min]),delay);
      return 900;
    }
    return 0;
  };

  useEffect(()=>{ (async()=>{ const t=await AsyncStorage.getItem('selectedTheme'); const raw=await AsyncStorage.getItem('settingsByTheme'); const saved=raw?JSON.parse(raw):{}; const nextTheme=t||'dark';
    const nextSettings={}; for(const k of Object.keys(DEFAULTS)){ const sv=saved[k]||{}; const savedSounds=sv.sounds||{}; const legacySounds=Object.keys(LEGACY_SND_DEFAULT).every((key)=>savedSounds[key]===LEGACY_SND_DEFAULT[key]); const tc=Array.isArray(sv.teamColors)?DEFAULT_TEAM_COLORS.map((d,i)=>sv.teamColors[i]||d):[...DEFAULTS[k].teamColors]; nextSettings[k]={...DEFAULTS[k],...sv,sounds:legacySounds?{...DEFAULTS[k].sounds}:{...DEFAULTS[k].sounds,...savedSounds},teamColors:tc}; }
    setThemeName(nextTheme); setSettings(nextSettings); const sec=nextSettings[nextTheme].seconds; setBaseSeconds(sec); setRemaining(sec); setRemainingB(sec);
    const rawCombo=await AsyncStorage.getItem('comboSettingsByTheme'); const savedCombos=rawCombo?JSON.parse(rawCombo):{};
    if(!rawCombo){ const legacyCombo=await AsyncStorage.getItem('comboSettings'); if(legacyCombo){ try{ savedCombos[nextTheme]=JSON.parse(legacyCombo); }catch(e){} } }
    if(savedCombos.cyber?.teams===6&&savedCombos.cyber?.courts===2) savedCombos.cyber={...comboDefaultForTheme('cyber')};
    const nextCombos={}; for(const k of Object.keys(DEFAULTS)){ nextCombos[k]=normalizeCombo({...comboDefaultForTheme(k), ...(savedCombos[k]||{})}); }
    setComboByTheme(nextCombos); setCombo(nextCombos[nextTheme]||comboDefaultForTheme(nextTheme));
    const rawRound=await AsyncStorage.getItem('comboRoundByTheme'); const savedRounds=rawRound?JSON.parse(rawRound):{};
    if(!rawRound){ const legacyRound=await AsyncStorage.getItem('comboRound'); if(legacyRound!=null){ const r=parseInt(legacyRound,10); if(!isNaN(r)) savedRounds[nextTheme]=r; } }
    setRoundByTheme(savedRounds); setRoundIndex(typeof savedRounds[nextTheme]==='number'?savedRounds[nextTheme]:0);
    setLoaded(true); })(); },[]);
  useEffect(()=>{ AsyncStorage.setItem('selectedTheme',themeName); AsyncStorage.setItem('settingsByTheme',JSON.stringify(settings)); },[themeName,settings]);
  useEffect(()=>{ if(loaded) AsyncStorage.setItem('comboSettingsByTheme',JSON.stringify(comboByTheme)); },[comboByTheme,loaded]);
  useEffect(()=>{ if(loaded) AsyncStorage.setItem('comboRoundByTheme',JSON.stringify(roundByTheme)); },[roundByTheme,loaded]);
  useEffect(()=>{ if(!loaded) return; const nextCombo=comboByTheme[themeName]||comboDefaultForTheme(themeName); setCombo(normalizeCombo(nextCombo)); setRoundIndex(typeof roundByTheme[themeName]==='number'?roundByTheme[themeName]:0); },[themeName,loaded,comboByTheme,roundByTheme]);
  useEffect(()=>{ (async()=>{ try{ await notifee.requestPermission(); if(Platform.OS==='android'){ await notifee.createChannel({id:'timer-live',name:'タイマー常駐',importance:AndroidImportance.LOW}); await notifee.createChannel({id:'timeup',name:'タイムアップ',importance:AndroidImportance.HIGH}); } }catch(e){} })(); },[]);
  // setInterval が古いクロージャ（古い設定）を呼び続けないよう、毎レンダリングで最新の更新関数を ref に反映する
  useEffect(()=>{ updateByClockRef.current=updateByClock; updateByClockBRef.current=updateByClockB; });
  useEffect(()=>{ const sub=AppState.addEventListener('change',(st)=>{ if(st==='active'){ updateByClock(); updateByClockB(); clearNotifications(); } else { const ae=activeEnd(); if(ae){ showOngoing(); scheduleFinish(); } } }); return()=>sub.remove(); });
  useEffect(()=>()=>{ stopPreviewPlayers(); },[]);

  function activeEnd(){ return activeCourtRef.current==='B'?endAtB.current:endAt.current; }
  async function showOngoing(){
    const end=activeEnd(); if(!end || AppState.currentState==='active')return;
    const ms=end-Date.now(); const label=twoCourtRef.current?`コート${activeCourtRef.current} 実行中`:'実行中';
    try{ await notifee.displayNotification({ id:'futsal-timer', title:'フットサルタイマー', body:label, android:{ channelId:'timer-live', ongoing:true, onlyAlertOnce:true, showChronometer:true, chronometerDirection:'down', timestamp:end, timeoutAfter:Math.max(1000,ms+10000), pressAction:{id:'default'} } }); }catch(e){}
  }
  async function dismissOngoing(){ try{ await notifee.cancelNotification('futsal-timer'); }catch(e){} }
  async function scheduleFinish(){
    const when=activeEnd(); if(!when || AppState.currentState==='active')return; if(when-Date.now()<=0)return;
    try{ await notifee.createTriggerNotification({ id:'futsal-finish', title:'タイムアップ', body:'試合が終了しました', android:{ channelId:'timeup', timeoutAfter:10000, pressAction:{id:'default'} } }, { type:TriggerType.TIMESTAMP, timestamp:when }); }catch(e){}
  }
  async function cancelFinish(){ try{ await notifee.cancelTriggerNotification('futsal-finish'); await notifee.cancelNotification('futsal-finish'); }catch(e){} }
  function clearNotifications(){ cancelFinish(); dismissOngoing(); }
  async function voiceRemaining(sec){
    const duration=speakRemaining(sec,0);
    if(duration===0) return;
    await sleep(duration);
  }
  function updateTheme(patch){ setSettings(prev=>({...prev,[themeName]:{...prev[themeName],...patch}})); }
  function updateSound(ev,val){ setSettings(prev=>({...prev,[themeName]:{...prev[themeName],sounds:{...prev[themeName].sounds,[ev]:val}}})); }
  function testSound(ev){
    if(testingSound===ev){ stopPreviewPlayers(); return; }
    stopPreviewPlayers();
    setTestingSound(ev);
    let duration=1400;
    if(ev==='start'){ playStart(); duration=900; }
    else if(ev==='finish'){ playFinish(); duration=1800; }
    else if(ev==='countdown'){
      if(sndOf('countdown')!=='none') play(countdown); else { setTestingSound(null); return; }
      duration=1800;
    } else if(ev==='goalkeeperSub'){
      notifyMid((cur.intervalMin||1)*60, ev);
      duration=2800;
    } else if(ev==='interval'){
      notifyMid((cur.intervalMin||1)*60, cur.enableGoalkeeperSubOnInterval?'goalkeeperSub':'interval');
      duration=2800;
    } else if(ev==='half'){
      notifyMid(baseSeconds, cur.enableGoalkeeperSubOnHalf?'goalkeeperSubHalf':'half');
      duration=2800;
    } else if(ev==='thirty'){
      if(cur.notify30!==false) notifyThirty(); else { setTestingSound(null); return; }
      duration=1200;
    } else {
      notifyMid(baseSeconds, ev);
    }
    testTimer.current=setTimeout(()=>setTestingSound(null),duration);
  }
  function applyTheme(name){ const next=settings[name]||DEFAULTS[name]; setThemeName(name); setBaseSeconds(next.seconds); setRemaining(next.seconds); setRemainingB(next.seconds); setStatus('ready'); setStatusB('ready'); clearInterval(timer.current); endAt.current=null; clearInterval(timerB.current); timerB.current=null; endAtB.current=null; }
  function resetThemeSettings(){
    Alert.alert(`「${theme.label}」の設定をリセット`,'このテーマの設定を初期値に戻します',[{text:'キャンセル',style:'cancel'},{text:'リセット',style:'destructive',onPress:()=>{
      const d=DEFAULTS[themeName]; setSettings(prev=>({...prev,[themeName]:{...d,sounds:{...d.sounds},teamColors:[...d.teamColors]}}));
      if(status!=='running'){ clearInterval(timer.current); timer.current=null; endAt.current=null; setBaseSeconds(d.seconds); setRemaining(d.seconds); setStatus('ready'); clearNotifications(); }
    }}]);
  }
  function adjustBase(delta){ if(anyRunning)return; const n=Math.max(10,baseSeconds+delta); setBaseSeconds(n); setRemaining(n); setRemainingB(n); halfDone.current=false; lastMinute.current=null; countdownDone.current=false; halfDoneB.current=false; lastMinuteB.current=null; countdownDoneB.current=false; }
  function adjustDefault(delta){ const n=Math.max(10,cur.seconds+delta); updateTheme({seconds:n}); if(status!=='running'){setBaseSeconds(n);setRemaining(n);} }
  function notifyMid(sec,ev){
    if(ev==='half'){
      play(alertBeep);
      if(evVoice(ev)) setTimeout(()=>play(halfVoice),650);
      return;
    }
    if(ev==='goalkeeperSubHalf'){
      // ゴレイロ交代(interval.mp3) → alert_1.mp3 → Half.mp3 の順で、重ならないよう各音の長さ分待つ
      play(intervalAlert);
      const a1=Math.round((intervalAlert.duration||1.4)*1000)+150;
      setTimeout(()=>play(alertBeep),a1);
      const a2=a1+Math.round((alertBeep.duration||0.9)*1000)+150;
      setTimeout(()=>play(halfVoice),a2);
      return;
    }
    if(ev==='goalkeeperSub'){
      // ゴレイロ交代音(interval.mp3) → alert_1.mp3 → 残り時間アナウンスの順で、重ならないよう各音の長さ分待つ
      play(intervalAlert);
      const a1=Math.round((intervalAlert.duration||1.4)*1000)+150;
      setTimeout(()=>play(alertBeep),a1);
      // alert_1.mp3 が鳴り終わってから残り時間アナウンス（被らせない）
      const gkDelay=a1+Math.round((alertBeep.duration||0.9)*1000)+200;
      speakRemaining(sec,gkDelay);
      return;
    }
    if(ev==='interval'){
      play(alertBeep);
      if(evVoice(ev)){
        const delay=650;
        const voiceMs=speakRemaining(sec,delay);
        setTimeout(()=>play(alertBeep),delay+voiceMs+150);
      }
      return;
    }
    if(evWhistle(ev)) play(shortWhistle);
    if(evVoice(ev)) setTimeout(()=>voiceRemaining(sec), evWhistle(ev)?650:0);
  }
  // ゴレイロ交代音(interval.mp3)が「設定時間ちょうど」に鳴り終わるよう前倒しで再生 → 設定時間ちょうどに alert_1 → そのあとに ハーフ / 残り時間アナウンス
  // msToMark: 今から設定時間(マーク)までのミリ秒。followKind:'half'=ハーフ音声 / 'interval'=残り時間アナウンス
  function scheduleGoalkeeperSeq(msToMark,followKind,markSec){
    const ivDur=Math.round((intervalAlert.duration||1.4)*1000);
    const a1Dur=Math.round((alertBeep.duration||0.9)*1000);
    const mark=Math.max(0,msToMark);
    setTimeout(()=>play(intervalAlert),Math.max(0,mark-ivDur)); // markちょうどに鳴り終わる
    setTimeout(()=>play(alertBeep),mark);                       // markちょうどに alert_1
    const followAt=mark+a1Dur+200;
    if(followKind==='half'){ if(evVoice('half')) setTimeout(()=>play(halfVoice),followAt); }
    else { if(evVoice('interval')) speakRemaining(markSec,followAt); }
  }
  // ゴレイロ交代マークまでの先行検知に使うリードタイム（秒）。interval.mp3 の長さ＋余裕。
  const gkLeadSec=Math.ceil(intervalAlert.duration||1.4)+1;
  function notifyThirty(){ play(thirtyAlert); }
  function playStart(){
    const mode=sndOf('start');
    if(mode==='whistle') play(shortWhistle);
    else if(mode==='voice') play(startVoice);
    else if(mode==='both'){ play(shortWhistle); setTimeout(()=>play(startVoice),650); }
  }
  function playFinish(){ if(evWhistle('finish')) play(finishWhistle); if(evVoice('finish')) setTimeout(()=>play(timeup), evWhistle('finish')?950:0); }
  function updateByClock(){
    if(!endAt.current)return;
    const next=Math.max(0,Math.ceil((endAt.current-Date.now())/1000)); setRemaining(next);
    const sound=!twoCourtRef.current||activeCourtRef.current==='A';
    if(cur.notify30!==false && !thirtyDone.current && next<=30 && next>0){thirtyDone.current=true; if(sound)notifyThirty();}
    if(sndOf('countdown')!=='none'&&!countdownDone.current&&next<=10&&next>0){countdownDone.current=true; if(sound)play(countdown);}
    if(cur.alertMode==='half'&&baseSeconds>50&&next>0){ const mark=Math.floor(baseSeconds/2);
      if(cur.enableGoalkeeperSubOnHalf){ if(!halfDone.current&&next<=mark+gkLeadSec){ halfDone.current=true; if(sound)scheduleGoalkeeperSeq(endAt.current-Date.now()-mark*1000,'half',mark); } }
      else { if(!halfDone.current&&next<=mark){ halfDone.current=true; if(sound)notifyMid(next,'half'); } } }
    if(cur.alertMode==='minute'&&next>0){ const period=(cur.intervalMin||1)*60;
      if(cur.enableGoalkeeperSubOnInterval){ const mark=Math.floor(next/period)*period; if(mark>0&&mark<baseSeconds&&mark!==lastMinute.current&&(next-mark)<=gkLeadSec){ lastMinute.current=mark; if(sound)scheduleGoalkeeperSeq(endAt.current-Date.now()-mark*1000,'interval',mark); } }
      else { if(next%period===0&&next!==lastMinute.current){ lastMinute.current=next; if(sound)notifyMid(next,'interval'); } } }
    if(next<=0){ clearInterval(timer.current); timer.current=null; endAt.current=null; setStatus('finished'); if(sound)playFinish(); clearNotifications();
      if(combo.enabled&&!twoCourtRef.current){ setRoundIndex(i=>{ const next=Math.min(totalRounds,i+1); setRoundByTheme(prev=>({...prev,[themeName]:next})); return next; }); setBaseSeconds(cur.seconds); setRemaining(cur.seconds); halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; }
    }
  }
  function updateByClockB(){
    if(!endAtB.current)return;
    const next=Math.max(0,Math.ceil((endAtB.current-Date.now())/1000)); setRemainingB(next);
    const sound=activeCourtRef.current==='B';
    if(cur.notify30!==false && !thirtyDoneB.current && next<=30 && next>0){thirtyDoneB.current=true; if(sound)notifyThirty();}
    if(sndOf('countdown')!=='none'&&!countdownDoneB.current&&next<=10&&next>0){countdownDoneB.current=true; if(sound)play(countdown);}
    if(cur.alertMode==='half'&&baseSeconds>50&&next>0){ const mark=Math.floor(baseSeconds/2);
      if(cur.enableGoalkeeperSubOnHalf){ if(!halfDoneB.current&&next<=mark+gkLeadSec){ halfDoneB.current=true; if(sound)scheduleGoalkeeperSeq(endAtB.current-Date.now()-mark*1000,'half',mark); } }
      else { if(!halfDoneB.current&&next<=mark){ halfDoneB.current=true; if(sound)notifyMid(next,'half'); } } }
    if(cur.alertMode==='minute'&&next>0){ const period=(cur.intervalMin||1)*60;
      if(cur.enableGoalkeeperSubOnInterval){ const mark=Math.floor(next/period)*period; if(mark>0&&mark<baseSeconds&&mark!==lastMinuteB.current&&(next-mark)<=gkLeadSec){ lastMinuteB.current=mark; if(sound)scheduleGoalkeeperSeq(endAtB.current-Date.now()-mark*1000,'interval',mark); } }
      else { if(next%period===0&&next!==lastMinuteB.current){ lastMinuteB.current=next; if(sound)notifyMid(next,'interval'); } } }
    if(next<=0){ clearInterval(timerB.current); timerB.current=null; endAtB.current=null; setStatusB('finished'); if(sound)playFinish(); clearNotifications(); }
  }
  function startPause(){
    if(status==='running'){ updateByClock(); clearInterval(timer.current); timer.current=null; endAt.current=null; setStatus('paused'); clearNotifications(); return; }
    if(status!=='paused'){ halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; }
    activeCourtRef.current='A'; setActiveCourt('A');
    const startFrom=remaining<=0?baseSeconds:remaining; setRemaining(startFrom); endAt.current=Date.now()+startFrom*1000; setStatus('running'); setShowSettings(false); playStart(); clearInterval(timer.current); timer.current=setInterval(()=>updateByClockRef.current&&updateByClockRef.current(),1000); if(AppState.currentState!=='active'){ showOngoing(); scheduleFinish(); }
  }
  function startPauseB(){
    if(statusB==='running'){ updateByClockB(); clearInterval(timerB.current); timerB.current=null; endAtB.current=null; setStatusB('paused'); clearNotifications(); return; }
    if(statusB!=='paused'){ halfDoneB.current=false; lastMinuteB.current=null; countdownDoneB.current=false; thirtyDoneB.current=false; }
    activeCourtRef.current='B'; setActiveCourt('B');
    const startFrom=remainingB<=0?baseSeconds:remainingB; setRemainingB(startFrom); endAtB.current=Date.now()+startFrom*1000; setStatusB('running'); setShowSettings(false); playStart(); clearInterval(timerB.current); timerB.current=setInterval(()=>updateByClockBRef.current&&updateByClockBRef.current(),1000); if(AppState.currentState!=='active'){ showOngoing(); scheduleFinish(); }
  }
  function extendTime(secs){
    if(status==='running'&&endAt.current){ endAt.current+=secs*1000; updateByClock(); }
    else if(statusB==='running'&&endAtB.current){ endAtB.current+=secs*1000; updateByClockB(); }
  }
  function resetCourt(court){
    const doReset=()=>{ if(court==='A'){ clearInterval(timer.current); timer.current=null; endAt.current=null; halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; setRemaining(baseSeconds); setStatus('ready'); } else { clearInterval(timerB.current); timerB.current=null; endAtB.current=null; halfDoneB.current=false; lastMinuteB.current=null; countdownDoneB.current=false; thirtyDoneB.current=false; setRemainingB(baseSeconds); setStatusB('ready'); } clearNotifications(); };
    const running=court==='A'?status==='running':statusB==='running';
    if(running) Alert.alert('リセットしますか？','',[{text:'キャンセル',style:'cancel'},{text:'リセット',style:'destructive',onPress:doReset}]); else doReset();
  }
  function setActive(court){ activeCourtRef.current=court; setActiveCourt(court); }
  function reset(){
    const doReset=()=>{ clearInterval(timer.current); timer.current=null; endAt.current=null; halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; setBaseSeconds(cur.seconds); setRemaining(cur.seconds); setStatus('ready'); clearNotifications(); };
    if(status==='running') Alert.alert('リセットしますか？','',[{text:'キャンセル',style:'cancel'},{text:'リセット',style:'destructive',onPress:doReset}]); else doReset();
  }
  function endMatch(){ clearInterval(timer.current); timer.current=null; endAt.current=null; halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; setRemaining(baseSeconds); setStatus('finished'); clearNotifications(); }
  function updateCombo(patch){ const next=normalizeCombo({...combo,...patch}); setCombo(next); setComboByTheme(prev=>({...prev,[themeName]:next})); setRoundIndex(0); setRoundByTheme(prev=>({...prev,[themeName]:0})); }
  function goRound(i){ if(anyRunning)return; const clamped=Math.max(0,Math.min(totalRounds,i)); setRoundIndex(clamped); setRoundByTheme(prev=>({...prev,[themeName]:clamped})); setStatus('ready'); setStatusB('ready'); setBaseSeconds(cur.seconds); setRemaining(cur.seconds); setRemainingB(cur.seconds); halfDone.current=false; lastMinute.current=null; countdownDone.current=false; thirtyDone.current=false; halfDoneB.current=false; lastMinuteB.current=null; countdownDoneB.current=false; thirtyDoneB.current=false; }
  const phase=status==='running'?'実行中':status==='paused'?'一時停止中':status==='finished'?'終了':'準備中';
  const phaseIcon=status==='running'?'football-outline':status==='paused'?'pause-outline':status==='finished'?'flag-outline':'hourglass-outline';
  const showSetup=status==='ready'||status==='finished';
  const allDone=combo.enabled&&totalRounds>0&&roundIndex>=totalRounds;
  const currentRound=(combo.enabled&&roundIndex<totalRounds)?matchRounds[roundIndex]:null;
  const roundHasB=!!(currentRound&&currentRound.courts.some((c)=>c.court==='B'));
  // 休みチーム: rest指定があればそれ、無ければ対戦していないチームを計算（1面でも休みを表示）
  const restOf=(r)=>{ if(!r)return []; if(r.rest)return r.rest; const playing=new Set(); r.courts.forEach((c)=>{playing.add(c.home);playing.add(c.away);}); return TEAM_NAMES.slice(0,combo.teams).filter((t)=>!playing.has(t)); };
  const restLabel=(r)=>(r&&r.length>=2?'休み:':'待機');
  function onPrimary(){ if(allDone){ goRound(0); } else { startPause(); } }
  const teamColors=cur.teamColors||DEFAULT_TEAM_COLORS;
  const teamColorOf=(name)=>{ const i=TEAM_NAMES.indexOf(name); return (i>=0&&teamColors[i])||theme.text; };
  function assignTeamColor(t,col){ setSettings(prev=>{ const base=prev[themeName]||DEFAULTS[themeName]; const cs=[...(base.teamColors||DEFAULT_TEAM_COLORS)]; const old=cs[t]; const o=cs.indexOf(col); if(o>=0&&o!==t)cs[o]=old; cs[t]=col; return {...prev,[themeName]:{...base,teamColors:cs}}; }); }
  const teamBadge=(name,numSize,onPress)=>{
    const col=teamColorOf(name);
    return <Pressable key={name} hitSlop={4} onPress={onPress} style={[s.teamBadge,{backgroundColor:hexRgba(col,0.16),borderColor:col,shadowColor:col}]}>
      <Text style={s.teamBadgeLabel}>チーム</Text><Text style={[s.teamBadgeNum,{color:hexTint(col),fontSize:numSize,textShadowColor:col}]}>{teamNum(name)}</Text>
    </Pressable>;
  };
  const pickTeam=(name)=>setColorPickerTeam(TEAM_NAMES.indexOf(name));
  // HUDチームチップ: チーム色の暗い透過背景 + ネオン枠 + 国旗風スウォッチ + 極太発光数字
  const hudChip=(name,small)=>{
    const col=teamColorOf(name);
    return <Pressable key={name} hitSlop={4} onPress={()=>pickTeam(name)} style={[hud.chip,small&&hud.chipSm,{borderColor:col,backgroundColor:hexRgba(col,0.16),shadowColor:col}]}>
      <View style={hud.chipSide}><View style={[hud.flag,small&&hud.flagSm,{backgroundColor:col,shadowColor:col}]}/><Text style={[hud.chipLbl,small&&hud.chipLblSm]}>チーム</Text></View>
      <Text style={[hud.chipNum,{color:hexTint(col),textShadowColor:col,fontSize:small?30:54}]}>{teamNum(name)}</Text>
    </Pressable>;
  };
  const hudVs=(home,away,small)=>(<View style={small?hud.versusSm:hud.versus}>
    {hudChip(home,small)}<Text style={small?hud.vsSm:hud.vsBig}>vs</Text>{hudChip(away,small)}
  </View>);
  const renderVs=(home,away,numSize,rowStyle)=>(<View style={[s.vsRow,rowStyle]}>
    {teamBadge(home,numSize,()=>pickTeam(home))}
    <Text style={s.vsSep}>vs</Text>
    {teamBadge(away,numSize,()=>pickTeam(away))}
  </View>);
  const renderCourtCard=(court)=>{
    const cStatus=court==='A'?status:statusB;
    const cRem=court==='A'?remaining:remainingB;
    const cMatch=currentRound?currentRound.courts.find((x)=>x.court===court):null;
    const isActive=activeCourt===court;
    const running=cStatus==='running';
    const onStart=court==='A'?startPause:startPauseB;
    const cPhase=running?'実行中':cStatus==='paused'?'一時停止中':cStatus==='finished'?'終了':'待機中';
    return <HudPanel key={court} t={theme} style={[hud.courtPanel,s.twoCourtPanel,isActive&&hud.courtPanelActive]}>
      <View style={s.courtCardHead}>
        <Text style={s.courtCardTitle}>コート{court}</Text>
        <Pressable style={[s.activeBadge,isActive&&s.activeBadgeOn]} onPress={()=>setActive(court)}><Ionicons name={isActive?'volume-high':'volume-mute-outline'} size={13} color={isActive?'#021018':theme.muted}/><Text style={[s.activeBadgeText,isActive&&{color:'#021018'}]}>{isActive?'通知ON':'通知OFF'}</Text></Pressable>
      </View>
      {cMatch?hudVs(cMatch.home,cMatch.away,true):<Text style={s.courtIdle}>この試合はお休み</Text>}
      {(isActive&&!anyRunning)?(<View style={s.courtEditRow}>
        <Pressable style={hud.stepBtnSm} onPress={()=>adjustBase(adjustMode==='min'?-60:-10)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Text style={hud.stepSignSm}>−</Text><Text style={hud.stepUnit}>{adjustMode==='min'?'1分':'10秒'}</Text></Pressable>
        <Pressable onPress={()=>setAdjustMode(adjustMode==='min'?'sec':'min')}><Text style={s.courtTime}>{fmt(cRem)}</Text></Pressable>
        <Pressable style={hud.stepBtnSm} onPress={()=>adjustBase(adjustMode==='min'?60:10)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Text style={hud.stepSignSm}>+</Text><Text style={hud.stepUnit}>{adjustMode==='min'?'1分':'10秒'}</Text></Pressable>
      </View>):(<Text style={[s.courtTime,running&&{color:theme.accent,textShadowColor:'transparent'}]}>{fmt(cRem)}</Text>)}
      <View style={s.courtBtnRow}>
        <Pressable style={[hud.startBtn,hud.startBtnSm]} onPress={onStart}>{theme.variant==='cyber'&&<CyberButtonSkin active/>}<Ionicons name={running?'pause':'play'} size={18} color={theme.variant==='pop'?'#2d2330':'#fff'}/><Text style={[hud.startText,hud.startTextSm]}>{running?'一時停止':cStatus==='paused'?'再開':'開始'}</Text></Pressable>
        {running&&<Pressable style={[hud.ghostBtn,{flex:1}]} onPress={()=>{if(isActive)extendTime(10);}}><Ionicons name='add' size={18} color={theme.accent}/><Text style={hud.ghostText}>+10秒</Text></Pressable>}
        <Pressable style={s.courtResetBtn} onPress={()=>resetCourt(court)}><Ionicons name='refresh' size={18} color={theme.accent}/></Pressable>
      </View>
    </HudPanel>;
  };

  if(!loaded||(!fontsLoaded&&!fontsError)) return <SafeAreaProvider><SafeAreaView style={s.root}><RNStatusBar barStyle='light-content'/></SafeAreaView></SafeAreaProvider>;
  return <SafeAreaProvider><SafeAreaView style={s.root}><RNStatusBar barStyle='light-content'/>
    <ScreenFX t={theme}/>
    <ScrollView style={s.scroll} scrollEnabled={!isTwo} contentContainerStyle={[s.container,isTwo&&s.containerTwo]}>
    <View style={[s.chrome,isTwo&&s.chromeTwo]}>
      <View style={s.header}>
        <View style={s.brand}>
          <View style={s.brandMark}><Ionicons name='stopwatch-outline' size={22} color={theme.accent}/></View>
          <Text style={s.title}>フットサルタイマー</Text>
        </View>
        <Pressable style={s.menuButton} hitSlop={12} onPress={()=>setShowSettings(true)}><Ionicons name='menu' size={24} color={theme.accent}/></Pressable>
      </View>
    </View>
    <HudPanel t={theme} style={isTwo&&s.notifyPanelTwo}>
      <View style={[s.notifyRow,isTwo&&s.notifyRowTwo]}>
        <Ionicons name='notifications-outline' size={20} color={theme.accent}/>
        <Text style={s.notifyTitle}>通知</Text>
        {[['half','ハーフ'],['minute',`${cur.intervalMin||1}分ごと`],['none','なし']].map(([k,l])=><Choice key={k} s={s} t={theme} active={cur.alertMode===k} label={l} onPress={()=>updateTheme({alertMode:k})} compact/>)}
      </View>
    </HudPanel>
    {!isTwo&&<HudPanel t={theme} stripes style={{paddingTop:14,paddingBottom:16,paddingHorizontal:16}}>
      <View style={hud.clockRow}>
        <Text style={hud.clock}>{clock}</Text>
        <View style={hud.phase}><Ionicons name={phaseIcon} size={15} color={theme.accent}/><Text style={hud.phaseText}>{phase}</Text></View>
      </View>
      <View style={hud.timerRow}>
        <View pointerEvents='none' style={hud.radarWrap}>{[110,170,230].map(d=><View key={d} style={[hud.radar,{width:d,height:d,borderRadius:d/2,marginLeft:-d/2,marginTop:-d/2}]}/>)}</View>
        {showSetup
          ? <>
            <Pressable style={hud.stepBtn} onPress={()=>adjustBase(adjustMode==='min'?-60:-10)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Text style={hud.stepSign}>−</Text><Text style={hud.stepUnit}>{adjustMode==='min'?'1分':'10秒'}</Text></Pressable>
            <View style={hud.timeEditor}>
              <Pressable style={hud.timePart} onPress={()=>setAdjustMode('min')}><Text style={[hud.timeEdit,adjustMode==='min'&&hud.timeEditSel]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{String(Math.floor(baseSeconds/60)).padStart(2,'0')}</Text>{adjustMode==='min'&&<View style={hud.selBar}/>}</Pressable>
              <Text style={hud.timeEditSep}>:</Text>
              <Pressable style={hud.timePart} onPress={()=>setAdjustMode('sec')}><Text style={[hud.timeEdit,adjustMode==='sec'&&hud.timeEditSel]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{String(baseSeconds%60).padStart(2,'0')}</Text>{adjustMode==='sec'&&<View style={hud.selBar}/>}</Pressable>
            </View>
            <Pressable style={hud.stepBtn} onPress={()=>adjustBase(adjustMode==='min'?60:10)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Text style={hud.stepSign}>+</Text><Text style={hud.stepUnit}>{adjustMode==='min'?'1分':'10秒'}</Text></Pressable>
          </>
          : <Text style={[hud.time,status==='running'&&hud.timeRunning]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{fmt(remaining)}</Text>}
      </View>
      <View style={hud.actionRow}>
        <Pressable style={hud.startBtn} onPress={onPrimary}>{theme.variant==='cyber'&&<CyberButtonSkin active/>}<Ionicons name={allDone?'refresh':status==='running'?'pause':'play'} size={22} color={theme.variant==='pop'?'#2d2330':'#fff'}/><Text style={hud.startText}>{allDone?'最初から':status==='running'?'一時停止':status==='paused'?'再開':'開始'}</Text></Pressable>
        {status==='running'&&<Pressable style={hud.ghostBtn} onPress={()=>extendTime(10)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='add' size={18} color={theme.accent}/><Text style={hud.ghostText}>+10秒</Text></Pressable>}
        {status==='paused'&&<Pressable style={hud.endBtn} onPress={endMatch}><Ionicons name='stop' size={20} color='#ffb3ad'/><Text style={hud.endText}>終了</Text></Pressable>}
        {showSetup&&<Pressable style={hud.ghostBtn} onPress={reset}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='refresh' size={18} color={theme.accent}/><Text style={hud.ghostText}>リセット</Text></Pressable>}
      </View>
    </HudPanel>}
    {!isTwo&&combo.enabled&&<HudPanel t={theme}>
      <View style={hud.secHead}>
        <View style={hud.secIc}><Ionicons name='git-compare-outline' size={22} color={theme.accent}/></View>
        <Text style={hud.secTitle}>{allDone?'全試合終了':`第${roundIndex+1}試合・${combo.teams}チーム`}</Text>
        <Pressable style={hud.editBtn} onPress={()=>setShowCombo(true)}><Ionicons name='create-outline' size={22} color={theme.accent}/></Pressable>
      </View>
      {!allDone&&currentRound&&hudVs(currentRound.courts[0].home,currentRound.courts[0].away)}
      {!allDone&&currentRound&&restOf(currentRound).length>0&&<View style={s.restRow}>
        <Text style={s.restLabelText}>{restLabel(restOf(currentRound))}</Text>
        {restOf(currentRound).map((n)=>teamBadge(n,15,()=>pickTeam(n)))}
      </View>}
      {showSetup&&totalRounds>1&&<View style={hud.matchNav}>
        {roundIndex>0?<Pressable style={hud.navBtn} onPress={()=>goRound(roundIndex-1)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='play-skip-back-outline' size={13} color={theme.accent}/><Text style={hud.navText}>前</Text></Pressable>:<View style={hud.navSpacer}/>}
        {allDone
          ? <Pressable style={[hud.navBtn,hud.navBtnWide]} onPress={()=>goRound(0)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='refresh' size={13} color={theme.accent}/><Text style={hud.navText}>最初から</Text></Pressable>
          : <Pressable style={hud.navBtn} onPress={()=>goRound(roundIndex+1)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='play-skip-forward-outline' size={13} color={theme.accent}/><Text style={hud.navText}>次</Text></Pressable>}
      </View>}
    </HudPanel>}
    {isTwo&&<View style={s.twoMode}>
      <View style={s.twoMatchHead}>
        <View style={hud.secHead}>
          <View style={hud.secIc}><Ionicons name='git-compare-outline' size={22} color={theme.accent}/></View>
          <Text style={s.matchTitle}>{allDone?'全試合終了':`第${roundIndex+1}試合・${combo.teams}チーム`}</Text>
        </View>
        <Pressable style={hud.editBtn} onPress={()=>setShowCombo(true)}><Ionicons name='create-outline' size={22} color={theme.accent}/></Pressable>
      </View>
      {!allDone&&<View style={s.courtsWrap}>
        {renderCourtCard('A')}
        {roundHasB&&renderCourtCard('B')}
      </View>}
      {!allDone&&currentRound&&currentRound.rest&&currentRound.rest.length>0&&<View style={s.restRow}>
        <Text style={s.restLabelText}>休み</Text>
        {currentRound.rest.map((n)=>teamBadge(n,15,()=>pickTeam(n)))}
      </View>}
      {!anyRunning&&totalRounds>1&&<View style={hud.matchNav}>
        {roundIndex>0?<Pressable style={hud.navBtn} onPress={()=>goRound(roundIndex-1)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='play-skip-back-outline' size={13} color={theme.accent}/><Text style={hud.navText}>前</Text></Pressable>:<View style={hud.navSpacer}/>}
        {allDone
          ? <Pressable style={[hud.navBtn,hud.navBtnWide]} onPress={()=>goRound(0)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='refresh' size={13} color={theme.accent}/><Text style={hud.navText}>最初から</Text></Pressable>
          : <Pressable style={hud.navBtn} onPress={()=>goRound(roundIndex+1)}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='play-skip-forward-outline' size={13} color={theme.accent}/><Text style={hud.navText}>次</Text></Pressable>}
      </View>}
    </View>}
    <View style={[hud.wm,isTwo&&s.wmTwo]}><Text style={hud.wmText}>nikori FUTSAL TIMER</Text></View>
  </ScrollView>
    <Animated.View pointerEvents={showSettings?'auto':'none'} style={[s.backdrop,{opacity:backdropOpacity}]}><Pressable style={s.backdropFill} onPress={()=>setShowSettings(false)}/></Animated.View>
    <Animated.View pointerEvents={showSettings?'auto':'none'} style={[s.drawer,{transform:[{translateX:drawerX}]}]}><ScrollView contentContainerStyle={s.drawerContent}>
      <View style={s.drawerHeader}><View style={s.cardLabel}><Ionicons name='settings-outline' size={20} color={theme.accent}/><Text style={s.sectionTitle}>設定</Text></View><Pressable style={s.closeButton} onPress={()=>setShowSettings(false)}><Ionicons name='close' size={24} color={theme.text}/></Pressable></View>
      <Pressable style={s.wideBtn} onPress={()=>{setShowSettings(false); setShowCombo(true);}}>{theme.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='git-compare-outline' size={18} color={theme.text}/><Text style={s.buttonText}>{`連戦設定（${combo.courts}面・${combo.teams}チーム）`}</Text></Pressable>
      <Label s={s} t={theme} icon='albums-outline' text='プリセット（設定の保存枠）'/>
      {[Object.entries(THEMES).slice(0,2),Object.entries(THEMES).slice(2,4)].map((row,i)=><View key={i} style={s.grid2}>{row.map(([k,v])=><Choice key={k} s={s} t={theme} active={themeName===k} label={v.label} onPress={()=>applyTheme(k)}/>)}</View>)}
      <Label s={s} t={theme} icon='time-outline' text='デフォルト時間'/>
      <Adjust s={s} t={theme} label={labelTime(cur.seconds)} minus={()=>adjustDefault(-60)} plus={()=>adjustDefault(60)}/>
      <View style={s.labelRow}><Ionicons name='volume-high-outline' size={17} color={theme.accent}/><Text style={s.labelText}>通知音</Text></View>
      <SoundSetting s={s} t={theme} icon='play-outline' label='開始' value={cur.sounds.start} options={SND_OPTS} onChange={(v)=>updateSound('start',v)} onTest={()=>testSound('start')} testing={testingSound==='start'}/>
      <SoundSetting s={s} t={theme} icon='timer-outline' label='ハーフ' value={cur.sounds.half} options={SND_OPTS} onChange={(v)=>updateSound('half',v)} onTest={()=>testSound('half')} testing={testingSound==='half'}/>
      <View style={{flexDirection:'row',gap:8,marginTop:8}}><Pressable style={[{flex:2},s.choice,cur.enableGoalkeeperSubOnHalf===true&&s.activeChoice]} onPress={()=>updateTheme({enableGoalkeeperSubOnHalf:true})}>{theme.variant==='cyber'&&<CyberButtonSkin active={cur.enableGoalkeeperSubOnHalf===true}/>}<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[s.choiceText,cur.enableGoalkeeperSubOnHalf===true&&s.activeChoiceText]}>ゴレイロの交代オン</Text></Pressable><Pressable style={[{flex:0.6},s.choice,cur.enableGoalkeeperSubOnHalf!==true&&s.activeChoice]} onPress={()=>updateTheme({enableGoalkeeperSubOnHalf:false})}>{theme.variant==='cyber'&&<CyberButtonSkin active={cur.enableGoalkeeperSubOnHalf!==true}/>}<Text style={[s.choiceText,cur.enableGoalkeeperSubOnHalf!==true&&s.activeChoiceText]}>オフ</Text></Pressable></View>
      <SoundSetting s={s} t={theme} icon='repeat-outline' label='インターバル' value={cur.sounds.interval} options={SND_OPTS} onChange={(v)=>updateSound('interval',v)} onTest={()=>testSound('interval')} testing={testingSound==='interval'}/>
      <View style={{flexDirection:'row',gap:8,marginTop:8}}><Pressable style={[{flex:2},s.choice,cur.enableGoalkeeperSubOnInterval===true&&s.activeChoice]} onPress={()=>updateTheme({enableGoalkeeperSubOnInterval:true})}>{theme.variant==='cyber'&&<CyberButtonSkin active={cur.enableGoalkeeperSubOnInterval===true}/>}<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[s.choiceText,cur.enableGoalkeeperSubOnInterval===true&&s.activeChoiceText]}>ゴレイロの交代オン</Text></Pressable><Pressable style={[{flex:0.6},s.choice,cur.enableGoalkeeperSubOnInterval!==true&&s.activeChoice]} onPress={()=>updateTheme({enableGoalkeeperSubOnInterval:false})}>{theme.variant==='cyber'&&<CyberButtonSkin active={cur.enableGoalkeeperSubOnInterval!==true}/>}<Text style={[s.choiceText,cur.enableGoalkeeperSubOnInterval!==true&&s.activeChoiceText]}>オフ</Text></Pressable></View>
      <View style={s.grid2}>{[1,2,3,4,5].map(n=><Choice key={n} s={s} t={theme} active={(cur.intervalMin||1)===n} label={`${n}分`} onPress={()=>updateTheme({intervalMin:n})}/>)}</View>
      <SoundSetting s={s} t={theme} icon='flag-outline' label='終了' value={cur.sounds.finish} options={SND_OPTS} onChange={(v)=>updateSound('finish',v)} onTest={()=>testSound('finish')} testing={testingSound==='finish'}/>
      <SoundSetting s={s} t={theme} icon='hourglass-outline' label='カウントダウン' value={cur.sounds.countdown} options={[['voice','音声'],['none','なし']]} onChange={(v)=>updateSound('countdown',v)} onTest={()=>testSound('countdown')} testing={testingSound==='countdown'}/>
      <SoundSetting s={s} t={theme} icon='alarm-outline' label='30秒前' value={cur.notify30!==false?'voice':'none'} options={[['voice','音声'],['none','なし']]} onChange={(v)=>updateTheme({notify30:v==='voice'})} onTest={()=>testSound('thirty')} testing={testingSound==='thirty'}/>
      <Label s={s} t={theme} icon='refresh-outline' text='設定のリセット'/>
      <Pressable style={s.resetBtn} onPress={resetThemeSettings}><Ionicons name='refresh' size={18} color={theme.danger}/><Text style={s.resetBtnText}>「{theme.label}」の設定を初期化</Text></Pressable>
      <View style={s.copyBox}>
        <Text style={s.copyText}>Copyright © 2026 - nikorihito All Rights Reserved</Text>
        <Pressable onPress={()=>Linking.openURL('https://school.nikorihito.com/index.php').catch(()=>{})}><Text style={s.copyLink}>【プログラミングスクール ヒコリヒトラボ】</Text><Text style={s.copyLink}>https://school.nikorihito.com/index.php</Text></Pressable>
      </View>
    </ScrollView></Animated.View>
    <Modal visible={showCombo} transparent animationType='fade' onRequestClose={()=>setShowCombo(false)}>
      <Pressable style={s.modalBackdrop} onPress={()=>setShowCombo(false)}>
        <Pressable style={s.modalCard} onPress={()=>{}}>
          <View style={s.drawerHeader}><View style={s.cardLabel}><Ionicons name='git-compare-outline' size={20} color={theme.accent}/><Text style={s.sectionTitle}>連戦設定</Text></View><Pressable style={s.closeButton} onPress={()=>setShowCombo(false)}><Ionicons name='close' size={24} color={theme.text}/></Pressable></View>
          <ScrollView style={{marginTop:4}}><ComboSettings s={s} t={theme} combo={combo} updateCombo={updateCombo} totalRounds={totalRounds} onShowSchedule={()=>setShowSchedule(true)} teamBadge={teamBadge} onPickColor={(i)=>setColorPickerTeam(i)}/></ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
    <Modal visible={showSchedule} animationType='slide' onRequestClose={()=>setShowSchedule(false)}>
      <SafeAreaView style={s.root}>
        <View style={s.scheduleHeader}>
          <View style={s.cardLabel}><Ionicons name='list-outline' size={22} color={theme.accent}/><Text style={s.sectionTitle}>対戦表（{combo.courts}面・{combo.teams}チーム）</Text></View>
          <Pressable style={s.scheduleClose} onPress={()=>setShowSchedule(false)}><Ionicons name='close' size={20} color={theme.text}/><Text style={s.buttonText}>閉じる</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={s.scheduleBody}>
          {matchRounds.map((r,i)=><View key={i} style={[s.scheduleRow,i===roundIndex&&s.scheduleRowActive]}>
            <Text style={s.scheduleNo}>{`第${i+1}試合`}</Text>
            <View style={s.scheduleMatches}>
              {r.courts.map((c)=><View key={c.court} style={s.scheduleVsRow}>{combo.courts===2&&<Text style={s.scheduleCourt}>{c.court}</Text>}{renderVs(c.home,c.away,17,{justifyContent:'flex-start'})}</View>)}
              {r.rest&&r.rest.length>0&&<Text style={s.scheduleRest}>休み: {r.rest.join('、')}</Text>}
            </View>
          </View>)}
        </ScrollView>
      </SafeAreaView>
    </Modal>
    <Modal visible={colorPickerTeam!=null} transparent animationType='fade' onRequestClose={()=>setColorPickerTeam(null)}>
      <Pressable style={s.modalBackdrop} onPress={()=>setColorPickerTeam(null)}>
        <Pressable style={s.modalCard} onPress={()=>{}}>
          <View style={s.drawerHeader}><View style={s.cardLabel}><Ionicons name='shirt-outline' size={20} color={theme.accent}/><Text style={s.sectionTitle}>{colorPickerTeam!=null?TEAM_NAMES[colorPickerTeam]:''}の色</Text></View><Pressable style={s.closeButton} onPress={()=>setColorPickerTeam(null)}><Ionicons name='close' size={24} color={theme.text}/></Pressable></View>
          <Text style={s.hintText}>ビブスの色から選択（既に使用中の色を選ぶと入れ替え）</Text>
          <View style={s.swatchGrid}>
            {BIB_COLORS.map((col)=>{ const owner=teamColors.indexOf(col); const sel=owner===colorPickerTeam; const dark=LIGHT_SWATCH.includes(col); return <Pressable key={col} style={[s.swatch,{backgroundColor:col,borderColor:sel?theme.accent:(dark?'#00000033':'#ffffff66')},sel&&s.swatchActive]} onPress={()=>{ if(colorPickerTeam!=null) assignTeamColor(colorPickerTeam,col); setColorPickerTeam(null); }}>{owner>=0&&<Text style={[s.swatchNum,{color:dark?'#000':'#fff'}]}>{owner+1}</Text>}</Pressable>; })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  </SafeAreaView></SafeAreaProvider>;
}
function Choice({s,t,active,label,onPress,compact}){return <Pressable style={[s.choice,compact&&s.choiceCompact,active&&s.activeChoice]} onPress={onPress}>{t.variant==='cyber'&&<CyberButtonSkin active={active}/>}<>{active&&<Ionicons name='checkmark-circle' size={compact?13:16} color={s.activeCheck.color}/>}</><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[s.choiceText,compact&&s.choiceTextCompact,active&&s.activeChoiceText]}>{label}</Text></Pressable>}
function Btn({s,label,onPress}){return <Pressable style={s.secondaryButton} onPress={onPress}><Text style={s.buttonText}>{label}</Text></Pressable>}
function Adjust({s,t,label,minus,plus}){return <View style={s.adjustRow}><Pressable style={s.smallButton} onPress={minus}>{t.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='remove' size={26} color={t.text}/></Pressable><Text style={s.adjustLabel}>{label}</Text><Pressable style={s.smallButton} onPress={plus}>{t.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='add' size={26} color={t.text}/></Pressable></View>}
function Label({s,t,icon,text}){return <View style={s.labelRow}><View style={s.labelIconBadge}>{t.variant==='cyber'&&<ThemeTexture source={THEME_ASSETS.cyberTexture} opacity={0.22}/>}<Ionicons name={icon} size={17} color={t.accent}/></View><Text style={s.labelText}>{text}</Text></View>}
function ComboSettings({s,t,combo,updateCombo,totalRounds,onShowSchedule,teamBadge,onPickColor}){
  const teamOpts=COURT_TEAMS[combo.courts]||[];
  const teamRows=[]; for(let i=0;i<teamOpts.length;i+=2) teamRows.push(teamOpts.slice(i,i+2));
  return <View>
  {combo.enabled&&<View>
    <Label s={s} t={t} icon='grid-outline' text='コート数'/>
    <View style={s.grid2}><Choice s={s} t={t} active={combo.courts===1} label='1面' onPress={()=>updateCombo({courts:1})}/><Choice s={s} t={t} active={combo.courts===2} label='2面' onPress={()=>updateCombo({courts:2})}/></View>
    <Label s={s} t={t} icon='people-outline' text='チーム数'/>
    {teamRows.map((row,i)=><View key={i} style={s.grid2}>{row.map((v)=><Choice key={v} s={s} t={t} active={combo.teams===v} label={`${v}チーム`} onPress={()=>updateCombo({teams:v})}/>)}</View>)}
    <Text style={s.hintText}>{`${combo.courts}面 ・ ${combo.teams}チーム ・ 全${totalRounds}試合`}</Text>
    {totalRounds>0&&<Pressable style={s.wideBtn} onPress={onShowSchedule}>{t.variant==='cyber'&&<CyberButtonSkin/>}<Ionicons name='list-outline' size={18} color={t.text}/><Text style={s.buttonText}>対戦表を見る</Text></Pressable>}
    <Label s={s} t={t} icon='shirt-outline' text='チームの色（ビブス）'/>
    <Text style={s.hintText}>タップで色を変更</Text>
    <View style={s.teamColorWrap}>{Array.from({length:combo.teams},(_,i)=>i).map((i)=>teamBadge(TEAM_NAMES[i],18,()=>onPickColor(i)))}</View>
  </View>}
</View>}
const SND_OPTS=[['whistle','笛'],['voice','音声'],['both','両方'],['none','なし']];
function SoundSetting({s,t,icon,label,value,options,onChange,onTest,testing}){return <View>
  <View style={s.soundHead}><View style={s.cardLabel}><View style={s.labelIconBadge}>{t.variant==='cyber'&&<ThemeTexture source={THEME_ASSETS.cyberTexture} opacity={0.22}/>}<Ionicons name={icon} size={16} color={t.accent}/></View><Text style={s.soundLabel}>{label}</Text></View><Pressable style={s.testBtn} onPress={onTest}>{t.variant==='cyber'&&<CyberButtonSkin active={testing}/>}<Ionicons name={testing?'stop':'volume-high-outline'} size={14} color={t.muted}/><Text style={s.testText}>テスト</Text></Pressable></View>
  <View style={s.grid2}>{options.map(([k,l])=><Choice key={k} s={s} t={t} active={value===k} label={l} onPress={()=>onChange(k)}/>)}</View>
</View>}
function styles(t){
  const isCyber=t.variant==='cyber';
  const isDark=t.variant==='dark';
  const isLight=t.variant==='light';
  const isPop=t.variant==='pop';
  const shape=shapeOf(t);
  const softAccent=hexRgba(t.accent,isLight?0.14:isPop?0.20:0.18);
  const choiceBg=isCyber?'rgba(9,24,44,.82)':isDark?'rgba(8,32,9,.82)':isLight?'rgba(255,255,255,.88)':'rgba(255,255,255,.80)';
  const choiceBorder=isCyber?'rgba(43,212,255,.32)':isDark?'rgba(126,227,93,.34)':isLight?'rgba(11,116,223,.24)':'rgba(255,138,0,.30)';
  const activeChoiceBg=isCyber?'rgba(43,212,255,.22)':isDark?'rgba(126,227,93,.92)':isLight?'rgba(225,241,255,.96)':'rgba(255,237,174,.96)';
  const choiceText=isCyber?'#eafaff':isDark?'#eaffdf':isLight?'#142a43':'#31263a';
  const activeChoiceText=isCyber?'#eafaff':isDark?'#092508':isLight?'#075fc4':'#4c2a00';
  const choiceRadius=isPop?20:12;
  return StyleSheet.create({
  root:{flex:1,backgroundColor:t.bg},
  scroll:{flex:1},
  container:{paddingHorizontal:16,paddingTop:10,paddingBottom:24},
  containerTwo:{paddingHorizontal:14,paddingTop:6,paddingBottom:10},
  chrome:{marginBottom:6},
  chromeTwo:{marginBottom:2},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,paddingHorizontal:2},
  brand:{flexDirection:'row',alignItems:'center',gap:10,minWidth:0,flex:1},
  brandMark:{width:42,height:42,borderRadius:shape.button,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:t.border,backgroundColor:t.card2,shadowColor:t.accent,shadowOffset:{width:0,height:0},shadowOpacity:0.12,shadowRadius:4,elevation:3},
  titleRow:{flexDirection:'row',alignItems:'center',gap:8},
  title:{flex:1,color:t.text,fontSize:25,fontWeight:'900',fontStyle:t.variant==='light'?'normal':'italic',letterSpacing:0.5,textShadowColor:'transparent',textShadowOffset:{width:0,height:0},textShadowRadius:0},
  menuButton:{width:58,height:50,borderRadius:shape.button,alignItems:'center',justifyContent:'center',backgroundColor:t.card2,borderWidth:1.5,borderColor:t.border,shadowColor:t.accent,shadowOffset:{width:0,height:3},shadowOpacity:0.12,shadowRadius:10,elevation:3},
  timerCard:{marginTop:10,paddingVertical:18,paddingHorizontal:20,borderRadius:14,borderColor:t.accent,borderWidth:1,alignItems:'center',shadowColor:t.accent,shadowOffset:{width:0,height:0},shadowOpacity:0.35,shadowRadius:14,elevation:6},
  runningCard:{marginTop:24,paddingVertical:44,borderColor:t.accent,borderWidth:1.5,shadowColor:t.accent,shadowOpacity:0.5,shadowRadius:22,elevation:12},
  phaseBadge:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:6,borderRadius:999,borderWidth:1.5,borderColor:t.accent},
  phaseText:{color:t.accent,fontSize:15,fontWeight:'900'},
  time:{color:t.text,fontSize:74,fontWeight:'900',letterSpacing:-2,marginTop:4,fontVariant:['tabular-nums']},
  timeRunning:{fontSize:104,marginTop:14},
  actionRow:{flexDirection:'row',gap:10,marginTop:14,width:'100%'},
  cardActionBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:16,borderRadius:10,borderWidth:1.5,borderColor:t.accent,backgroundColor:'transparent',shadowColor:t.accent,shadowOpacity:0.4,shadowRadius:8,elevation:3},
  cardActionText:{color:t.accent,fontSize:16,fontWeight:'900'},
  panel:{marginTop:10,padding:14,borderRadius:shape.panel,backgroundColor:t.card,borderWidth:1,borderColor:t.border},
  matchCard:{marginTop:10,padding:12,borderRadius:shape.panel,backgroundColor:t.card,borderWidth:1,borderColor:t.border},
  matchHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  matchEdit:{padding:7,borderRadius:8,borderWidth:1,borderColor:t.accent,backgroundColor:'transparent'},
  matchTitle:{color:t.text,fontSize:18,fontWeight:'900'},
  matchVs:{color:t.text,fontSize:18,fontWeight:'900',textAlign:'center'},
  courtList:{marginTop:8,gap:6},
  courtRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  courtVs:{flexShrink:1},
  courtTag:{color:t.accent,fontSize:13,fontWeight:'900',width:64},
  vsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,flexShrink:1,flexWrap:'wrap'},
  vsSep:{color:t.accent,fontWeight:'900',fontSize:15,fontStyle:'italic',textShadowColor:'transparent',textShadowOffset:{width:0,height:0},textShadowRadius:0},
  vsTop:{marginTop:8},
  vsTopSm:{marginTop:4},
  twoWrap:{},
  teamBadge:{flexDirection:'row',alignItems:'baseline',gap:4,paddingHorizontal:12,paddingVertical:7,borderRadius:2,borderWidth:1.5,shadowOffset:{width:0,height:0},shadowOpacity:0.4,shadowRadius:6,elevation:3},
  teamBadgeLabel:{fontSize:11,fontWeight:'900',color:'#e8f7ff'},
  teamBadgeNum:{fontFamily:FONT_NUM,textShadowOffset:{width:0,height:0},textShadowRadius:10},
  restRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:6,marginTop:10},
  restLabelText:{color:t.muted,fontSize:13,fontWeight:'800',marginRight:2},
  sharedEditor:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:10},
  timeEditSm:{color:t.text,fontSize:40,fontWeight:'900',letterSpacing:-1,fontVariant:['tabular-nums']},
  courtsWrap:{marginTop:4,gap:6},
  courtCard:{paddingVertical:8,paddingHorizontal:14,borderRadius:shape.panel,borderColor:t.border,borderWidth:1,alignItems:'center'},
  courtEditRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:0},
  courtAdjBtn:{width:54,paddingVertical:6,borderRadius:10,backgroundColor:t.card2,borderWidth:1,borderColor:t.accent,alignItems:'center',gap:1},
  courtCardActive:{borderColor:t.accent,borderWidth:1.5,shadowColor:t.accent,shadowOpacity:0.4,shadowRadius:12,elevation:6},
  courtCardHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',alignSelf:'stretch'},
  courtCardTitle:{color:t.text,fontSize:16,fontWeight:'900'},
  activeBadge:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:5,borderRadius:shape.button,borderWidth:1.5,borderColor:t.border,backgroundColor:choiceBg},
  activeBadgeOn:{borderColor:t.accent,backgroundColor:t.accent},
  activeBadgeText:{color:t.muted,fontSize:12,fontWeight:'900'},
  courtIdle:{color:t.muted,fontSize:14,fontWeight:'800',marginTop:4},
  courtTime:{textAlign:'center',color:t.text,fontSize:38,fontFamily:FONT_NUM,marginTop:0,fontVariant:['tabular-nums'],textShadowColor:'transparent',textShadowOffset:{width:0,height:0},textShadowRadius:0},
  courtBtnRow:{flexDirection:'row',gap:10,marginTop:8,alignSelf:'stretch'},
  courtPrimary:{flex:1,borderRadius:10,overflow:'hidden',shadowColor:t.accent,shadowOpacity:0.45,shadowRadius:9,elevation:4},
  courtPrimaryBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:12,borderRadius:10},
  courtPrimaryText:{color:'#fff',fontSize:17,fontWeight:'900'},
  courtResetBtn:{width:52,alignItems:'center',justifyContent:'center',borderRadius:shape.button,borderWidth:1.5,borderColor:t.accent,backgroundColor:'transparent'},
  scheduleVsRow:{flexDirection:'row',alignItems:'center',gap:8},
  scheduleCourt:{color:t.accent,fontSize:14,fontWeight:'900',width:16},
  swatchGrid:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12,justifyContent:'center'},
  swatch:{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:t.border},
  swatchActive:{borderColor:t.accent,borderWidth:3},
  swatchNum:{fontSize:20,fontWeight:'900'},
  teamColorWrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},
  teamColorChip:{flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:12,paddingVertical:9,borderRadius:999,borderWidth:2,backgroundColor:t.card2},
  teamColorDot:{width:16,height:16,borderRadius:8},
  teamColorName:{color:t.text,fontSize:13,fontWeight:'900'},
  restText:{color:t.muted,fontSize:13,fontWeight:'700',textAlign:'center',marginTop:8},
  matchNav:{flexDirection:'row',gap:8,marginTop:10},
  navBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:10,borderRadius:10,backgroundColor:t.card2,borderWidth:1,borderColor:t.border},
  navText:{color:t.text,fontSize:13,fontWeight:'900'},
  cardLabel:{flexDirection:'row',alignItems:'center',gap:7},
  labelIconBadge:{position:'relative',width:28,height:28,borderRadius:shape.button,alignItems:'center',justifyContent:'center',overflow:'hidden',borderWidth:0,borderColor:'transparent',backgroundColor:'transparent'},
  notifyRow:{flexDirection:'row',alignItems:'center',gap:6},
  notifyPanelTwo:{marginTop:6,paddingVertical:10,paddingHorizontal:14},
  notifyRowTwo:{gap:6},
  notifyTitle:{color:t.text,fontSize:17,fontWeight:'900',marginRight:0},
  soundHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:16},
  soundLabel:{color:t.text,fontSize:15,fontWeight:'900'},
  testBtn:{position:'relative',flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:t.border,backgroundColor:'transparent',overflow:'hidden'},
  testText:{color:t.muted,fontSize:12,fontWeight:'700'},
  sectionTitle:{color:t.text,fontSize:18,fontWeight:'900'},
  labelRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:16,marginBottom:8},
  labelText:{color:t.text,fontSize:16,fontWeight:'900'},
  adjustRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:8},
  adjustLabel:{flex:1,color:t.text,fontSize:28,fontWeight:'900',textAlign:'center'},
  timeEditRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',alignSelf:'stretch',gap:8,marginTop:4},
  timeEditor:{flexShrink:1,flexDirection:'row',justifyContent:'center',alignItems:'center'},
  timeEdit:{color:t.text,fontSize:60,fontWeight:'900',letterSpacing:-1,fontVariant:['tabular-nums']},
  adjBtn:{width:62,paddingVertical:10,borderRadius:10,backgroundColor:t.card2,borderWidth:1,borderColor:t.accent,alignItems:'center',gap:2,shadowColor:t.accent,shadowOpacity:0.25,shadowRadius:6,elevation:2},
  adjBtnLabel:{color:t.accent,fontSize:12,fontWeight:'900'},
  timePart:{paddingHorizontal:8,paddingVertical:4,borderRadius:8},
  timePartActive:{color:t.accent,textDecorationLine:'underline'},
  hintText:{color:t.muted,fontSize:12,fontWeight:'700',textAlign:'center',marginTop:6},
  smallButton:{position:'relative',width:70,paddingVertical:12,borderRadius:10,backgroundColor:t.card2,borderWidth:1,borderColor:t.accent,alignItems:'center',shadowColor:t.accent,shadowOpacity:0.25,shadowRadius:6,elevation:2,overflow:'hidden'},
  grid2:{flexDirection:'row',gap:8,marginTop:8},
  grid3:{flexDirection:'row',gap:8},
  choice:{position:'relative',flex:1,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:5,paddingVertical:13,borderRadius:choiceRadius,backgroundColor:choiceBg,borderWidth:1.5,borderColor:choiceBorder,overflow:'hidden'},
  choiceCompact:{minWidth:0,gap:3,paddingHorizontal:4,paddingVertical:10},
  activeChoice:{borderColor:t.accent,borderWidth:2,backgroundColor:activeChoiceBg,shadowColor:t.accent,shadowOffset:{width:0,height:3},shadowOpacity:0.18,shadowRadius:6,elevation:2},
  choiceText:{color:choiceText,fontWeight:'900',fontSize:14},
  choiceTextCompact:{flexShrink:1,fontSize:13,textAlign:'center'},
  activeChoiceText:{color:activeChoiceText},
  activeCheck:{color:activeChoiceText},
  primaryWrap:{flex:1,borderRadius:10,overflow:'hidden',shadowColor:t.accent,shadowOpacity:0.5,shadowRadius:10,elevation:5},
  primaryButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16,borderRadius:10},
  endButton:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:16,borderRadius:10,backgroundColor:t.danger},
  primaryText:{color:'#fff',fontSize:20,fontWeight:'900'},
  secondaryButton:{flex:1,paddingVertical:14,borderRadius:14,alignItems:'center',backgroundColor:t.card2,borderWidth:1,borderColor:t.border},
  buttonText:{color:t.text,fontWeight:'900',fontSize:15},
  backdrop:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#000'},
  backdropFill:{flex:1},
  drawer:{position:'absolute',top:0,bottom:0,right:0,width:DRAWER_W,backgroundColor:t.card,borderLeftWidth:1,borderColor:t.border},
  drawerContent:{padding:16,paddingTop:(Platform.OS==='android'?(RNStatusBar.currentHeight||0):44)+8,paddingBottom:32},
  drawerHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  closeButton:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:t.card2},
  wideBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:shape.button,backgroundColor:softAccent,borderWidth:1,borderColor:t.border,marginTop:8},
  resetBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:shape.button,backgroundColor:'transparent',borderWidth:1.5,borderColor:t.danger,marginTop:8},
  resetBtnText:{color:t.danger,fontWeight:'900',fontSize:15},
  modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.65)',justifyContent:'center',padding:22},
  modalCard:{backgroundColor:t.card,borderRadius:16,borderWidth:1,borderColor:t.accent,padding:18,maxHeight:'85%',shadowColor:t.accent,shadowOpacity:0.4,shadowRadius:16,elevation:10},
  scheduleHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:(Platform.OS==='android'?(RNStatusBar.currentHeight||0):8)+8,paddingBottom:12,borderBottomWidth:1,borderColor:t.border},
  scheduleClose:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:10,borderRadius:10,backgroundColor:t.card2,borderWidth:1,borderColor:t.accent},
  scheduleBody:{padding:16,paddingBottom:32,gap:8},
  scheduleRow:{flexDirection:'row',alignItems:'center',gap:12,padding:12,borderRadius:12,backgroundColor:t.card,borderWidth:1,borderColor:t.border},
  scheduleRowActive:{borderColor:t.accent,shadowColor:t.accent,shadowOpacity:0.4,shadowRadius:8,elevation:3},
  scheduleNo:{color:t.accent,fontSize:14,fontWeight:'900',width:64},
  scheduleMatches:{flex:1,gap:3},
  scheduleVs:{color:t.text,fontSize:17,fontWeight:'900'},
  scheduleRest:{color:t.muted,fontSize:12,fontWeight:'700',marginTop:2},
  twoMode:{marginTop:4},
  twoMatchHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4,marginBottom:2},
  twoCourtPanel:{marginTop:6,paddingVertical:10,paddingHorizontal:12},
  wmTwo:{marginTop:8},
  copyBox:{marginTop:28,alignItems:'center',gap:4},
  copyText:{color:t.muted,fontSize:11,textAlign:'center'},
  copyLink:{color:t.accent,fontSize:11,textAlign:'center',textDecorationLine:'underline'}
})}
