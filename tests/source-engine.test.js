import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSourceRegistry } from "../sources/registry.js";
import { normalizeStream, normalizeVoice, normalizeEpisodeInfo, streamKind } from "../sources/normalizer.js";
import { qualityNumber, listQualities, selectBestUrl } from "../sources/quality.js";
import { normalizeSubtitles } from "../sources/subtitles.js";
import { isTrustedRuntimeApiUrl, appendRuntimeParams } from "../sources/request-policy.js";

const url=(name)=>`https://media.example.test/${name}`;

test("quality labels recognize 8K, 4K, UHD, 2K, 1080p and HD",()=>{
  assert.equal(qualityNumber("8K"),4320);
  assert.equal(qualityNumber("4K WEB-DL"),2160);
  assert.equal(qualityNumber("UHD"),2160);
  assert.equal(qualityNumber("2K"),1440);
  assert.equal(qualityNumber("Full HD 1080p"),1080);
  assert.equal(qualityNumber("HD"),720);
  assert.equal(qualityNumber("480p"),480);
});

test("quality variants are sorted from highest to lowest and reject unsafe schemes",()=>{
  const qualities={
    "1080p":url("1080.m3u8"),
    "4K":url("4k.m3u8"),
    "720p":url("720.m3u8"),
    "bad":"javascript:alert(1)"
  };
  assert.deepEqual(listQualities({quality:qualities}).map(x=>x.label),["4K","1080p","720p"]);
  assert.equal(selectBestUrl({quality:qualities}),url("4k.m3u8"));
});

test("normalizer selects a 4K URL when the stream has only named quality keys",()=>{
  const normalized=normalizeStream({quality:{"4K":url("4k.m3u8"),"1080p":url("1080.m3u8")}},{id:"demo",name:"Demo"});
  assert.ok(normalized);
  assert.equal(normalized.stream.url,url("4k.m3u8"));
  assert.equal(normalized.kind,"hls");
});

test("normalizer rejects non-HTTP stream URLs",()=>{
  assert.equal(normalizeStream({url:"javascript:alert(1)"},{id:"demo"}),null);
  assert.equal(streamKind({url:"file:///movie.mp4"}),"unsupported");
});

test("stream kind recognizes HLS and DASH",()=>{
  assert.equal(streamKind({url:url("video.m3u8?token=x")}),"hls");
  assert.equal(streamKind({url:url("manifest.mpd")}),"dash");
  assert.equal(streamKind({url:url("movie.mp4")}),"direct");
});

test("voice and episode metadata are normalized",()=>{
  assert.deepEqual(normalizeVoice("Дубляж"),{id:"Дубляж",name:"Дубляж"});
  assert.deepEqual(normalizeEpisodeInfo({s:"2",e:"3",title:"Серия"}),{season:2,episode:3,title:"Серия"});
  assert.deepEqual(normalizeEpisodeInfo({season:-1,episode:0}),{season:0,episode:0,title:""});
});

test("subtitle normalization keeps valid HTTP tracks only",()=>{
  assert.deepEqual(normalizeSubtitles([
    {label:"Русский",lang:"ru",url:url("ru.vtt")},
    {label:"Unsafe",url:"javascript:alert(1)"},
    {label:"Missing URL"}
  ]),[{label:"Русский",lang:"ru",url:url("ru.vtt")}]);
});

test("source registry rejects invalid providers and supports toggling",()=>{
  const registry=createSourceRegistry();
  assert.equal(registry.register({id:"invalid"}),false);
  const provider={id:"demo",name:"Demo",resolve:async()=>[]};
  assert.equal(registry.register(provider),true);
  assert.equal(registry.get("demo"),provider);
  assert.equal(registry.setEnabled("demo",false),true);
  assert.equal(registry.list()[0].enabled,false);
  assert.equal(registry.unregister("demo"),true);
  assert.equal(registry.get("demo"),null);
});

test("Vite has a checked-in fallback catalog module for local and navigation builds",()=>{
  const module=readFileSync(new URL("../tmdb-catalog.generated.js",import.meta.url),"utf8");
  assert.match(module,/export default/);
});

test("core UI hooks used by app.js exist in index.html",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  for(const id of ["app","nav","searchPanel","searchInput","detail","detailPlay","detailTitle","detailTrailer","player","sourceSheet","qualitySheet","voiceSheet","subtitleSheet","episodeSheet","libraryView","continueCards","favoriteCards"]){
    assert.match(html,new RegExp(`id=["']${id}["']`),`Missing required UI element #${id}`);
  }
});


test("runtime credentials and parameters are only attached to configured API origins",()=>{
  const bases=["https://api.example.test/v1","https://mirror.example.test"];
  const credentials={account_email:"user@example.test",uid:"123",luno_token:"secret",lang:"ru",luno_site:"luno.rip"};
  const sourceUrl="https://media.example.test/stream.m3u8";
  assert.equal(isTrustedRuntimeApiUrl(sourceUrl,bases),false);
  assert.equal(appendRuntimeParams(sourceUrl,credentials,bases),sourceUrl);
  const apiUrl="https://api.example.test/v1/lite/events?title=Film";
  assert.equal(isTrustedRuntimeApiUrl(apiUrl,bases),true);
  const enriched=new URL(appendRuntimeParams(apiUrl,credentials,bases));
  assert.equal(enriched.searchParams.get("title"),"Film");
  assert.equal(enriched.searchParams.get("account_email"),"user@example.test");
  assert.equal(enriched.searchParams.get("luno_token"),"secret");
  assert.equal(isTrustedRuntimeApiUrl("javascript:alert(1)",bases),false);
});
