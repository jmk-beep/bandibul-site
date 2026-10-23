/* ==========================================================================
   직원 기능: 로그인(Firebase + 구글) / 글쓰기 / 삭제 / 상단 고정 / 일정 관리
   - @littlelight.or.kr 계정만 직원으로 인정합니다.
   - 실제 권한 확인은 Apps Script(서버)에서 합니다. 이 파일의 확인은 화면 표시용입니다.
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ★ Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)에서 복사한 값을 넣으세요.
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCBYmkiEzpA7Q1KXMnRajyRUUDydlv9oVA',
    authDomain: 'bandibul-site.firebaseapp.com',
    projectId: 'bandibul-site',
    appId: '1:702571736088:web:8d131f8767fad1f852e76d'
};
const STAFF_DOMAIN = '@littlelight.or.kr';

const configReady = !/^PASTE/.test(FIREBASE_CONFIG.apiKey);
const auth = configReady ? getAuth(initializeApp(FIREBASE_CONFIG)) : null;

(function loadCss() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'staff.css';
    document.head.appendChild(link);
})();

const $ = function (id) { return document.getElementById(id); };
const isStaffEmail = function (email) { return !!email && email.toLowerCase().endsWith(STAFF_DOMAIN); };

// ---------------------------------------------------------------------------
// 화면 요소 넣기 (index.html 을 고치지 않도록 여기서 만들어 넣습니다)
// ---------------------------------------------------------------------------
const MODALS_HTML = `
<div id="addAnnouncementModal" class="modal-backdrop">
  <div class="modal-content modal-content-lg">
    <span class="close-button" onclick="closeModal('addAnnouncementModal')">&times;</span>
    <h3>새 공지 작성</h3>
    <div class="admin-form-group"><label for="ann-category">구분</label><select id="ann-category"></select></div>
    <div class="admin-form-group"><label for="ann-title">제목</label><input type="text" id="ann-title" placeholder="제목을 입력하세요"></div>
    <div class="admin-form-group"><label for="ann-content">내용</label>
      <div id="ann-content" class="rich-content-editor" contenteditable="true" data-placeholder="내용을 입력하세요. 이미지를 복사한 뒤 이 안에서 Ctrl+V(붙여넣기) 하면 바로 삽입됩니다. 삽입된 이미지를 클릭하면 크기를 조절할 수 있습니다."></div></div>
    <div class="admin-form-group"><label for="ann-file">첨부파일 (선택, 다운로드용 - 한글/PDF 등)</label><input type="file" id="ann-file"></div>
    <button class="btn btn-primary" id="ann-submit-btn" style="width:100%;" onclick="submitAnnouncement()">등록</button>
  </div>
</div>

<div id="addStoryModal" class="modal-backdrop">
  <div class="modal-content modal-content-lg">
    <span class="close-button" onclick="closeModal('addStoryModal')">&times;</span>
    <h3>반딧불이야기 - 새 글 작성</h3>
    <div class="admin-form-group"><label for="story-category">카테고리</label><select id="story-category" onchange="onStoryCategoryChange()"></select></div>
    <div class="admin-form-group"><label for="story-title">제목</label><input type="text" id="story-title" placeholder="제목을 입력하세요"></div>
    <div class="admin-form-group" id="story-thumbnail-group" style="display:none;">
      <label>소식지 PDF (선택 - 둘 중 하나만 입력하면 됩니다)</label>
      <div class="admin-form-group" style="margin-bottom:0.6rem;"><label for="story-pdf-file" style="font-weight:400; font-size:0.88rem;">① PDF 파일 직접 업로드</label><input type="file" id="story-pdf-file" accept="application/pdf"></div>
      <div class="admin-form-group" style="margin-bottom:0.6rem;"><label for="story-pdf-driveurl" style="font-weight:400; font-size:0.88rem;">② 또는 구글 드라이브 링크 붙여넣기</label><input type="url" id="story-pdf-driveurl" placeholder="https://drive.google.com/file/d/....">
        <p class="admin-form-hint">드라이브에 PDF를 올린 뒤 "링크가 있는 모든 사용자" 보기 권한으로 공유하고, 그 링크를 붙여넣어주세요.</p></div>
      <div class="admin-form-group"><label for="story-thumbnail" style="font-weight:400; font-size:0.88rem;">커스텀 표지 이미지 (선택 - 비워두면 PDF 첫 페이지가 자동으로 표지가 됩니다)</label><input type="file" id="story-thumbnail" accept="image/*"></div>
    </div>
    <div class="admin-form-group"><label for="story-content">내용</label>
      <div id="story-content" class="rich-content-editor" contenteditable="true" data-placeholder="내용을 입력하세요. 이미지를 복사한 뒤 이 안에서 Ctrl+V(붙여넣기) 하면 바로 삽입됩니다. 삽입된 이미지는 드래그해서 위치를 옮기거나 클릭해서 크기를 조절할 수 있습니다."></div></div>
    <div class="admin-form-group"><label for="story-file">첨부파일 (선택 - 여러 개 선택 가능)</label>
      <input type="file" id="story-file" multiple onchange="handleStoryFileInputChange(event)">
      <p class="admin-form-hint" id="story-attachment-status"></p>
      <p class="admin-form-hint">이미지 파일을 선택하면 자동으로 본문 맨 아래에 삽입됩니다(붙여넣기와 동일). PDF·한글 파일 등은 본문 아래에 다운로드용 첨부파일로 등록됩니다.</p></div>
    <button class="btn btn-primary" id="story-submit-btn" style="width:100%;" onclick="submitStory()">등록</button>
  </div>
</div>

<div id="addCalendarEventModal" class="modal-backdrop">
  <div class="modal-content">
    <span class="close-button" onclick="closeModal('addCalendarEventModal')">&times;</span>
    <h3>일정 추가</h3>
    <div class="admin-form-group"><label for="cal-date">시작일</label><input type="date" id="cal-date"></div>
    <div class="admin-form-group"><label for="cal-end-date">종료일 (선택, 여러 날에 걸친 일정만 입력)</label><input type="date" id="cal-end-date">
      <p class="admin-form-hint">비워두면 하루짜리 일정으로 등록됩니다.</p></div>
    <div class="admin-form-group"><label for="cal-title">제목</label><input type="text" id="cal-title" placeholder="일정 제목을 입력하세요"></div>
    <div class="admin-form-group"><label for="cal-memo">메모 (선택)</label><input type="text" id="cal-memo" placeholder="상세 내용을 입력하세요"></div>
    <button class="btn btn-primary" id="cal-submit-btn" style="width:100%;" onclick="submitCalendarEvent()">등록</button>
  </div>
</div>

<div class="submit-loading-overlay" id="submitLoadingOverlay">
  <div class="submit-loading-spinner"></div>
  <div class="submit-loading-text" id="submitLoadingText">처리 중입니다...</div>
</div>`;

function injectUi() {
    document.body.insertAdjacentHTML('beforeend', MODALS_HTML);

    const meta = document.querySelector('.header-meta-info');
    if (meta) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'staffAuthBtn';
        btn.className = 'staff-auth-btn';
        btn.textContent = '직원 로그인';
        btn.addEventListener('click', onAuthButtonClick);
        meta.appendChild(btn);
    }
    const annActions = document.querySelector('#announcements .section-header-actions');
    if (annActions) {
        annActions.insertAdjacentHTML('afterbegin', '<button type="button" class="btn-admin staff-only" onclick="openAddAnnouncementModal()"><i class="fas fa-pen"></i> 새 공지 작성</button>');
    }
    const storyActions = document.querySelector('#gallery .section-header-actions');
    if (storyActions) {
        storyActions.insertAdjacentHTML('afterbegin', '<button type="button" class="btn-admin staff-only" onclick="openAddStoryModal()"><i class="fas fa-pen"></i> 새 글 작성</button>');
    }

    const annSel = $('ann-category');
    Object.keys(ANN_TABS).filter(function (k) { return k !== '전체'; }).forEach(function (c) {
        annSel.insertAdjacentHTML('beforeend', '<option value="' + esc(c) + '">' + esc(c) + '</option>');
    });

    setupContentImagePaste('ann-content');
    setupContentImagePaste('story-content');
}

// ---------------------------------------------------------------------------
// 로그인 / 로그아웃
// ---------------------------------------------------------------------------
function setStaffMode(user) {
    window.BDB_STAFF = !!user;
    document.body.classList.toggle('staff-mode', !!user);
    const btn = $('staffAuthBtn');
    if (btn) btn.textContent = user ? '로그아웃 (' + user.email + ')' : '직원 로그인';
    if (window.LAST_HOME) renderHome(window.LAST_HOME);   // 관리 버튼을 넣거나 빼기 위해 다시 그림
}

function onAuthButtonClick() {
    if (!auth) {
        alert('직원 로그인 설정이 아직 끝나지 않았습니다. (staff.js 의 FIREBASE_CONFIG 를 채워주세요)');
        return;
    }
    if (auth.currentUser) {
        signOut(auth);
        return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: STAFF_DOMAIN.substring(1), prompt: 'select_account' });
    signInWithPopup(auth, provider).catch(function (err) {
        if (err && err.code === 'auth/popup-closed-by-user') return;
        alert('로그인 중 오류가 발생했습니다: ' + (err.code || err.message));
    });
}

if (auth) {
    onAuthStateChanged(auth, function (user) {
        if (user && !isStaffEmail(user.email)) {
            signOut(auth);
            alert(STAFF_DOMAIN + ' 계정으로만 직원 로그인을 할 수 있습니다.');
            return;
        }
        setStaffMode(user);
    });
}

// ---------------------------------------------------------------------------
// 서버(Apps Script) 호출
// ---------------------------------------------------------------------------
async function staffApi(action, args) {
    if (!auth || !auth.currentUser) throw new Error('직원 로그인이 필요합니다.');
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(EXEC_URL, {
        method: 'POST',
        body: JSON.stringify({ action: action, args: args || [], idToken: idToken })   // 문자열 body 는 text/plain 으로 전송됩니다
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || '처리 중 오류가 발생했습니다.');
    return json.data;
}

async function refreshHome() {
    const data = await apiGet('home', { silent: '1' });
    try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* 무시 */ }
    renderHome(data);
}

function showLoadingOverlay(text) {
    $('submitLoadingText').textContent = text || '처리 중입니다...';
    $('submitLoadingOverlay').classList.add('active');
}
function hideLoadingOverlay() { $('submitLoadingOverlay').classList.remove('active'); }

function setBtnLoading(btnId, loading, defaultText) {
    const btn = $(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '처리 중...' : defaultText;
}

function readFileAsDataURL(fileOrInput) {
    return new Promise(function (resolve, reject) {
        const file = (fileOrInput && fileOrInput.files) ? fileOrInput.files[0] : fileOrInput;
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = function () { resolve({ dataUrl: reader.result, name: file.name }); };
        reader.onerror = function () { reject(new Error('파일을 읽는 중 오류가 발생했습니다.')); };
        reader.readAsDataURL(file);
    });
}

// 삭제/고정처럼 확인 후 바로 처리하는 작업
function runAction(loadingText, work) {
    showLoadingOverlay(loadingText);
    return work()
        .then(refreshHome)
        .catch(function (err) { alert('오류가 발생했습니다: ' + err.message); })
        .then(hideLoadingOverlay);
}

document.addEventListener('click', function (e) {
    const b = e.target.closest('[data-staff-action]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const id = b.dataset.id;

    switch (b.dataset.staffAction) {
        case 'pinAnn':
            runAction('처리 중입니다...', function () { return staffApi('toggleAnnouncementPinned', [id]); });
            break;
        case 'delAnn':
            if (confirm('이 공지사항을 삭제하시겠습니까?')) {
                runAction('삭제하는 중입니다...', function () { return staffApi('deleteAnnouncement', [id]); });
            }
            break;
        case 'delStory':
            if (confirm('이 글을 삭제하시겠습니까?')) {
                runAction('삭제하는 중입니다...', function () { return staffApi('deleteStory', [id]); });
            }
            break;
        case 'delStoryDetail':
            if (confirm('이 글을 삭제하시겠습니까?')) {
                runAction('삭제하는 중입니다...', function () { return staffApi('deleteStory', [id]); }).then(function () {
                    history.replaceState({}, '', location.pathname + '#gallery');
                    closeStoryDetail();
                });
            }
            break;
        case 'delCal':
            if (confirm('이 일정을 삭제하시겠습니까?')) {
                closeModal('dayEventModal');
                runAction('삭제하는 중입니다...', function () { return staffApi('deleteCalendarEvent', [id]); });
            }
            break;
        case 'addCal':
            window.openAddCalendarEventFromDay();
            break;
    }
}, true);   // 캡처 단계에서 먼저 받아서, 행 전체의 클릭(상세 열기)이 같이 실행되지 않게 합니다.

// ---------------------------------------------------------------------------
// 본문 이미지 붙여넣기 + 크기 조절
// ---------------------------------------------------------------------------
function uploadEditorImage(editor, dataUrl, fileName) {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-upload-placeholder';
    placeholder.textContent = '이미지 업로드 중... (' + fileName + ')';
    editor.appendChild(placeholder);

    staffApi('uploadContentImage', [dataUrl, fileName]).then(function (result) {
        const img = document.createElement('img');
        img.src = result.url;
        img.className = 'content-resizable-img';
        placeholder.replaceWith(img);
    }).catch(function (err) {
        placeholder.textContent = '이미지 업로드 실패: ' + err.message;
    });
}

function setupContentImagePaste(editorId) {
    const editor = $(editorId);
    if (!editor) return;

    editor.addEventListener('paste', function (e) {
        const cd = e.clipboardData || window.clipboardData;
        if (!cd) return;
        let hasImage = false;
        for (let i = 0; i < cd.items.length; i++) {
            if (cd.items[i].type.indexOf('image') === -1) continue;
            hasImage = true;
            const blob = cd.items[i].getAsFile();
            readFileAsDataURL(blob).then(function (r) {
                uploadEditorImage(editor, r.dataUrl, 'content_' + Date.now() + '.png');
            });
        }
        if (hasImage) e.preventDefault();
    });
    setupImageResize(editor);
}

// 붙여넣기 방식에 따라 브라우저가 img 에 px 크기를 넣어 폭을 넘치게 하는 것을 막습니다.
function sanitizeContentImage(img) {
    img.removeAttribute('width');
    img.removeAttribute('height');
    if (img.style.height) img.style.height = '';
    if (img.style.maxWidth) img.style.maxWidth = '';
    if (img.style.width && img.style.width.indexOf('%') === -1) img.style.width = '';
    img.classList.add('content-resizable-img');
}

function setupImageResize(editor) {
    editor.querySelectorAll('img').forEach(sanitizeContentImage);
    new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.tagName === 'IMG') sanitizeContentImage(node);
                else if (node.querySelectorAll) node.querySelectorAll('img').forEach(sanitizeContentImage);
            });
        });
    }).observe(editor, { childList: true, subtree: true });

    let toolbar = null;

    function hideToolbar() {
        if (toolbar) { toolbar.remove(); toolbar = null; }
        editor.querySelectorAll('img.img-selected').forEach(function (i) { i.classList.remove('img-selected'); });
    }
    function positionToolbar(img) {
        if (!toolbar) return;
        const er = editor.getBoundingClientRect();
        const ir = img.getBoundingClientRect();
        toolbar.style.top = (ir.top - er.top + editor.scrollTop + 8) + 'px';
        toolbar.style.left = (ir.left - er.left + 8) + 'px';
    }
    function showToolbarFor(img) {
        hideToolbar();
        img.classList.add('img-selected');
        toolbar = document.createElement('div');
        toolbar.className = 'image-resize-toolbar';
        toolbar.innerHTML =
            '<button type="button" data-action="smaller" title="작게"><i class="fas fa-search-minus"></i></button>' +
            '<button type="button" data-action="bigger" title="크게"><i class="fas fa-search-plus"></i></button>' +
            '<button type="button" data-action="reset" title="원본 크기"><i class="fas fa-undo"></i></button>';
        toolbar.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        toolbar.addEventListener('click', function (ev) {
            const btn = ev.target.closest('button');
            if (!btn) return;
            let pct = parseInt(img.dataset.widthPercent || '100', 10);
            if (btn.dataset.action === 'bigger') pct = Math.min(100, pct + 20);
            else if (btn.dataset.action === 'smaller') pct = Math.max(20, pct - 20);
            else pct = 100;
            img.dataset.widthPercent = pct;
            img.style.width = pct + '%';
            positionToolbar(img);
        });
        editor.appendChild(toolbar);
        positionToolbar(img);
    }

    editor.addEventListener('click', function (ev) {
        const img = ev.target.closest('img');
        if (img && editor.contains(img)) showToolbarFor(img);
        else if (!ev.target.closest('.image-resize-toolbar')) hideToolbar();
    });
    document.addEventListener('click', function (ev) {
        if (!editor.contains(ev.target) && !(toolbar && toolbar.contains(ev.target))) hideToolbar();
    });
}

// ---------------------------------------------------------------------------
// 공지 작성
// ---------------------------------------------------------------------------
window.openAddAnnouncementModal = function () {
    $('ann-title').value = '';
    $('ann-content').innerHTML = '';
    $('ann-file').value = '';
    openModal('addAnnouncementModal');
};

window.submitAnnouncement = function () {
    const title = $('ann-title').value.trim();
    const category = $('ann-category').value;
    const editor = $('ann-content');
    const content = editor.innerHTML.trim();

    if (!title) { alert('제목을 입력해주세요.'); return; }
    if (editor.querySelector('.image-upload-placeholder')) { alert('이미지 업로드가 아직 진행 중입니다. 잠시 후 다시 시도해주세요.'); return; }

    setBtnLoading('ann-submit-btn', true, '등록');
    showLoadingOverlay('공지사항을 게시하는 중입니다...');

    readFileAsDataURL($('ann-file')).then(function (fileData) {
        const payload = { category: category, title: title, content: content };
        if (fileData) { payload.fileBase64 = fileData.dataUrl; payload.fileName = fileData.name; }
        return staffApi('addAnnouncement', [payload]);
    }).then(function () {
        closeModal('addAnnouncementModal');
        return refreshHome();
    }).then(function () {
        alert('공지사항이 등록되었습니다.');
    }).catch(function (err) {
        alert('등록 중 오류가 발생했습니다: ' + err.message);
    }).then(function () {
        setBtnLoading('ann-submit-btn', false, '등록');
        hideLoadingOverlay();
    });
};

// ---------------------------------------------------------------------------
// 반딧불이야기 글 작성
// ---------------------------------------------------------------------------
let storyPendingAttachments = [];

function updateStoryAttachmentStatus() {
    const el = $('story-attachment-status');
    if (!el) return;
    el.textContent = storyPendingAttachments.length === 0 ? ''
        : '첨부 예정 파일 (' + storyPendingAttachments.length + '개): ' + storyPendingAttachments.map(function (f) { return f.name; }).join(', ');
}

window.onStoryCategoryChange = function () {
    const card = window.LAST_HOME && window.LAST_HOME.cardCategory;
    $('story-thumbnail-group').style.display = ($('story-category').value === card) ? 'block' : 'none';
};

window.handleStoryFileInputChange = function (e) {
    Array.from(e.target.files || []).forEach(function (file) {
        if (file.type && file.type.indexOf('image') === 0) {
            readFileAsDataURL(file).then(function (r) { uploadEditorImage($('story-content'), r.dataUrl, file.name); });
        } else {
            storyPendingAttachments.push(file);
        }
    });
    e.target.value = '';
    updateStoryAttachmentStatus();
};

window.openAddStoryModal = function () {
    if (!window.LAST_HOME) { alert('데이터를 불러온 뒤에 다시 시도해주세요.'); return; }
    const sel = $('story-category');
    sel.innerHTML = Object.keys(window.LAST_HOME.stories || {}).filter(function (n) { return n !== '전체'; }).map(function (n) {
        return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    }).join('');

    $('story-title').value = '';
    $('story-content').innerHTML = '';
    $('story-file').value = '';
    $('story-thumbnail').value = '';
    $('story-pdf-file').value = '';
    $('story-pdf-driveurl').value = '';
    storyPendingAttachments = [];
    updateStoryAttachmentStatus();
    sel.selectedIndex = 0;
    window.onStoryCategoryChange();
    openModal('addStoryModal');
};

window.submitStory = function () {
    const title = $('story-title').value.trim();
    const category = $('story-category').value;
    const editor = $('story-content');
    const content = editor.innerHTML.trim();
    const pdfDriveUrl = $('story-pdf-driveurl').value.trim();

    if (!title) { alert('제목을 입력해주세요.'); return; }
    if (editor.querySelector('.image-upload-placeholder')) { alert('이미지 업로드가 아직 진행 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    if ($('story-pdf-file').files[0] && pdfDriveUrl) { alert('PDF 파일 업로드와 구글 드라이브 링크는 둘 중 하나만 입력해주세요.'); return; }

    setBtnLoading('story-submit-btn', true, '등록');
    showLoadingOverlay('반딧불이야기 글을 게시하는 중입니다...');

    const attachmentPromises = storyPendingAttachments.map(readFileAsDataURL);
    Promise.all([readFileAsDataURL($('story-thumbnail')), readFileAsDataURL($('story-pdf-file'))].concat(attachmentPromises)).then(function (r) {
        const payload = { category: category, title: title, content: content };
        if (r[0]) { payload.thumbnailBase64 = r[0].dataUrl; payload.thumbnailName = r[0].name; }
        if (r[1]) { payload.pdfBase64 = r[1].dataUrl; payload.pdfFileName = r[1].name; }
        else if (pdfDriveUrl) { payload.pdfDriveUrl = pdfDriveUrl; }
        const atts = r.slice(2);
        if (atts.length) payload.attachments = atts.map(function (a) { return { base64: a.dataUrl, name: a.name }; });
        return staffApi('addStory', [payload]);
    }).then(function () {
        closeModal('addStoryModal');
        return refreshHome();
    }).then(function () {
        alert('글이 등록되었습니다.');
    }).catch(function (err) {
        alert('등록 중 오류가 발생했습니다: ' + err.message);
    }).then(function () {
        setBtnLoading('story-submit-btn', false, '등록');
        hideLoadingOverlay();
    });
};

// ---------------------------------------------------------------------------
// 일정 추가
// ---------------------------------------------------------------------------
window.openAddCalendarEventFromDay = function () {
    closeModal('dayEventModal');
    $('cal-date').value = window.selectedCalendarDate || '';
    $('cal-end-date').value = '';
    $('cal-title').value = '';
    $('cal-memo').value = '';
    openModal('addCalendarEventModal');
};

window.submitCalendarEvent = function () {
    const date = $('cal-date').value;
    const endDate = $('cal-end-date').value;
    const title = $('cal-title').value.trim();
    const memo = $('cal-memo').value.trim();

    if (!date || !title) { alert('날짜와 제목을 입력해주세요.'); return; }
    if (endDate && endDate < date) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return; }

    setBtnLoading('cal-submit-btn', true, '등록');
    showLoadingOverlay('일정을 등록하는 중입니다...');
    staffApi('addCalendarEvent', [{ date: date, endDate: endDate, title: title, memo: memo }]).then(function () {
        closeModal('addCalendarEventModal');
        return refreshHome();
    }).then(function () {
        alert('일정이 등록되었습니다.');
    }).catch(function (err) {
        alert('등록 중 오류가 발생했습니다: ' + err.message);
    }).then(function () {
        setBtnLoading('cal-submit-btn', false, '등록');
        hideLoadingOverlay();
    });
};

// ---------------------------------------------------------------------------
injectUi();
