/* ==========================================================================
   반딧불단기보호센터 공개 사이트 (읽기 전용)
   데이터는 Apps Script(exec 주소)에서 JSON 으로 받아옵니다.
   글쓰기/삭제 등 직원 기능은 기존 Apps Script 주소의 화면에서 그대로 사용합니다.
   ========================================================================== */

// ★ Apps Script 웹앱 주소 (배포 > 배포 관리에서 확인한 주소와 같은지 확인하세요)
const EXEC_URL = 'https://script.google.com/macros/s/AKfycbxoiQxgO6abZVUrmndtal_szyAsTpK1a-mHarwYu7JisL1xWXNwT0pa5fN2zs1aNFTyPQ/exec';

const HOME_CACHE_KEY = 'bdb_home_v1';

// ----- 우측 도구모음 링크 -----
const DONATION_FORM_URL = '';
const VOLUNTEER_FORM_URL = '';
const APPSHEET_URL = 'https://www.appsheet.com/start/76325f3d-54bf-4fe2-8036-86ebb79dd858?platform=desktop#appName=%EC%95%B1%EC%8B%9C%ED%8A%B8%ED%86%B5%ED%95%A9-890193808&vss=H4sIAAAAAAAAA52OOw7CMBBE7zK1T-AWUSAEDYgGU5h4LVkkdhQ7QGS55wockjuw4SNaoNzZeTOTcXR0WiVdHSC3-XPNaYBEVlgPLSlIhUnwqQu1glBY6uYp3q4XhYKyE280UYTMX5Py704BZ8gnZx11Y8wIMf5C-D0CLLAdRaDpk97X9FjI9lJYs6HqI5kND_itOM789NxqbxbBcJrVdaRyB5eTdq5MAQAA&view=%ED%99%88';
const INTRANET_URL = 'https://sites.google.com/littlelight.or.kr/test/%ED%99%88';
const HERO_VIDEO_URL = 'https://cdn.jsdelivr.net/gh/jmk-beep/bandibul-assets@main/homepagemain.mp4';

const $ = function (id) { return document.getElementById(id); };

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

// 팝업 열기/닫기 (Footer 안의 같은 함수가 있으면 그것을 씁니다)
if (typeof window.openModal !== 'function') {
    window.openModal = function (id) { var el = $(id); if (el) el.classList.add('active'); };
    window.closeModal = function (id) { var el = $(id); if (el) el.classList.remove('active'); };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
function apiGet(action, params) {
    const q = new URLSearchParams(Object.assign({ action: action }, params || {}));
    return fetch(EXEC_URL + '?' + q.toString())
        .then(function (r) { return r.json(); })
        .then(function (j) {
            if (!j.ok) throw new Error(j.error || '요청 처리 중 오류가 발생했습니다.');
            return j.data;
        });
}

// ---------------------------------------------------------------------------
// 레이아웃 / 헤더 / 시계
// ---------------------------------------------------------------------------
function updateLayoutMetrics() {
    const header = document.querySelector('header');
    if (header) document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    document.documentElement.style.setProperty('--app-vh', (window.innerHeight * 0.01) + 'px');
}
window.addEventListener('resize', updateLayoutMetrics);
window.addEventListener('orientationchange', updateLayoutMetrics);
window.addEventListener('load', updateLayoutMetrics);
setTimeout(updateLayoutMetrics, 300);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateLayoutMetrics);
updateLayoutMetrics();

function headerHeight() { return document.querySelector('header').offsetHeight; }

function scrollToHome() {
    const home = $('home');
    if (home) {
        window.scrollTo({ top: home.getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    $('navLinks').classList.remove('active');
    const icon = $('hamburgerMenu').querySelector('i');
    if (icon.classList.contains('fa-times')) icon.classList.replace('fa-times', 'fa-bars');
    document.querySelectorAll('.nav-links > li.has-sub-menu.active').forEach(function (li) { li.classList.remove('active'); });
}

$('hamburgerMenu').addEventListener('click', function () {
    const nav = $('navLinks');
    nav.classList.toggle('active');
    if (nav.classList.contains('active')) {
        $('hamburgerMenu').querySelector('i').classList.replace('fa-bars', 'fa-times');
    } else {
        closeMobileMenu();
    }
});

function updateHeaderDateTime() {
    const now = new Date();
    $('current-date').textContent = now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' });
    $('current-time').textContent = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
updateHeaderDateTime();
setInterval(updateHeaderDateTime, 1000);

window.addEventListener('scroll', function () {
    document.querySelector('header').style.boxShadow = window.scrollY > 50
        ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        : '0 1px 2px 0 rgb(0 0 0 / 0.05)';
});

function openSideLink(url) {
    if (!url) { alert('추후 연결 예정입니다.'); return; }
    window.open(url, '_blank', 'noopener');
}

// 히어로 영상
(function setupHeroVideo() {
    const video = $('heroVideo');
    if (!video || !HERO_VIDEO_URL) return;
    const source = document.createElement('source');
    source.src = HERO_VIDEO_URL;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.addEventListener('error', function () { video.style.display = 'none'; });
    video.load();
})();

// ---------------------------------------------------------------------------
// 탭 / 스크롤
// ---------------------------------------------------------------------------
function activateTab(sectionId, targetTabId, scroll) {
    if (scroll === undefined) scroll = true;
    const section = $(sectionId);
    if (!section) return;
    const tabButtons = section.querySelectorAll('.intro-nav .tab-button');
    const tabContents = section.querySelectorAll('.intro-content');

    const target = targetTabId ? $(targetTabId) : null;
    if (!target || !target.classList.contains('intro-content')) {
        targetTabId = tabButtons[0] && tabButtons[0].dataset.tab;
    }
    if (!targetTabId) return;

    tabButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === targetTabId); });
    tabContents.forEach(function (c) { c.classList.toggle('active', c.id === targetTabId); });

    if (scroll) {
        window.scrollTo({ top: section.getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
    }
}

function setupSideDots() {
    const dots = document.querySelectorAll('.side-dots .dot-item');
    if (!dots.length) return;
    const sections = Array.from(dots).map(function (d) { return $(d.dataset.target); }).filter(Boolean);

    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            const el = $(dot.dataset.target);
            if (!el) return;
            window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
        });
    });

    function update() {
        const pos = window.pageYOffset + headerHeight() + 10;
        let current = 0;
        sections.forEach(function (s, i) { if (s.offsetTop <= pos) current = i; });
        dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }
    window.addEventListener('scroll', update);
    update();
}

// 섹션 단위 스냅 스크롤 (데스크탑 전용)
function setupSectionSnapScroll() {
    const sections = ['home', 'introduction', 'announcements', 'gallery'].map($).filter(Boolean);
    if (!sections.length) return;
    let isSnapping = false;

    function currentIndex() {
        const pos = window.pageYOffset + headerHeight() + 10;
        let idx = 0;
        sections.forEach(function (s, i) { if (s.offsetTop <= pos) idx = i; });
        return idx;
    }
    function goTo(i) {
        if (i < 0 || i >= sections.length) return;
        isSnapping = true;
        window.scrollTo({ top: sections[i].getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
        setTimeout(function () { isSnapping = false; }, 700);
    }

    window.addEventListener('wheel', function (e) {
        if (window.innerWidth <= 992) return;
        if (document.querySelector('.modal-backdrop.active')) return;
        if (isSnapping) { e.preventDefault(); return; }
        if (Math.abs(e.deltaY) < 15) return;

        const idx = currentIndex();
        if (e.deltaY > 0) {
            if (idx >= sections.length - 1) return;
            const nextTop = sections[idx + 1].offsetTop - headerHeight();
            if (window.pageYOffset + window.innerHeight < nextTop) return;
            e.preventDefault();
            goTo(idx + 1);
        } else {
            if (window.pageYOffset > sections[idx].offsetTop - headerHeight() + 40) return;
            e.preventDefault();
            goTo(idx - 1);
        }
    }, { passive: false });
}

// ---------------------------------------------------------------------------
// 검색 / 페이지네이션 (기존 코드 그대로)
// ---------------------------------------------------------------------------
function searchAnnouncements(keyword) {
    const kw = keyword.trim().toLowerCase();
    document.querySelectorAll('#announcements .intro-content').forEach(function (tab) {
        const rows = tab.querySelectorAll('.announcement-item');
        const pagination = tab.querySelector('.pagination-controls');
        let visible = 0;
        if (kw) {
            if (pagination) pagination.style.display = 'none';
            rows.forEach(function (row) {
                const match = (row.dataset.title || '').toLowerCase().indexOf(kw) !== -1;
                row.style.display = match ? '' : 'none';
                if (match) visible++;
            });
        } else {
            if (pagination) pagination.style.display = '';
            if (tab._paginationRender) tab._paginationRender();
            visible = rows.length;
        }
        const table = tab.querySelector('.announcement-table-container');
        if (!table) return;
        let msg = tab.querySelector('.search-empty-message');
        if (kw && rows.length > 0 && visible === 0) {
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'search-empty-message';
                msg.textContent = '검색 결과가 없습니다.';
                table.appendChild(msg);
            }
            msg.style.display = 'block';
        } else if (msg) {
            msg.style.display = 'none';
        }
    });
}

function searchStories(keyword) {
    const kw = keyword.trim().toLowerCase();
    document.querySelectorAll('#gallery .intro-content').forEach(function (tab) {
        const rows = tab.querySelectorAll('.story-item, .story-card-item');
        const pagination = tab.querySelector('.pagination-controls');
        let visible = 0;
        if (kw) {
            if (pagination) pagination.style.display = 'none';
            rows.forEach(function (row) {
                const match = (row.dataset.title || '').toLowerCase().indexOf(kw) !== -1;
                row.style.display = match ? '' : 'none';
                if (match) visible++;
            });
        } else {
            if (pagination) pagination.style.display = '';
            if (tab._paginationRender) tab._paginationRender();
            visible = rows.length;
        }
        const container = tab.querySelector('.announcement-table-container') || tab.querySelector('.newsletter-grid');
        if (!container) return;
        let msg = tab.querySelector('.search-empty-message');
        if (kw && rows.length > 0 && visible === 0) {
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'search-empty-message';
                msg.textContent = '검색 결과가 없습니다.';
                container.after(msg);
            }
            msg.style.display = 'block';
        } else if (msg) {
            msg.style.display = 'none';
        }
    });
}

function setupGenericPagination(containerSelector) {
    document.querySelectorAll(containerSelector).forEach(function (tab) {
        const pagination = tab.querySelector('.pagination-controls');
        if (!pagination) return;
        const pageSize = parseInt(pagination.dataset.pageSize, 10) || 10;
        const items = Array.from(tab.querySelectorAll(pagination.dataset.itemSelector || '.announcement-item'));
        let currentPage = 1;

        function render() {
            const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
            if (currentPage > totalPages) currentPage = totalPages;
            items.forEach(function (item, idx) {
                item.style.display = (Math.floor(idx / pageSize) + 1 === currentPage) ? '' : 'none';
            });
            pagination.innerHTML = '';
            if (items.length <= pageSize) return;

            const prev = document.createElement('button');
            prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prev.disabled = currentPage === 1;
            prev.onclick = function () { currentPage--; render(); };
            pagination.appendChild(prev);

            for (let p = 1; p <= totalPages; p++) {
                const b = document.createElement('button');
                b.textContent = p;
                if (p === currentPage) b.classList.add('active');
                b.onclick = function () { currentPage = p; render(); };
                pagination.appendChild(b);
            }

            const next = document.createElement('button');
            next.innerHTML = '<i class="fas fa-chevron-right"></i>';
            next.disabled = currentPage === totalPages;
            next.onclick = function () { currentPage++; render(); };
            pagination.appendChild(next);
        }
        tab._paginationRender = render;
        render();
    });
}

// ---------------------------------------------------------------------------
// 알림마당 렌더링 + 상세 팝업
// ---------------------------------------------------------------------------
const ANN_TABS = {
    '전체': 'announcements-all-tab',
    '공지사항': 'announcements-notice-tab',
    '채용공고': 'announcements-recruit-tab',
    '식단표': 'announcements-menu-tab',
    '활동계획': 'announcements-activity-tab'
};
let ANN_BY_ID = {};

function renderAnnouncements(groups) {
    ANN_BY_ID = {};
    const staff = !!window.BDB_STAFF;
    Object.keys(ANN_TABS).forEach(function (cat) {
        const items = (groups && groups[cat]) || [];
        items.forEach(function (a) { ANN_BY_ID[a.id] = a; });

        const rows = items.length === 0
            ? '<tr><td colspan="' + (staff ? 6 : 5) + '" class="empty-announcement-message">현재 등록된 게시글이 없습니다.</td></tr>'
            : items.map(function (a) {
                return '<tr class="announcement-item' + (a.pinned ? ' pinned-row' : '') + '" data-id="' + esc(a.id) + '" data-title="' + esc(a.title) + '">'
                    + '<td data-label="번호">' + (a.pinned ? '<i class="fas fa-thumbtack pin-marker" title="상단 고정"></i>' : esc(a.displayNo)) + '</td>'
                    + '<td data-label="구분">' + esc(a.category) + '</td>'
                    + '<td data-label="제목" class="col-title">' + (a.pinned ? '<span class="badge-important">중요</span>' : '') + esc(a.title) + (a.isNew ? '<span class="badge-new">새소식</span>' : '') + '</td>'
                    + '<td data-label="게시일">' + esc(a.date) + '</td>'
                    + '<td data-label="첨부">' + (a.fileUrl ? '<a class="file-link" href="' + esc(a.fileUrl) + '" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i></a>' : '-') + '</td>'
                    + (staff ? '<td data-label="관리" class="col-manage">'
                        + ((cat === '공지사항' || cat === '채용공고') ? '<button class="pin-icon-btn' + (a.pinned ? ' active' : '') + '" data-staff-action="pinAnn" data-id="' + esc(a.id) + '" title="' + (a.pinned ? '고정 해제' : '상단 고정') + '"><i class="fas fa-thumbtack"></i></button>' : '')
                        + '<button class="delete-icon-btn" data-staff-action="delAnn" data-id="' + esc(a.id) + '" title="삭제"><i class="fas fa-trash"></i></button></td>' : '')
                    + '</tr>';
            }).join('');

        $(ANN_TABS[cat]).innerHTML =
            '<div class="announcement-table-container"><table class="announcement-table"><thead><tr>'
            + '<th class="col-no">번호</th><th class="col-type">구분</th><th class="col-title">제목</th><th class="col-date">게시일</th><th class="col-file">첨부</th>' + (staff ? '<th class="col-manage">관리</th>' : '')
            + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
            + '<div class="pagination-controls" data-page-size="10" data-item-selector=".announcement-item"></div>';
    });
}

function openAnnouncementModal(id) {
    const a = ANN_BY_ID[id];
    if (!a) return;
    $('modalTitle').textContent = a.title;
    $('modalBody').innerHTML = a.content ? String(a.content).replace(/\n/g, '<br>') : '<p>내용이 준비되지 않았습니다.</p>';

    const box = $('modalAttachment');
    const link = $('modalAttachmentLink');
    if (a.fileUrl) {
        link.href = a.fileUrl;
        $('modalAttachmentName').textContent = a.fileName || '첨부파일 다운로드';
        box.style.display = 'flex';
    } else {
        box.style.display = 'none';
    }

    const preview = $('modalImagePreview');
    const img = $('modalImageTag');
    if (a.fileUrl && a.fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileName)) {
        const m = a.fileUrl.match(/[?&]id=([^&]+)/);
        img.src = m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000' : a.fileUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
        img.src = '';
    }

    $('announcementModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAnnouncementModal() {
    $('announcementModal').classList.remove('active');
    document.body.style.overflow = '';
}
(function setupAnnouncementModal() {
    const modal = $('announcementModal');
    modal.querySelector('.close-button').addEventListener('click', closeAnnouncementModal);
    $('modalConfirmBtn').addEventListener('click', closeAnnouncementModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeAnnouncementModal(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeAnnouncementModal();
    });
})();

// ---------------------------------------------------------------------------
// 반딧불이야기 렌더링
// ---------------------------------------------------------------------------
function storyTabId(i) { return i === 0 ? 'story-cat-all' : 'story-cat-' + (i - 1); }

function renderStories(d) {
    const groups = d.stories || {};
    const staff = !!window.BDB_STAFF;
    const names = Object.keys(groups);          // '전체' + 카테고리들 (서버 순서)
    const detailOpen = $('story-detail-view').classList.contains('active');
    const prevActive = document.querySelector('#story-lists .intro-content.active');
    const prevActiveId = prevActive ? prevActive.id : null;

    $('story-nav').innerHTML = names.map(function (n, i) {
        return '<button class="tab-button" data-tab="' + storyTabId(i) + '">' + esc(n) + '</button>';
    }).join('');

    $('story-submenu').innerHTML = names.map(function (n, i) {
        return '<li><a href="#gallery" data-tab-id="' + storyTabId(i) + '">' + esc(n) + '</a></li>';
    }).join('');

    $('story-lists').innerHTML = names.map(function (n, i) {
        const items = groups[n] || [];
        const tabId = storyTabId(i);
        const badge = function (s) { return s.isNew ? '<span class="badge-new">새소식</span>' : ''; };

        if (n === d.cardCategory) {
            const cards = items.length === 0
                ? '<p style="grid-column: 1 / -1; text-align:center; color: var(--text-muted); padding: 3rem 0;">현재 등록된 소식지가 없습니다.</p>'
                : items.map(function (s) {
                    return '<div class="newsletter-card story-card-item" data-title="' + esc(s.title) + '" data-story-id="' + esc(s.id) + '">'
                        + (staff ? '<button class="newsletter-delete-btn" data-staff-action="delStory" data-id="' + esc(s.id) + '" title="삭제"><i class="fas fa-trash"></i></button>' : '')
                        + (s.thumbnailUrl
                            ? '<img src="' + esc(s.thumbnailUrl) + '" alt="' + esc(s.title) + '" loading="lazy" style="width:100%; height:130px; object-fit:cover;">'
                            : '<div class="newsletter-cover"><i class="fas fa-book-open"></i></div>')
                        + '<div class="newsletter-info"><div class="newsletter-title">' + esc(s.title) + badge(s) + '</div>'
                        + '<div class="newsletter-date">' + esc(s.date) + ' · 조회 ' + esc(s.views) + '</div></div></div>';
                }).join('');
            return '<div id="' + tabId + '" class="intro-content"><div class="newsletter-grid">' + cards + '</div>'
                + '<div class="pagination-controls" data-page-size="12" data-item-selector=".story-card-item"></div></div>';
        }

        const rows = items.length === 0
            ? '<tr><td colspan="' + (staff ? 5 : 4) + '" class="empty-announcement-message">현재 등록된 글이 없습니다.</td></tr>'
            : items.map(function (s, ri) {
                return '<tr class="story-item" data-title="' + esc(s.title) + '" data-story-id="' + esc(s.id) + '">'
                    + '<td data-label="번호">' + (items.length - ri) + '</td>'
                    + '<td data-label="제목" class="col-title">' + esc(s.title) + badge(s) + '</td>'
                    + '<td data-label="게시일">' + esc(s.date) + '</td>'
                    + '<td data-label="조회수">' + esc(s.views) + '</td>'
                    + (staff ? '<td data-label="관리" class="col-manage"><button class="delete-icon-btn" data-staff-action="delStory" data-id="' + esc(s.id) + '" title="삭제"><i class="fas fa-trash"></i></button></td>' : '')
                    + '</tr>';
            }).join('');
        return '<div id="' + tabId + '" class="intro-content"><div class="announcement-table-container"><table class="announcement-table"><thead><tr>'
            + '<th class="col-no">번호</th><th class="col-title">제목</th><th class="col-date">게시일</th><th class="col-file">조회수</th>' + (staff ? '<th class="col-manage">관리</th>' : '')
            + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
            + '<div class="pagination-controls" data-page-size="10" data-item-selector=".story-item"></div></div>';
    }).join('');

    if (!detailOpen) {
        activateTab('gallery', (prevActiveId && $(prevActiveId)) ? prevActiveId : storyTabId(0), false);
    }
}

// ---------------------------------------------------------------------------
// 반딧불이야기 상세보기 (한 화면 안에서 열기, 주소: ?story=글ID)
// ---------------------------------------------------------------------------
let storyDetailPrevTabId = 'story-cat-all';

function storyDetailHtml(d) {
    const s = d.story;
    const isCard = s.category === d.cardCategory;
    let h = '<div class="story-page-wrap"><div class="story-main">'
        + '<a href="#gallery" class="story-detail-back-link"><i class="fas fa-arrow-left"></i> 반딧불이야기 목록으로</a>'
        + '<span class="story-category-badge">' + esc(s.category) + '</span>'
        + '<h1 class="story-title">' + esc(s.title) + '</h1>'
        + '<div class="story-meta"><span><i class="fas fa-calendar"></i> ' + esc(s.date) + '</span>'
        + '<span><i class="fas fa-eye"></i> 조회 ' + esc(s.views) + '</span></div>';

    if (isCard && s.thumbnailUrl && !s.pdfEmbedUrl) {
        h += '<img class="story-thumbnail-hero" src="' + esc(s.thumbnailUrl) + '" alt="' + esc(s.title) + '">';
    }
    if (s.pdfEmbedUrl) {
        h += '<div class="story-pdf-embed-wrap"><iframe src="' + esc(s.pdfEmbedUrl) + '" class="story-pdf-embed"></iframe>'
            + '<div class="story-pdf-actions">'
            + '<a href="' + esc(s.pdfViewUrl) + '" target="_blank" rel="noopener"><i class="fas fa-expand"></i> 새 탭에서 크게 보기</a>'
            + '<a href="' + esc(s.pdfDownloadUrl) + '" rel="noopener"><i class="fas fa-download"></i> 다운로드</a>'
            + '</div></div>';
    }

    // 본문은 직원이 작성한 HTML 이므로 그대로 보여줍니다. (기존 방식과 동일)
    h += '<div class="story-content-body">' + (s.content || '') + '</div>';

    if (s.attachments && s.attachments.length) {
        h += '<div class="modal-attachment" style="margin-top:2rem; flex-direction:column; align-items:stretch; gap:0.7rem;">'
            + s.attachments.map(function (att) {
                return '<div style="display:flex; align-items:center; gap:0.6rem;"><i class="fas fa-paperclip"></i>'
                    + '<a href="' + esc(att.url) + '" rel="noopener"><span>' + esc(att.name || '첨부파일 다운로드') + '</span> <i class="fas fa-download"></i></a></div>';
            }).join('')
            + '</div>';
    }

    if (window.BDB_STAFF) {
        h += '<div class="story-actions-row"><button class="btn-admin" data-staff-action="delStoryDetail" data-id="' + esc(s.id) + '" style="background-color: var(--secondary-color);"><i class="fas fa-trash"></i> 이 글 삭제</button></div>';
    }

    h += '<div class="story-prev-next">';
    if (d.prevStory) {
        h += '<a href="?story=' + encodeURIComponent(d.prevStory.id) + '" class="story-detail-nav-link" data-story-id="' + esc(d.prevStory.id) + '">'
            + '<span class="pn-label">이전글</span> <span>' + esc(d.prevStory.title) + '</span></a>';
    }
    if (d.nextStory) {
        h += '<a href="?story=' + encodeURIComponent(d.nextStory.id) + '" class="story-detail-nav-link" data-story-id="' + esc(d.nextStory.id) + '">'
            + '<span class="pn-label">다음글</span> <span>' + esc(d.nextStory.title) + '</span></a>';
    }
    h += '</div></div>';

    h += '<div class="story-sidebar"><h4>' + esc(s.category) + ' 다른 글</h4>';
    if (!d.sidebarStories || d.sidebarStories.length === 0) {
        h += '<p style="color:var(--text-muted); font-size:0.9rem;">다른 글이 없습니다.</p>';
    } else {
        h += d.sidebarStories.map(function (x) {
            return '<div class="story-sidebar-item story-detail-nav-link" data-story-id="' + esc(x.id) + '">'
                + (x.thumbnailUrl
                    ? '<img src="' + esc(x.thumbnailUrl) + '" alt="">'
                    : '<div style="width:56px;height:56px;border-radius:6px;background-color:var(--bg-color);display:flex;align-items:center;justify-content:center;color:var(--primary-color);flex-shrink:0;"><i class="fas fa-file-alt"></i></div>')
                + '<div><div class="ss-title">' + esc(x.title) + '</div><div class="ss-date">' + esc(x.date) + '</div></div></div>';
        }).join('');
    }
    h += '</div></div>';
    return h;
}

function openStoryFromList(id) {
    const active = document.querySelector('#gallery .intro-content.active');
    if (active && active.id !== 'story-detail-view') storyDetailPrevTabId = active.id;
    openStoryDetail(id);
}

function openStoryDetail(id, opts) {
    opts = opts || {};
    const panel = $('story-detail-view');
    panel.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:4rem 0;">불러오는 중...</p>';
    activateTab('gallery', 'story-detail-view', !opts.noScroll);

    apiGet('story', { id: id })
        .then(function (d) { panel.innerHTML = storyDetailHtml(d); })
        .catch(function (err) {
            panel.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:3rem 0;">글을 불러오지 못했습니다: ' + esc(err.message) + '</p>';
        });

    const url = location.pathname + '?story=' + encodeURIComponent(id);
    if (opts.replace) {
        history.replaceState({ bdbStoryId: id, deep: !!(history.state && history.state.deep) }, '', url);
    } else if (!opts.noHistory) {
        history.pushState({ bdbStoryId: id }, '', url);
    }
}

function closeStoryDetail() {
    const prev = $(storyDetailPrevTabId) ? storyDetailPrevTabId : storyTabId(0);
    activateTab('gallery', prev, false);
}

window.addEventListener('popstate', function (e) {
    const st = e.state;
    if (st && st.bdbStoryId) {
        openStoryDetail(st.bdbStoryId, { noHistory: true, noScroll: true });
    } else if ($('story-detail-view').classList.contains('active')) {
        closeStoryDetail();
    }
});

// ---------------------------------------------------------------------------
// 월별일정 캘린더 (기존 코드, 직원 기능 제외)
// ---------------------------------------------------------------------------
let CALENDAR_EVENTS = [];
let HOLIDAY_MAP = {};
let calendarViewDate = new Date();

function formatYmd_(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function buildMonthWeeks_(year, month) {
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalWeeks = Math.ceil((startWeekday + daysInMonth) / 7);
    const weeks = [];
    const cursor = new Date(year, month, 1 - startWeekday);
    for (let w = 0; w < totalWeeks; w++) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push({ date: new Date(cursor), ymd: formatYmd_(cursor), inMonth: cursor.getMonth() === month });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
}

function assignEventLanes_(events) {
    const sorted = events.slice().sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    const laneLastEnd = [];
    const eventLane = {};
    sorted.forEach(function (ev) {
        let lane = 0;
        while (laneLastEnd[lane] !== undefined && laneLastEnd[lane] >= ev.date) lane++;
        laneLastEnd[lane] = ev.endDate;
        eventLane[ev.id] = lane;
    });
    return eventLane;
}

function renderCalendar() {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    $('calendarTitle').textContent = year + '년 ' + (month + 1) + '월';

    const todayYmd = formatYmd_(new Date());
    const weeks = buildMonthWeeks_(year, month);
    const monthStart = weeks[0][0].ymd;
    const monthEnd = weeks[weeks.length - 1][6].ymd;
    const monthEvents = CALENDAR_EVENTS.filter(function (ev) { return ev.date <= monthEnd && ev.endDate >= monthStart; });
    const eventLane = assignEventLanes_(monthEvents);

    const grid = $('calendarGrid');
    grid.innerHTML = '';

    weeks.forEach(function (week) {
        const weekEl = document.createElement('div');
        weekEl.className = 'calendar-week';

        week.forEach(function (cell) {
            const holidayName = HOLIDAY_MAP[cell.ymd];
            const numCell = document.createElement('div');
            numCell.className = 'calendar-day-num-cell'
                + (!cell.inMonth ? ' outside' : '')
                + (cell.ymd === todayYmd ? ' today' : '')
                + (holidayName ? ' holiday' : '');
            if (cell.inMonth) {
                numCell.innerHTML = '<div class="calendar-day-num">' + cell.date.getDate() + '</div>'
                    + (holidayName ? '<div class="calendar-holiday-name">' + esc(holidayName) + '</div>' : '');
                numCell.addEventListener('click', function () { openDayEventModal(cell.ymd); });
            } else {
                numCell.innerHTML = '<div class="calendar-day-num">' + cell.date.getDate() + '</div>';
            }
            weekEl.appendChild(numCell);
        });

        const weekStart = week[0].ymd;
        const weekEnd = week[6].ymd;
        monthEvents.filter(function (ev) { return ev.date <= weekEnd && ev.endDate >= weekStart; }).forEach(function (ev) {
            const overlapStart = ev.date > weekStart ? ev.date : weekStart;
            const overlapEnd = ev.endDate < weekEnd ? ev.endDate : weekEnd;
            const startIdx = week.findIndex(function (c) { return c.ymd === overlapStart; });
            const endIdx = week.findIndex(function (c) { return c.ymd === overlapEnd; });
            if (startIdx === -1 || endIdx === -1) return;

            const bar = document.createElement('div');
            let cls = 'calendar-event-bar';
            if (overlapStart === ev.date) cls += ' range-start';
            if (overlapEnd === ev.endDate) cls += ' range-end';
            bar.className = cls;
            bar.textContent = ev.title;
            bar.style.gridColumn = (startIdx + 1) + ' / ' + (endIdx + 2);
            bar.style.gridRow = (eventLane[ev.id] + 2);
            bar.addEventListener('click', function () { openDayEventModal(overlapStart); });
            weekEl.appendChild(bar);
        });

        grid.appendChild(weekEl);
    });
}

function changeCalendarMonth(diff) {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + diff);
    renderCalendar();
}

function openDayEventModal(ymd) {
    window.selectedCalendarDate = ymd;
    $('dayEventModalTitle').textContent = ymd + ' 일정';
    const list = $('dayEventList');
    list.innerHTML = '';
    const dayEvents = CALENDAR_EVENTS.filter(function (ev) { return ev.date <= ymd && ev.endDate >= ymd; });

    if (dayEvents.length === 0) {
        list.innerHTML = '<li style="color:var(--text-muted);">등록된 일정이 없습니다.</li>';
    } else {
        dayEvents.forEach(function (ev) {
            const range = (ev.endDate && ev.endDate !== ev.date)
                ? ' <span style="color:var(--text-muted); font-size:0.8rem;">(' + esc(ev.date) + ' ~ ' + esc(ev.endDate) + ')</span>' : '';
            const li = document.createElement('li');
            li.innerHTML = '<div><strong>' + esc(ev.title) + '</strong>' + range
                + (ev.memo ? '<br><span style="color:var(--text-muted); font-size:0.85rem;">' + esc(ev.memo) + '</span>' : '') + '</div>'
                + (window.BDB_STAFF ? '<button class="delete-icon-btn" data-staff-action="delCal" data-id="' + esc(ev.id) + '" title="삭제"><i class="fas fa-trash"></i></button>' : '');
            list.appendChild(li);
        });
    }
    let area = $('dayEventStaffArea');
    if (!area) {
        area = document.createElement('div');
        area.id = 'dayEventStaffArea';
        list.after(area);
    }
    area.innerHTML = window.BDB_STAFF
        ? '<button class="btn-admin" style="margin-top: 1rem;" data-staff-action="addCal"><i class="fas fa-plus"></i> 이 날짜에 일정 추가</button>' : '';
    openModal('dayEventModal');
}

// ---------------------------------------------------------------------------
// 데이터 불러오기 (저장해둔 이전 데이터를 먼저 보여주고, 최신 데이터로 갱신)
// ---------------------------------------------------------------------------
function dataSignature(d) {
    return JSON.stringify(Object.assign({}, d, { visitors: null }));
}

function renderHome(d) {
    window.LAST_HOME = d;
    renderAnnouncements(d.announcements);
    renderStories(d);
    CALENDAR_EVENTS = d.calendar || [];
    HOLIDAY_MAP = {};
    (d.holidays || []).forEach(function (h) { HOLIDAY_MAP[h.date] = h.title; });
    renderCalendar();
    setupGenericPagination('#announcements .intro-content');
    setupGenericPagination('#gallery .intro-content');
}

function showVisitors(v) {
    if (!v) return;
    $('today-visitors').textContent = v.today;
    $('total-visitors').textContent = v.total;
}

function loadHome() {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(HOME_CACHE_KEY)); } catch (e) { cached = null; }
    let shownSig = null;
    if (cached) {
        try { renderHome(cached); shownSig = dataSignature(cached); } catch (e) { shownSig = null; }
    }

    apiGet('home').then(function (data) {
        try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* 저장 실패는 무시 */ }
        showVisitors(data.visitors);
        if (dataSignature(data) !== shownSig) renderHome(data);
    }).catch(function (err) {
        if (shownSig) return; // 이전 데이터가 이미 보이고 있으면 조용히 넘어갑니다.
        const msg = '<p style="text-align:center;padding:3rem 0;color:var(--text-muted);">데이터를 불러오지 못했습니다. 잠시 후 새로고침 해주세요.<br><small>' + esc(err.message) + '</small></p>';
        $('announcements-all-tab').innerHTML = msg;
        $('story-lists').innerHTML = '<div class="intro-content active">' + msg + '</div>';
    });
}

// ---------------------------------------------------------------------------
// 클릭 처리 (한 곳에서 처리: 나중에 그려지는 요소도 동작)
// ---------------------------------------------------------------------------
document.addEventListener('click', function (e) {
    const t = e.target;
    if (t.closest('[data-staff-action]')) return;   // 직원 기능 버튼은 staff.js 에서 처리

    const tabBtn = t.closest('.intro-nav .tab-button');
    if (tabBtn) {
        activateTab(tabBtn.closest('.section').id, tabBtn.dataset.tab);
        return;
    }

    const navLink = t.closest('.nav-links a');
    if (navLink) {
        e.preventDefault();
        const href = navLink.getAttribute('href') || '';
        const tabId = navLink.dataset.tabId;
        const parentLi = navLink.closest('li.has-sub-menu');
        const isTopLevel = parentLi && navLink.parentElement === parentLi;

        if (window.innerWidth <= 768 && isTopLevel) {
            document.querySelectorAll('.nav-links > li.has-sub-menu.active').forEach(function (li) {
                if (li !== parentLi) li.classList.remove('active');
            });
            parentLi.classList.toggle('active');
            return;
        }
        const sectionId = href.replace('#', '');
        if (tabId) {
            activateTab(sectionId, tabId);
        } else if ($(sectionId)) {
            window.scrollTo({ top: $(sectionId).getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
        }
        if (window.innerWidth <= 768) closeMobileMenu();
        return;
    }

    const back = t.closest('.story-detail-back-link');
    if (back) {
        e.preventDefault();
        const st = history.state;
        if (st && st.deep) {
            history.replaceState({}, '', location.pathname + '#gallery');
            closeStoryDetail();
        } else if (st && st.bdbStoryId) {
            history.back();
        } else {
            closeStoryDetail();
        }
        return;
    }

    const navStory = t.closest('.story-detail-nav-link');
    if (navStory) {
        e.preventDefault();
        if (navStory.dataset.storyId) openStoryDetail(navStory.dataset.storyId, { replace: true });
        return;
    }

    const storyRow = t.closest('.story-card-item, .story-item');
    if (storyRow) {
        openStoryFromList(storyRow.dataset.storyId);
        return;
    }

    const annRow = t.closest('.announcement-item');
    if (annRow) {
        if (t.closest('.file-link')) return;
        openAnnouncementModal(annRow.dataset.id);
    }
});

// ---------------------------------------------------------------------------
// 시작
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    setupSideDots();
    setupSectionSnapScroll();
    renderCalendar();
    loadHome();

    // 글 주소(?story=ID)로 바로 들어온 경우
    const storyId = new URLSearchParams(location.search).get('story');
    if (storyId) {
        history.replaceState({ bdbStoryId: storyId, deep: true }, '', location.href);
        openStoryDetail(storyId, { noHistory: true });
    } else if (location.hash) {
        const el = document.querySelector(location.hash);
        if (el) setTimeout(function () {
            window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight(), behavior: 'smooth' });
        }, 100);
    }
});
