let _manifest;
let _scenario;
let _stage;
let audioes = {}
export async function playAudio(urlScheme, cbb, volume = 1, load = false) {
    let ended = false;
    try {
        let preLoaded = !!audioes[urlScheme];
        const audio = preLoaded ? audioes[urlScheme] : new Audio(urlScheme); // 오디오 엘리먼트 생성
        if (!preLoaded) audioes[urlScheme] = audio;
        if (!preLoaded) audio.volume = volume; // 볼륨 설정 (0.0에서 1.0 사이의 값)
        if (!preLoaded) await new Promise((resolve) => audio.onloadedmetadata = () => resolve());
        if (!preLoaded) if (load) return;
        audio.currentTime = 0; // 재생 위치를 가장 처음으로 설정
        const playPromise = audio.play(); // 오디오 재생 시도
        if (playPromise !== undefined) await playPromise
        function cb() {
            if (!cbb || ended) return;
            const duration = audio.duration; // 전체 길이 (초 단위)
            const currentTime = audio.currentTime; // 현재 재생 위치 (초 단위)
            if (cbb) cbb(duration, currentTime)
            requestAnimationFrame(cb);
        }
        cb();
        await new Promise((resolve) => {
            audio.onended = () => { ended = true; resolve(null); }
            audio.onerror = (error) => {
                ended = true;
                throw error; // 오류 발생 시 오류를 던짐
            };
        });
    } catch (error) {
        ended = true;
        throw error; // 오류를 다시 던져서 호출자가 처리할 수 있도록 함
    }
}

export function recordingStart() {
    window.readyd = true;
}
export async function recordingEnd() {
    let time = 1;
    getStage().style.transition = `opacity ${time}s`;
    await delay(32);
    getStage().style.opacity = '0';
    await delay(1000 * time * 1.5);
    window.doned = true;
}
export function delay(time) {
    return new Promise(r => setTimeout(r, time))
}
export function createStage(manifest) {
    const { width, height } = manifest.screen_size;
    const { background_color } = manifest;
    let box = document.createElement('div');
    box.style.position = 'relative'
    box.style.backgroundColor = background_color
    document.body.appendChild(box);
    function setBoxSize() {
        const aspectRatio = width / height;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        if (viewportWidth / viewportHeight > aspectRatio) {
            box.style.height = '100vh';
            box.style.width = `${100 * aspectRatio}vh`; // 100vh * aspectRatio
        } else {
            box.style.width = '100vw';
            box.style.height = `${100 / aspectRatio}vw`; // 100vw / aspectRatio
        }
        box.style.maxWidth = `${100 * aspectRatio}vh`; // 100vh * aspectRatio
        box.style.maxHeight = '100vh';
    }
    window.addEventListener('resize', setBoxSize);
    window.dispatchEvent(new Event('resize'));
    return box;
}
export function addSubtitle(forMeasure = false) {
    let sub = document.createElement('div');
    sub.style.background = _manifest.subtitle.background;
    sub.style.color = _manifest.subtitle.color;
    sub.style.fontSize = `${size(_manifest.subtitle.fontSize)}px`
    sub.style.position = `absolute`;
    sub.style.textAlign = `center`;
    sub.style.zIndex = `1`;
    sub.style.left = `${size(_manifest.subtitle.margin)}px`;
    sub.style.right = `${size(_manifest.subtitle.margin)}px`;
    sub.style.padding = `${size(_manifest.subtitle.padding)}px`;
    sub.style.margin = `${0}px`;
    if (_manifest.subtitle.bottom) sub.style.bottom = `${size(_manifest.subtitle.bottom)}px`;
    if (_manifest.subtitle.top) sub.style.top = `${size(_manifest.subtitle.top)}px`;
    if (forMeasure) {
        sub.style.paddingTop = `${0}px`;
        sub.style.paddingBottom = `${0}px`;
        sub.style.marginTop = `${0}px`;
        sub.style.marginBottom = `${0}px`;
        sub.style.lineHeight = `100%`;
    }
    getStage().appendChild(sub);
    const inst = {
        element: sub,
        set text(value) {
            sub.innerText = value;
            if (!value) sub.style.display = 'none';
            else sub.style.display = '';
        },
        get text() { return sub.innerText; },
        get height() { return sub.getBoundingClientRect().height; }
    };
    inst.text = '';
    return inst;

}
function size(theSize) {
    const manifest = _manifest;
    return (manifest.actual_size.width * theSize) / manifest.screen_size.width;
}
function getStage() {
    return _stage;
}
let _screenResources;
export async function main(body) {
    if (!location.hash) await new Promise(rr => document.body.addEventListener('keydown', () => { rr() }));
    const manifest = await loadManifest();
    const scenario = await loadScenario();
    _manifest = manifest;
    _scenario = scenario;
    await Promise.all(Object.keys(manifest.fonts).map(key => {
        return new Promise(resolve => {
            const font = new FontFace(key, `url(${manifest.fonts[key]})`);
            document.fonts.add(font);
            font.load();
            document.fonts.ready.then(() => resolve(key));
        })
    }));
    // console.log(`./resources/${scenario.background_music.filename}`);
    let bgm;
    if (scenario?.background_music?.filename) bgm = playAudio(`./resources/${scenario.background_music.filename}`, null, scenario.background_music.volume, true)
    const promises = [bgm, ...scenario.timeline.map(d => {
        if (!d.audio) return;
        return playAudio(`./resources/${d.audio}`, null, 1, true);
    })].filter(a => a?.constructor === Promise);
    // console.log(44444444444444)
    await Promise.all(promises);
    const screenResources = await getScreenResources();
    _screenResources = screenResources;
    while (document.readyState !== 'complete') await delay(0);
    document.body.style.background = '#000000';
    const stage = createStage(manifest);
    _stage = stage;
    await delay(!location.hash ? 0 : 5000);
    const measured = stage.getBoundingClientRect();
    manifest.actual_size = { width: measured.width, height: measured.height }
    {
        _scenario.timeline.forEach(ddd => {
            if (ddd.screen) ddd.screen.forEach(adsfaf => {
                if (adsfaf.width || adsfaf.height) return;

                adsfaf.resource;
                adsfaf.width;
                adsfaf.height;
                adsfaf.align_horizontal;
                adsfaf.align_vertical;

                let resSizeWidth = 0;
                let resSizeHeight = 0;
                if (_screenResources[adsfaf.resource].constructor === HTMLVideoElement) {
                    resSizeWidth = _screenResources[adsfaf.resource].videoWidth;
                    resSizeHeight = _screenResources[adsfaf.resource].videoHeight;
                } else {
                    resSizeWidth = _screenResources[adsfaf.resource].width;
                    resSizeHeight = _screenResources[adsfaf.resource].height;
                }
                // console.log(manifest.actual_size)

                // 예시: 사용법
                const containerWidth = manifest.screen_size.width;
                const containerHeight = manifest.screen_size.height;
                const resizedDimensions = resizeToFitContainer(resSizeWidth, resSizeHeight, containerWidth, containerHeight);
                adsfaf.width = resizedDimensions.width;
                adsfaf.height = resizedDimensions.height;


                if (adsfaf.align_horizontal === undefined && adsfaf.x === undefined) adsfaf.align_horizontal = 'center'
                if (adsfaf.align_vertical === undefined && adsfaf.y === undefined) adsfaf.align_vertical = 'middle'
            })
        })
    }

    body(stage, manifest, scenario, size, screenResources)
    if (false) setTimeout(() => { }, !location.hash ? 0 : 5000);
}
export function resizeToFitContainer(resSizeWidth, resSizeHeight, containerWidth, containerHeight) {
    // 사진과 컨테이너의 원래 비율 계산
    const aspectRatio = resSizeWidth / resSizeHeight;

    // 컨테이너의 비율 계산
    const containerRatio = containerWidth / containerHeight;

    let newWidth, newHeight;

    if (aspectRatio > containerRatio) {
        // 사진의 가로가 더 길 때: 가로 기준으로 리사이즈
        newWidth = containerWidth;
        newHeight = containerWidth / aspectRatio;
    } else {
        // 사진의 세로가 더 길 때: 세로 기준으로 리사이즈
        newHeight = containerHeight;
        newWidth = containerHeight * aspectRatio;
    }

    return {
        width: newWidth,
        height: newHeight
    };
}

export async function startBGM() {
    if (!_scenario?.background_music?.filename) return;
    return playAudio(`./resources/${_scenario.background_music.filename}`, null, _scenario.background_music.volume, false)
}
export async function loadManifest() {
    let res = await fetch('manifest.json');
    return await res.json();
}
export async function loadScenario() {
    let res = await fetch('scenario.json');
    let data = await res.json();
    let cnt = 0;
    if (data.default_appear_disappear && data.default_appear_disappear.constructor !== Array) data.default_appear_disappear = [data.default_appear_disappear]
    data.timeline.forEach(scene => {
        if (!scene.screen) return;
        if (scene.screen.constructor === Array) {
        } else {
            scene.screen = [scene.screen];
        }
        scene.screen.forEach(dd => {
            cnt++;
            const ext = dd.resource.split('.').at(-1);
            dd.resource = `${dd.resource}?v=${cnt}.${ext}`;
            if (false) console.log(dd.resource);
            if (dd.appear && dd.appear.constructor !== Array) dd.appear = [dd.appear]
            if (dd.disappear && dd.disappear.constructor !== Array) dd.disappear = [dd.disappear]
            if (dd.appear_disappear && dd.appear_disappear.constructor !== Array) dd.appear_disappear = [dd.appear_disappear]
            if (!dd.appear) dd.appear = [];
            if (!dd.disappear) dd.disappear = [];
            if (!dd.appear_disappear) dd.appear_disappear = [];
            if (dd.appear_disappear) {
                dd.appear = [...dd.appear, ...JSON.parse(JSON.stringify(dd.appear_disappear))];
                dd.disappear = [...dd.disappear, ...JSON.parse(JSON.stringify(dd.appear_disappear))];
            }
            if (data.default_appear_disappear) {
                dd.appear = [...dd.appear, ...JSON.parse(JSON.stringify(data.default_appear_disappear))];
                dd.disappear = [...dd.disappear, ...JSON.parse(JSON.stringify(data.default_appear_disappear))];
            }
        });
    })
    if (false) console.log(JSON.stringify(data, undefined, 3));
    return data;
}
export function sentenceSpliter(sentence, lc = 1, fontFamily) {
    let morphemes = sentence.split(' ');
    let line = addSubtitle(true)
    line.element.style.fontFamily = fontFamily;
    let mlist = [];
    line.text = '에 ';
    let lh1 = line.height / 2;
    let picked = [];
    // let lc = 1;
    for (let i = 0; true; i++) {
        line.text += '에 ';
        let height_ = line.height;
        if (picked.at(-1) === undefined) {
            picked.push(height_)
        } else {
            if (height_ - picked.at(-1) > lh1) {
                picked.push(height_)
            }
        }
        if (picked.length >= lc) break;
    }
    line.text = '';
    let mo = [];
    for (let morpheme of morphemes) {
        let backup = [...mlist];
        let virtua = [...mlist, morpheme]
        line.text = virtua.join(' ');
        if (picked.at(-1) + lh1 < line.height) {
            mo.push(backup)
            mlist = [morpheme]
            line.text = '';
        } else {
            mlist = virtua
        }
    }
    mo.push(mlist)
    let ss = 0;
    mo = mo.map(a => {
        let r = { len: a.join(' ').length, sentence: a.join(' ') }
        ss += r.len
        return r;
    })
    mo.forEach(a => {
        a.per = a.len / ss
        delete a.len
    })
    line.element.remove();
    {
        let nu = 0;
        for (let i = 0; i < mo.length; i++) {
            nu += mo[i].per;
            mo[i].aper = nu;
        }
    }
    return mo;
}

export async function getScreenResources() {
    const scenario = _scenario;
    return await new Promise(resolve => {
        function isImage(name) {
            let image = { jpg: true, jpeg: true, webp: true, gif: true, png: true };
            return !!(image[name.split('.').at(-1).toLowerCase()]);
        }
        const resources = {};
        let cnt = 0;
        function chekcResolve() {
            cnt--;
            if (cnt === 0) resolve(resources);
        }
        function load(screen) {
            if (isImage(screen.resource)) {
                let img = document.createElement('img');
                let fn = screen.resource.split('?')[0];
                img.src = `./resources/${fn}`;
                img.onload = function () {
                    resources[screen.resource] = img;
                    chekcResolve();
                };
            } else {
                let video = document.createElement('video');
                let fn = screen.resource.split('?')[0];
                video.src = `./resources/${fn}`;
                if (screen.volume !== undefined) video.volume = screen.volume;
                video.onloadedmetadata = function () {
                    resources[screen.resource] = video;
                    chekcResolve();
                };
            }
            cnt++;
        }
        for (const scene of scenario.timeline) {
            const screen = scene?.screen;
            if (!screen) continue;
            if (screen.constructor === Array) {
                screen.forEach(screen => load(screen));
            } else {
                load(screen)
            }
        }
    });
}
export async function playAudioScript(scene, screenInst) {
    // let screenInst = { previousScreen: null, currentScreen: null };
    if (false) if (!scene.audio) return;
    if (scene.screen) scene.screen.forEach((screen, i) => {
        screen.aper = (i + 1) / scene.screen.length
    });
    let listdd = [];
    const manifest = _manifest;
    if (scene.sentences) Object.keys(scene.sentences).forEach(lan => {
        if (manifest.subtitle.exclude.includes(lan)) return;
        const view = addSubtitle();
        let fontFamily = manifest.subtitle.fontFamilys[lan];
        view.element.style.fontFamily = fontFamily;
        listdd.push({ cur: 0, view, data: sentenceSpliter(scene.sentences[lan], 1, fontFamily) });
    });
    if (scene.sentence) {
        if (false) console.log(JSON.stringify(scene, undefined, 3))
        const view = addSubtitle();
        let fontFamily = manifest.subtitle.fontFamily;
        view.element.style.fontFamily = fontFamily;
        if (scene.sentence) listdd.push({ cur: 0, view, data: sentenceSpliter(scene.sentence, 1, fontFamily) });
    }
    function align() {
        let nu = size(manifest.subtitle.bottom);
        for (let i = 0; i < listdd.length; i++) {
            const view = listdd[i].view;
            view.element.style.bottom = `${nu}px`;
            nu += view.height + size(manifest.subtitle.term);
        }
    }
    let sceneCur = 0;
    let frameCallback = (a, b) => {
        let cd = b / a;
        if (scene.screen) if (scene.screen[sceneCur].aper < cd) sceneCur++;
        if (scene.screen && screenInst.previousScreen !== scene.screen[sceneCur]) {
            let prev_screen = screenInst.previousScreen;
            let next_screen = scene.screen[sceneCur];
            if (prev_screen) {
                (async () => {
                    if (false) console.log('이전', prev_screen, prev_screen.disappear)
                    await transitionAppearing(_screenResources[prev_screen.resource], prev_screen.disappear, false);
                    _screenResources[prev_screen.resource].remove();
                })();
            }
            if (next_screen) {
                if (false) console.log('다음', next_screen, next_screen.appear)
                displayScreen(_screenResources[next_screen.resource], next_screen)
                transitionAppearing(_screenResources[next_screen.resource], next_screen.appear, true)
            }
            screenInst.previousScreen = scene.screen[sceneCur]
        }
        for (let i = 0; i < listdd.length; i++) {
            const view = listdd[i].view;
            const data = listdd[i].data;
            data[listdd[i].cur]
            if (data[listdd[i].cur].aper < cd) listdd[i].cur++;
            let sentence = data[listdd[i].cur].sentence;
            if (view.text !== sentence) {
                view.text = sentence
                align();
            }
            if (false) view.element.style.opacity = '0.3';
        }
    };
    async function sleeeping(timeout, cb) {
        let difsj = new Date();
        while (true) {
            let cur = (new Date() - difsj) / 1000;
            if (cur > timeout) cur = timeout;
            cb(timeout, cur);
            if (cur >= timeout) break;
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }
    if (!scene.sleep_second) scene.sleep_second = 3;
    if (scene.audio) await playAudio(`./resources/${scene.audio}`, frameCallback);
    else await sleeeping(scene.sleep_second, frameCallback);
    listdd.forEach(dd => dd.view.element.remove());
}
export function sizeEffct(jd) {
    function processString(input) {
        const match = input.match(/(\d+)/);
        if (match) {
            const number = parseInt(match[1], 10);
            const newSize = size(number);
            return input.replace(number, newSize);
        }
        return input;
    }
    Object.keys(jd).forEach(key => {
        if (key === 'filter') jd[key] = processString(jd[key]);
    });
    return jd;
}
export function transitionAppearing(physic, apinst, appearMode) {
    if (!apinst) return;
    apinst = JSON.parse(JSON.stringify(apinst));
    let att = {};
    apinst.forEach(appear => {
        appear = sizeEffct(appear);
        if (appear.x) appear.x = size(appear.x);
        if (appear.y) appear.y = size(appear.y);
        if (!appearMode && appear.opacity) appear.opacity = 0;
        Object.keys(appear).forEach(key => {
            if (!appear.duration) return;
            if (key === 'duration') return;
            att[key] = { value: appear[key], duration: appear.duration }
        })
    });
    let baseDefault = { x: 0, y: 0, filter: 'blur(0px)', scale: 1, rotation: 0, opacity: 1, };
    if (appearMode) {
        return Promise.all(Object.keys(att).map(attribute_name => {
            let { value, duration } = att[attribute_name];
            gsap.set(physic, { [attribute_name]: value });
            return new Promise(resolve => {
                gsap.to(physic, { [attribute_name]: baseDefault[attribute_name], duration, onComplete: resolve });
            })
        }))
    } else {
        return Promise.all(Object.keys(att).map(attribute_name => {
            let { value, duration } = att[attribute_name];
            return new Promise(resolve => {
                gsap.to(physic, { [attribute_name]: value, duration, onComplete: resolve });
            })
        }))
    }
}

export function displayScreen(currentResource, currentScreen) {
    // const { currentScreen } = screenInst;
    currentResource.style.position = 'absolute';
    const stage = getStage();
    if (currentResource.constructor === HTMLImageElement) {
        // if (screenInst.previousScreen) screenInst.previousScreen.remove();
        stage.appendChild(currentResource);
        // screenInst.previousScreen = currentResource;
    }
    if (currentResource.constructor === HTMLVideoElement) {
        // if (screenInst.previousScreen) screenInst.previousScreen.remove();
        stage.appendChild(currentResource);
        // screenInst.previousScreen = currentResource;
        currentResource.removeAttribute('loop');
        if (currentScreen.loop) currentResource.setAttribute('loop', '');
        currentResource.currentTime = 0;
        currentResource.play();
    }
    if (undefined !== currentScreen.x) currentResource.style.left = `${size(currentScreen.x)}px`;
    if (undefined !== currentScreen.y) currentResource.style.top = `${size(currentScreen.y)}px`;
    if (undefined !== currentScreen.width) currentResource.style.width = `${size(currentScreen.width)}px`;
    if (undefined !== currentScreen.height) currentResource.style.height = `${size(currentScreen.height)}px`;
    if (undefined !== currentScreen.align_horizontal) {
        if (currentScreen.align_horizontal === "left") currentResource.style.left = `${size(0)}px`;
        if (currentScreen.align_horizontal === "right") currentResource.style.left = `${stage.getBoundingClientRect().width - currentResource.getBoundingClientRect().width}px`;
        if (currentScreen.align_horizontal === "center") currentResource.style.left = `${(stage.getBoundingClientRect().width - currentResource.getBoundingClientRect().width) / 2}px`;
    }
    if (undefined !== currentScreen.align_vertical) {
        if (currentScreen.align_vertical === "top") currentResource.style.top = `${size(0)}px`;
        if (currentScreen.align_vertical === "bottom") currentResource.style.top = `${stage.getBoundingClientRect().height - currentResource.getBoundingClientRect().height}px`;
        if (currentScreen.align_vertical === "middle") currentResource.style.top = `${(stage.getBoundingClientRect().height - currentResource.getBoundingClientRect().height) / 2}px`;
    }
}