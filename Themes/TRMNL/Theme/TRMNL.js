// ==UserScript==
// @name         Nameless
// @version      1.0
// @description  Website styling and color schemes inspired by Claude AI
// @match        https://www.kogama.com/*
// @author       Marshal
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
'use strict';

const STORAGE_KEY = 'kogama_embedded_term_v4';

function getKogamaUsername() {
    const profileLink = document.querySelector('a[href^="/profile/"][title$="Profile"]');
    if (profileLink) {
        const title = profileLink.title || '';
        const username = title.replace(/\s*Profile$/, '').trim();
        if (username) return username;
    }
    const textLink = document.querySelector('a[href^="/profile/"]');
    if (textLink) return textLink.textContent.trim();

    return 'Guest'; // Default fallback
}

// State object to store username
const state = { username: getKogamaUsername() };

// Save to localStorage (This is risky lol)
function saveState() {
    localStorage.setItem('kogama_embedded_term_v4', JSON.stringify(state));
}

// Function to track username changes dynamically
function trackUsernameChanges() {
    function update() {
        const newName = getKogamaUsername();
        if (newName && newName !== state.username) {
            state.username = newName;
            saveState();
            const prompt = document.querySelector('#kgm-term-prompt .kgm-user');
            if (prompt) prompt.textContent = newName;
        }
    }
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
}

trackUsernameChanges();

GM_addStyle(`
    /* Button */
    #kgm-term-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #181818;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-weight: bold;
        font-family: monospace;
        color: #bfffbf;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    #kgm-term-button:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 36px rgba(168, 70, 31, 0.23);
    }

    /* Panel */
    #kgm-term-panel {
        position: fixed;
        bottom: 0;
        left:0;
        right:0;
        max-height: 50%;
        background: #262624;
        color:#7CFF7C;
        border-top: 1px solid rgba(255, 167, 0, 0.06);
        box-shadow:0 -0 50px #d9775735;
        font-family: monospace;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        z-index: 9998;
        -webkit-font-smoothing: subpixel-antialiased;
        backface-visibility: hidden;
    }
    #kgm-term-panel.open { transform: translateY(0%); }

    #kgm-term-panel.pulse {
        box-shadow: 0 -0 60px #d9775735, 0 -0 60px #d9775735 inset;
        transition: box-shadow 0.12s ease;
    }

    #kgm-resizer {
        height: 6px;
        cursor: ns-resize;
        flex-shrink:0;
    }

    #kgm-resizer:hover{
    background: #d977572e;
    }

    #kgm-term-body{
    flex:1;
    overflow:auto;
    padding: 12px;
    line-height:1.35;
    white-space: pre-wrap;
    position: relative;
    }

    #kgm-term-body::after{
    content:""; position:
    absolute; inset:0;
    pointer-events:none;
    background: repeating-linear-gradient(to bottom, rgba(255, 72, 0, 0.01) 0px, rgba(255, 96, 0, 0.01) 1px, #a8200000 2px);
    mix-blend-mode: overlay;
    }

    #kgm-term-inputbar { display:flex; gap:8px; padding:8px; border-top:1px solid rgba(0,255,120,0.02); align-items:center; }
    #kgm-term-prompt { min-width:220px; font-weight:500; user-select:none; display:flex; gap:4px; align-items:center; }
    #kgm-term-prompt .kgm-user { color:#00ff90; font-weight:600; }
    #kgm-term-prompt .kgm-host { color:#00dfff; }
    #kgm-term-prompt .kgm-dir { color:#ffffff; }
    #kgm-term-input { flex:1; background:transparent; border:none; outline:none; color:inherit; font-family:inherit; font-size:14px; padding:4px 6px; }

    .kgm-cursor { width:10px; height:18px; background: #d97757; display:inline-block; animation:kgm-blink 1s steps(1) infinite; vertical-align: middle; margin-left:2px; border-radius:2px; box-shadow: 0 0 8px #d97757; }
    @keyframes kgm-blink { 50% { opacity:0 } }

    .kgm-line { margin:6px 0; opacity:0; transform: translateY(4px); animation: kgm-fade 0.18s ease-out forwards; }
    @keyframes kgm-fade { to { opacity:1; transform: translateY(0); } }

    .kgm-meta { color:#9bff9b; opacity:0.9; }

    .kgm-error{
    color:#ff6b6b;
    text-shadow: 0 0 6px rgba(255,80,80,0.18);
    animation: kgm-shake 0.16s linear;
    display:inline-block;
    }

    @keyframes kgm-shake{

    0% {transform: translateX(0)}
    25% { transform: translateX(-2px) }
    50% { transform: translateX(2px) }
    75% { transform: translateX(-2px) }
    100% { transform: translateX(0) } }

    #kgm-term-panel.open #kgm-term-input { box-shadow: 0 0 10px rgba(204, 113, 83, 0.11) inset; }

    @media (max-width: 700px)
    {
        #kgm-term-panel{
        max-height: 60%;
    }
        #kgm-term-prompt{
        min-width: 120px;
        font-size: 13px;
        }
        #kgm-term-button{
        width:44px;
        height:44px;
        right:12px;
        bottom:12px;
        }
    }
`);

const btn = document.createElement('div');
btn.id='kgm-term-button';
btn.textContent='$';
document.body.appendChild(btn);

const panel = document.createElement('div');
panel.id='kgm-term-panel';
panel.innerHTML=`
    <div id="kgm-resizer"></div>
    <div id="kgm-term-body"></div>
    <div id="kgm-term-inputbar">
        <div id="kgm-term-prompt"><span class="kgm-user">${state.username}</span>@<span class="kgm-host">kogama</span>:<span class="kgm-dir">~</span>$ </div>
        <input id="kgm-term-input" autocomplete="off"/>
        <div class="kgm-cursor" aria-hidden="true"></div>
    </div>
`;
document.body.appendChild(panel);

btn.addEventListener('click',()=>panel.classList.toggle('open'));

const input=document.getElementById('kgm-term-input');
const body=document.getElementById('kgm-term-body');
let hist=JSON.parse(localStorage.getItem(STORAGE_KEY+'_hist')||'[]');
let histPos=hist.length;

input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
        const cmd=input.value.trim();
        if(cmd.length){ hist.push(cmd); localStorage.setItem(STORAGE_KEY+'_hist', JSON.stringify(hist)); histPos=hist.length; printUser(cmd); processCommand(cmd); input.value=''; }
        e.preventDefault();
    }else if(e.key==='ArrowUp'){ if(histPos>0) histPos--; input.value=hist[histPos]||''; e.preventDefault(); }
    else if(e.key==='ArrowDown'){ if(histPos<hist.length-1){ histPos++; input.value=hist[histPos]||''; } else { histPos=hist.length; input.value=''; } e.preventDefault(); }
});

panel.addEventListener('click',()=>input.focus());

function appendLine(text,cls=''){ const el=document.createElement('div'); el.className='kgm-line '+cls; el.textContent=text; body.appendChild(el); body.scrollTop=body.scrollHeight; }
function printUser(cmd){ appendLine(`${state.username}@kogama:~$ ${cmd}`); }

function processCommand(raw){
    panel.classList.add('pulse');
    setTimeout(()=>panel.classList.remove('pulse'), 160);

    const parts=raw.split(' ').filter(Boolean);
    const cmd=parts.shift().toLowerCase();
    const arg=parts.join(' ');

    switch(cmd){

        case 'help':
            appendLine('Commands:');
            appendLine('  help                - Show help menu');
            appendLine('  cls                 - Clear screen');
            appendLine('  echo <text>         - Print text');
            appendLine('  reload              - Reload the page');
            appendLine('  game <id>           - Open game by ID');
            appendLine('  profile <id>        - Open profile by ID');
            appendLine('  mylevel            - Open your levels');
            appendLine('  leaderboard         - Open leaderboard');
            break;

        case 'cls': body.innerHTML=''; break;
        case 'echo': appendLine(arg); break;
        case 'reload': appendLine('Reloading...'); location.reload(); break;
        case 'game': if(!arg) appendLine('Usage: game <id>'); else { appendLine('Opening game...'); window.open('https://www.kogama.com/games/play/' + arg + '/', '_blank'); } break;
        case 'profile': if(!arg) appendLine('Usage: profile <id>'); else { appendLine('Opening profile...'); window.open('https://www.kogama.com/profile/' + arg + '/', '_blank'); } break;
        case 'mylevel': {
            const link = document.querySelector('a[href^="/profile/"]');
            if(!link) appendLine('Error: cannot detect your profile ID');
            else {
                const match = link.href.match(/profile\/(\d+)/);
                if(!match) appendLine('Profile ID not found');
                else { const id = match[1]; const url = 'https://www.kogama.com/profile/' + id + '/levels/'; window.open(url, '_blank'); appendLine('Opening YOUR level: ' + url); }
            }
            break;
        }
        case 'leaderboard': window.open('https://www.kogama.com/leaderboard/', '_blank'); appendLine('Opening leaderboard'); break;

        default: appendLine(`'${raw}' not recognized. Type 'help'.`,'kgm-error');
    }
}

function cmdList(){
    const anchors=Array.from(document.querySelectorAll('a[href]')).filter(a=>a.offsetParent!==null).slice(0,100);
    if(!anchors.length){ appendLine('No visible links found.'); return; }
    appendLine('Index | href/text');
    window.__kgm_last_list=anchors;
    anchors.forEach((a,i)=>{ const t=(a.innerText||a.href).trim().slice(0,100); appendLine(`${i+1} | ${t}`); });
}

function cmdClick(idx){
    const arr=window.__kgm_last_list||[]; if(!arr.length){ appendLine('Run "list" first.'); return; }
    const el=arr[idx-1]; if(!el){ appendLine('Index out of range'); return; }
    if(el.href){ window.open(el.href,'_blank'); appendLine('Opened '+el.href); } else { el.click(); appendLine('Clicked element'); }
}

function cmdOpen(arg){
    if(!arg) return appendLine('Usage: open <selector|url>');
    if(arg.startsWith('http') || arg.includes('.') && !arg.startsWith('.')){
        window.open(arg,'_blank'); appendLine('Opened '+arg); return;
    }
    const sel=document.querySelector(arg);
    if(!sel){ appendLine('Selector not found'); return; }
    sel.click(); appendLine('Opened element: '+arg);
}

function cmdSearch(q){
    const form=document.querySelector('form[action*="search"], form#search');
    if(form){
        const input=form.querySelector('input[type="search"], input[name*="search"]');
        if(input){ input.value=q; form.submit(); appendLine('Search submitted.'); return; }
    }
    window.open('https://www.google.com/search?q=site:'+location.hostname+' '+encodeURIComponent(q),'_blank');
    appendLine('Google site search executed.');
}

(function verticalResize() {
    const resizer = document.getElementById('kgm-resizer');
    let dragging = false;

    const savedH = localStorage.getItem(STORAGE_KEY + "_height");
    if (savedH) panel.style.maxHeight = savedH;

    resizer.addEventListener('mousedown', e => {
        dragging = true;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const newHeight = window.innerHeight - e.clientY;
        const clamped = Math.max(120, Math.min(newHeight, window.innerHeight * 0.9));
        panel.style.maxHeight = clamped + "px";
    });

    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            document.body.style.userSelect = '';
            localStorage.setItem(STORAGE_KEY + "_height", panel.style.maxHeight);
        }
    });
})();

appendLine(`[${new Date().toLocaleTimeString()}] Embedded terminal ready. Type 'help'.`, 'kgm-meta');

})();

(function() {
    GM_addStyle(`
        body, html, ._3tb2D ._3FTpW, ._3tb2D ._3FTpW h1, .css-1srashi{
            background: #1c1c1a !important;
            color: #d97757 !important;
            }

            .css-zslu1c, .css-1udp1s3, .css-1xh9k1k, ._1Yt8Y, .uwn5j, ._375XK, ._375XK ._2XaOw ._1j2Cd._1Xzzq p, .css-9la3qa, ._3TORb, ._1v4CT, .css-1rbdj9p, .css-rqc8s9, .css-qr6c39, .css-qekl0d, .css-1c1ttle, .css-16fidy5, .css-b0qydj, .css-1u23iwy, .css-fw2tbd, .css-cisn0m, .css-srzahu, .css-udteg1, ._2i6NQ, .css-1n00yj3{
            background-color: #1d1e20b0 !important;
            border-radius: 10px !important;
            color: #d97757 !important;
            background-image : none !important;
            }

            div, h1, h2, h3, h4, textarea, p, span, a, button{
            font-family: Consolas, "Lucida Console", monospace !important;
            color: #d97757 !important;
            }

            .css-k9ok3b.Mui-error .MuiOutlinedInput-notchedOutline{
            border-color: #d97757 !important;
            }

            ._34V3h ._1ww_g .aIhLa{
            background-color: #99563f5c;
            }

            ._34V3h ._1ww_g{
            background-color: #d9775761;
            }

            ._375XK ._2XaOw ._1j2Cd p{
            border: solid 1px #d97757;
            }

            ._3TORb ._2E1AL .tRx6U{
            background-color: transparent;
            }
    `);
})();

(function() {
'use strict';

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.stopPropagation();
    }
}, true);

document.addEventListener('contextmenu', function(e) {
    e.stopPropagation();
}, true);

document.addEventListener('paste', function(e) {
    e.stopPropagation();
}, true);

})();
