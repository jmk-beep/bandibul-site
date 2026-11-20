/**
 * ==========================================================================
 * 반딧불단기보호센터 홈페이지 - Code.gs
 * ==========================================================================
 * ※ 이 파일은 Apps Script 편집기의 Code.gs 와 같은 내용입니다. (기록/보관용)
 *   홈페이지(GitHub)에 올린다고 서버에 반영되지 않습니다. 반드시 Apps Script
 *   편집기에 붙여넣고 "배포 > 배포 관리 > 편집 > 새 버전 > 배포" 를 해야 합니다.
 *
 * [최근 변경 사항]
 *  - 글 수정 기능 추가: updateAnnouncement(알림마당), updateStory(반딧불이야기),
 *    getStoryForEdit(수정 화면에 띄울 원본 글 불러오기 - 조회수는 올라가지 않음)
 *  - 속도 개선:
 *    · 캐시 유지 시간을 30초 → 1시간으로 늘렸습니다. 홈페이지에서 글을 쓰거나
 *      고치거나 지우면 캐시는 즉시 비워지므로 바로 반영됩니다.
 *      (스프레드시트를 직접 손으로 고친 경우에는 최대 1시간 뒤에 반영됩니다.
 *       바로 반영하려면 편집기에서 clearAllCaches 함수를 한 번 실행하세요.)
 *    · 캐시 한 칸에는 약 100KB 까지만 담기는 제한이 있어서, 글이 많아지면 캐시가
 *      조용히 실패하고 매번 시트를 새로 읽고 있었습니다. 큰 데이터는 여러 칸으로
 *      나눠 담도록 고쳤습니다.
 *    · 방문자 수 집계가 다른 접속과 겹칠 때 최대 5초까지 기다리던 것을 줄였습니다.
 *  - 반딧불이야기 카테고리: 소소한일상, 특별한날, 나눔동행, 배움, 열린운영, 소식지
 *
 * [이전 변경 사항 - 반딧불이야기 개편]
 *  - "반딧불이야기"를 기존 사진 갤러리 방식에서, 알림마당처럼 "글을 쓰는" 게시판
 *    방식으로 변경했습니다.
 *  - 카테고리 중 '소식지'만 카드/썸네일 목록으로 보이고 나머지는 알림마당처럼 표
 *    목록으로 보입니다. 카테고리를 더 추가/삭제하고 싶으면 아래 STORY_CATEGORIES
 *    배열만 수정하면 됩니다.
 *  - 댓글 기능은 만들지 않았습니다.
 *
 * 배포 시 확인:
 *  - 배포(Deploy) 시 실행 계정 = "웹앱에 접근하는 사용자", 액세스 권한 = Anyone 확인
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// 기본 설정
// ---------------------------------------------------------------------------
const STAFF_DOMAIN = '@littlelight.or.kr';

const SS = SpreadsheetApp.getActiveSpreadsheet();

const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const TODAY_VISIT_KEY = 'todayVisits';
const TOTAL_VISIT_KEY = 'totalVisits';
const LAST_VISIT_DATE_KEY = 'lastVisitDate';

const ANNOUNCEMENT_SHEET_NAME = 'Announcements';
const ANNOUNCEMENT_HEADERS = ['ID', 'Category', 'Title', 'Content', 'Date', 'FileURL', 'FileName', 'Pinned', 'CreatedAt'];
const NEW_BADGE_HOURS = 24; // "새소식" 배지를 보여줄 시간 (등록 후 이 시간 동안)
const ANNOUNCEMENT_CATEGORIES = ['공지사항', '채용공고', '식단표', '활동계획'];

// ----- 반딧불이야기 (Stories) -----
const STORY_SHEET_NAME = 'Stories';
const STORY_HEADERS = ['ID', 'Category', 'Title', 'Content', 'Date', 'ThumbnailURL', 'ThumbnailFileId', 'FileURL', 'FileName', 'Views', 'AttachmentsJSON', 'CreatedAt', 'PdfFileId'];

// 반딧불이야기 카테고리 목록입니다. 이 배열의 순서가 화면 탭 순서가 됩니다.
// ('전체' 탭은 자동으로 맨 앞에 붙으므로 여기에 넣지 않습니다.)
// '소식지' 카테고리는 카드(썸네일) 형태로 보여지는 특별한 카테고리입니다.
// (아래 STORY_CARD_CATEGORY 값과 반드시 이름이 같아야 합니다.)
const STORY_CATEGORIES = ['소소한일상', '특별한날', '나눔동행', '배움', '열린운영', '소식지'];
const STORY_CARD_CATEGORY = '소식지'; // 카드/썸네일 목록으로 보여줄 카테고리 이름

const CALENDAR_SHEET_NAME = 'Calendar';
const CALENDAR_HEADERS = ['ID', 'Date', 'Title', 'Memo', 'EndDate'];
const HOLIDAY_SHEET_NAME = 'Holidays';
const HOLIDAY_HEADERS = ['Date', 'Title'];
const KOREA_HOLIDAY_CALENDAR_ID = 'ko.south_korea#holiday@group.v.calendar.google.com';

// ---------------------------------------------------------------------------
// 캐시 (CacheService)
// ---------------------------------------------------------------------------
// 페이지를 열 때마다 매번 스프레드시트를 새로 읽으면 그만큼 느려집니다.
// 그래서 한 번 읽은 데이터를 잠시 기억해뒀다가 재사용합니다. 글을 쓰거나
// 고치거나 지우는 등 데이터가 바뀌는 시점에는 반드시 해당 캐시를 지워서
// 바뀐 내용이 바로 보이게 합니다.
const CACHE_TTL_SHORT = 3600;   // 공지/글/일정 목록 (초 단위, 1시간)
const CACHE_TTL_LONG = 21600;   // 공휴일처럼 거의 안 바뀌는 데이터 (6시간)
const CACHE_KEY_ANNOUNCEMENTS = 'bdb_announcements_v2';
const CACHE_KEY_STORIES = 'bdb_stories_rows_v2';
const CACHE_KEY_CALENDAR = 'bdb_calendar_v2';
const CACHE_KEY_HOLIDAYS = 'bdb_holidays_v2';

// 캐시 한 칸에 담을 수 있는 크기는 약 100KB 입니다. 한글은 글자당 최대 3바이트라서
// 넉넉하게 30,000 글자씩 나눠 담습니다.
const CACHE_CHUNK_CHARS = 30000;
const CACHE_CHUNK_MARK = 'chunks:';

function getCachedJson_(key) {
  try {
    const cache = CacheService.getScriptCache();
    const head = cache.get(key);
    if (!head) return null;
    if (head.indexOf(CACHE_CHUNK_MARK) !== 0) return JSON.parse(head);

    // 여러 칸으로 나눠 담은 경우: 모든 조각을 한 번에 꺼내서 이어 붙입니다.
    const count = parseInt(head.substring(CACHE_CHUNK_MARK.length), 10);
    const keys = [];
    for (let i = 0; i < count; i++) keys.push(key + '__' + i);
    const parts = cache.getAll(keys);
    let raw = '';
    for (let i = 0; i < keys.length; i++) {
      if (parts[keys[i]] == null) return null; // 조각이 하나라도 없으면 캐시가 없는 것으로 봅니다.
      raw += parts[keys[i]];
    }
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setCachedJson_(key, value, ttlSeconds) {
  try {
    const cache = CacheService.getScriptCache();
    const raw = JSON.stringify(value);
    if (raw.length <= CACHE_CHUNK_CHARS) {
      cache.put(key, raw, ttlSeconds);
      return;
    }
    const pieces = {};
    let count = 0;
    for (let i = 0; i < raw.length; i += CACHE_CHUNK_CHARS) {
      pieces[key + '__' + count] = raw.substring(i, i + CACHE_CHUNK_CHARS);
      count++;
    }
    cache.putAll(pieces, ttlSeconds);
    cache.put(key, CACHE_CHUNK_MARK + count, ttlSeconds); // 조각을 다 넣은 뒤에 "목차"를 넣습니다.
  } catch (e) {
    // 캐시에 담기 실패해도 무시합니다. (항상 시트에서 직접 읽는 방식으로 동작)
  }
}

function invalidateCache_(key) {
  try {
    // "목차"만 지우면 조각들은 읽히지 않고, 시간이 지나면 저절로 사라집니다.
    CacheService.getScriptCache().remove(key);
  } catch (e) {
    // 무시
  }
}

/**
 * 스프레드시트를 직접 손으로 고친 뒤 홈페이지에 바로 반영하고 싶을 때,
 * Apps Script 편집기에서 이 함수를 선택해 ▶ 실행하세요.
 */
function clearAllCaches() {
  [CACHE_KEY_ANNOUNCEMENTS, CACHE_KEY_STORIES, CACHE_KEY_CALENDAR, CACHE_KEY_HOLIDAYS].forEach(invalidateCache_);
  Logger.log('캐시를 모두 비웠습니다.');
}

/**
 * HTML 템플릿 안에서 다른 html 파일을 끼워 넣기 위한 헬퍼입니다.
 * (예: 공통 스타일, 공통 헤더, 공통 푸터)
 *
 * ⚠️ 주의: filename 파일 안에 <? ?> / <?= ?> 같은 스크립틀릿(변수)이 들어있다면
 * 반드시 두 번째 인자 data로 필요한 값을 넘겨줘야 합니다.
 */
function include(filename, data) {
  if (!data) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
  const tmpl = HtmlService.createTemplateFromFile(filename);
  for (const key in data) {
    tmpl[key] = data[key];
  }
  return tmpl.evaluate().getContent();
}

function renderPublicPage_() {
  const staff = isStaff();

  const template = HtmlService.createTemplateFromFile('index');
  template.announcementsByCategory = getAnnouncementsByCategory();
  template.calendarEvents = getAllCalendarEvents();
  template.holidays = getHolidays_();
  template.storiesByCategory = getStoriesByCategory();
  template.scriptUrl = ScriptApp.getService().getUrl();
  template.isStaff = staff;
  template.userEmail = staff ? Session.getActiveUser().getEmail() : '';
  template.categories = ANNOUNCEMENT_CATEGORIES;
  template.storyCategories = STORY_CATEGORIES;
  template.storyTabList = getStoryTabList_();
  template.cardCategory = STORY_CARD_CATEGORY;
  template.baseHref = '';

  return template.evaluate()
      .setTitle('반딧불단기보호센터')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 글 하나를 보여주는 데 필요한 데이터(본문, 이전글/다음글, 사이드바)를 한 번에
 * 계산합니다. 조회수 증가까지 이 안에서 처리하므로, 이 함수는 "글을 실제로
 * 펼쳐 보는 시점"에 정확히 한 번만 호출해야 합니다.
 * 반환값: { story, prevStory, nextStory, sidebarStories } 또는 글이 없으면 null
 */
function prepareStoryDetailData_(id) {
  const all = loadStoriesWithRows_();
  const story = all.find(function (s) { return s.id === id; });
  if (!story) return null;

  const sheet = getStorySheet_();
  const viewsColIndex = getHeaderColumnIndex_(sheet, 'Views'); // 1-based
  story.views = (story.views || 0) + 1;
  if (viewsColIndex !== -1) {
    sheet.getRange(story._rowIndex, viewsColIndex).setValue(story.views);
  }
  updateCachedStoryViews_(id, story.views);

  const sameCategory = all.filter(function (s) { return s.category === story.category; });
  const idx = sameCategory.findIndex(function (s) { return s.id === id; });
  const prevStory = (idx !== -1 && idx + 1 < sameCategory.length) ? sameCategory[idx + 1] : null;
  const nextStory = (idx > 0) ? sameCategory[idx - 1] : null;
  const sidebarStories = sameCategory.filter(function (s) { return s.id !== id; }).slice(0, 8);

  return { story: story, prevStory: prevStory, nextStory: nextStory, sidebarStories: sidebarStories };
}

function renderStoryDetailPage_(id) {
  const data = prepareStoryDetailData_(id);
  if (!data) {
    return renderPublicPage_();
  }

  const staff = isStaff();
  const template = HtmlService.createTemplateFromFile('story');
  template.story = data.story;
  template.sidebarStories = data.sidebarStories;
  template.prevStory = data.prevStory;
  template.nextStory = data.nextStory;
  template.isStaff = staff;
  template.userEmail = staff ? Session.getActiveUser().getEmail() : '';
  template.scriptUrl = ScriptApp.getService().getUrl();
  template.cardCategory = STORY_CARD_CATEGORY;
  template.storyTabList = getStoryTabList_();
  template.baseHref = template.scriptUrl;

  return template.evaluate()
      .setTitle(data.story.title + ' - 반딧불단기보호센터')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStoryFragmentHtml(id) {
  const data = prepareStoryDetailData_(id);
  if (!data) {
    throw new Error('존재하지 않거나 삭제된 글입니다.');
  }

  const staff = isStaff();
  const template = HtmlService.createTemplateFromFile('StoryFragment');
  template.story = data.story;
  template.sidebarStories = data.sidebarStories;
  template.prevStory = data.prevStory;
  template.nextStory = data.nextStory;
  template.isStaff = staff;
  template.cardCategory = STORY_CARD_CATEGORY;
  template.scriptUrl = ScriptApp.getService().getUrl();

  return template.evaluate().getContent();
}

// ---------------------------------------------------------------------------
// 방문자 수
// ---------------------------------------------------------------------------
function updateVisitorCounts() {
  const lock = LockService.getScriptLock();
  // 다른 접속과 겹치면 잠깐만 기다리고, 그래도 안 되면 이번 1회는 집계를 건너뜁니다.
  // (예전에는 최대 5초까지 기다려서 그만큼 화면이 늦게 떴습니다.)
  if (!lock.tryLock(1500)) return;

  try {
    const todayDateString = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    const props = SCRIPT_PROPERTIES.getProperties(); // 한 번에 읽기

    let todayVisits = parseInt(props[TODAY_VISIT_KEY] || '0', 10);
    let totalVisits = parseInt(props[TOTAL_VISIT_KEY] || '0', 10);
    const updates = {};

    if (props[LAST_VISIT_DATE_KEY] !== todayDateString) {
      todayVisits = 0;
      updates[LAST_VISIT_DATE_KEY] = todayDateString;
    }

    todayVisits++;
    totalVisits++;
    updates[TODAY_VISIT_KEY] = todayVisits.toString();
    updates[TOTAL_VISIT_KEY] = totalVisits.toString();

    SCRIPT_PROPERTIES.setProperties(updates); // 한 번에 쓰기 (다른 값은 그대로 유지)
  } finally {
    lock.releaseLock();
  }
}

function getVisitorCounts() {
  const props = SCRIPT_PROPERTIES.getProperties();
  return {
    today: parseInt(props[TODAY_VISIT_KEY] || '0', 10),
    total: parseInt(props[TOTAL_VISIT_KEY] || '0', 10)
  };
}

// ---------------------------------------------------------------------------
// 권한 체크
// ---------------------------------------------------------------------------

function requireStaff_() {
  if (!isStaff()) {
    throw new Error('권한이 없습니다. 직원 구글 계정으로 로그인 후 다시 시도해주세요.');
  }
}

// ---------------------------------------------------------------------------
// 공통 시트/드라이브 유틸
// ---------------------------------------------------------------------------
function getOrCreateSheet_(name, headers) {
  let sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetRowsToObjects_(sheet, mapRowFn) {
  const values = sheet.getDataRange().getValues();
  values.shift(); // 헤더 제거
  return values
    .filter(function (row) { return row[0]; }) // 빈 행 제외
    .map(mapRowFn);
}

function deleteRowById_(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return data[i];
    }
  }
  return null;
}

/**
 * ID 로 행을 찾아, 그 행의 값을 { 헤더이름: 값 } 형태로 돌려줍니다.
 * 못 찾으면 null. 반환값의 _rowNum 은 시트의 실제 행 번호(1-based)입니다.
 */
function findRowById_(sheet, id) {
  const colMap = getHeaderIndexMap_(sheet);
  if (!colMap.hasOwnProperty('ID')) return null;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][colMap['ID']] === id) {
      const rowObj = { _rowNum: i + 1 };
      Object.keys(colMap).forEach(function (name) { rowObj[name] = values[i][colMap[name]]; });
      return rowObj;
    }
  }
  return null;
}

/**
 * 한 행에서 지정한 칸들만 바꿉니다. fields = { 헤더이름: 새 값 }
 * (나머지 칸은 그대로 유지됩니다.)
 */
function updateRowFields_(sheet, rowNum, fields) {
  const colMap = getHeaderIndexMap_(sheet);
  const lastCol = sheet.getLastColumn();
  const range = sheet.getRange(rowNum, 1, 1, lastCol);
  const values = range.getValues()[0];
  Object.keys(fields).forEach(function (name) {
    if (colMap.hasOwnProperty(name)) values[colMap[name]] = fields[name];
  });
  range.setValues([values]);
}

function trashDriveFileQuietly_(fileId) {
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (err) {
    // 이미 지워졌거나 접근할 수 없어도 무시합니다.
  }
}

function formatDateKST_(dateValue) {
  if (dateValue instanceof Date) {
    return Utilities.formatDate(dateValue, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return dateValue;
}

// 모든 홈페이지 파일이 저장될 상위 폴더: 내 드라이브 > 2.반딧불 업무 > 홈페이지관련
const HOMEPAGE_FOLDER_ID = '1kWu_Z-VwVOpYwxuSTtHnEKvPSSJ4-133';

function getOrCreateDriveFolder_(name) {
  const parent = DriveApp.getFolderById(HOMEPAGE_FOLDER_ID);
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function getAttachmentFolder_() {
  return getOrCreateDriveFolder_('반딧불_홈페이지_첨부파일');
}

function getStoryThumbnailFolder_() {
  return getOrCreateDriveFolder_('반딧불_홈페이지_스토리썸네일');
}
function getStoryPdfFolder_() {
  return getOrCreateDriveFolder_('반딧불_홈페이지_소식지PDF');
}

/**
 * 구글 드라이브 공유 링크에서 파일 ID만 뽑아냅니다. 알아볼 수 없는 형식이면 null.
 */
function extractDriveFileId_(url) {
  if (!url) return null;
  var patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = url.match(patterns[i]);
    if (m) return m[1];
  }
  return null;
}

/**
 * base64 데이터 URL을 받아 지정 폴더에 파일로 저장하고, 링크가 있는 모든 사람이
 * 볼 수 있도록 공유 설정합니다.
 */
function uploadFileToFolder_(base64DataUrl, fileName, folder) {
  const commaIndex = base64DataUrl.indexOf(',');
  const meta = base64DataUrl.substring(0, commaIndex);
  const base64Body = base64DataUrl.substring(commaIndex + 1);
  const contentTypeMatch = meta.match(/data:(.*);base64/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';

  const bytes = Utilities.base64Decode(base64Body);
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file;
}

/** 구글 드라이브 파일 ID로부터 "바로 다운로드"가 되는 URL을 만듭니다. */
function getDirectDownloadUrl_(fileId) {
  return 'https://drive.google.com/uc?export=download&id=' + fileId;
}

// ---------------------------------------------------------------------------
// 공지사항
// ---------------------------------------------------------------------------
function getAnnouncementSheet_() {
  const sheet = getOrCreateSheet_(ANNOUNCEMENT_SHEET_NAME, ANNOUNCEMENT_HEADERS);
  ensureSheetHeaderColumns_(sheet, ANNOUNCEMENT_HEADERS);
  return sheet;
}

/** 등록 후 NEW_BADGE_HOURS 시간이 지나지 않았으면 true (제목 옆 "새소식" 배지용) */
function isWithinNewWindow_(createdAt) {
  if (!createdAt) return false;
  const createdTime = (createdAt instanceof Date) ? createdAt.getTime() : new Date(createdAt).getTime();
  if (isNaN(createdTime)) return false;
  return (Date.now() - createdTime) < NEW_BADGE_HOURS * 60 * 60 * 1000;
}

function getAllAnnouncements_() {
  let list = getCachedJson_(CACHE_KEY_ANNOUNCEMENTS);
  if (!list) {
    const sheet = getAnnouncementSheet_();
    const colMap = getHeaderIndexMap_(sheet);
    list = sheetRowsToObjects_(sheet, function (row) {
      const createdAt = row[colMap['CreatedAt']];
      const createdTime = (createdAt instanceof Date) ? createdAt.getTime() : (createdAt ? new Date(createdAt).getTime() : 0);
      return {
        id: row[colMap['ID']],
        category: row[colMap['Category']],
        title: row[colMap['Title']],
        content: row[colMap['Content']],
        date: formatDateKST_(row[colMap['Date']]),
        fileUrl: row[colMap['FileURL']],
        fileName: row[colMap['FileName']],
        pinned: !!row[colMap['Pinned']],
        createdTime: isNaN(createdTime) ? 0 : createdTime
      };
    });

    // 최신순 정렬 (같은 날짜면 나중에 등록된 글이 앞으로)
    list.forEach(function (item, idx) { item._order = idx; });
    list.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b._order - a._order;
    });
    list.forEach(function (item) { delete item._order; });
    setCachedJson_(CACHE_KEY_ANNOUNCEMENTS, list, CACHE_TTL_SHORT);
  }

  // "새소식" 배지는 캐시가 오래 유지되어도 정확하도록, 매번 지금 시각 기준으로 계산합니다.
  const now = Date.now();
  return list.map(function (item) {
    const copy = Object.assign({}, item);
    copy.isNew = !!item.createdTime && (now - item.createdTime) < NEW_BADGE_HOURS * 60 * 60 * 1000;
    delete copy.createdTime;
    return copy;
  });
}

/** 카테고리별 탭에 뿌릴 데이터를 한 번에 만들어줍니다. */
function getAnnouncementsByCategory() {
  const all = getAllAnnouncements_();
  const groups = { '전체': all };
  ANNOUNCEMENT_CATEGORIES.forEach(function (cat) {
    groups[cat] = all.filter(function (a) { return a.category === cat; });
  });

  const grouped = {};
  Object.keys(groups).forEach(function (key) {
    const subset = groups[key];
    const withNumbers = subset.map(function (item, idx) {
      return Object.assign({}, item, { displayNo: subset.length - idx });
    });
    grouped[key] = withNumbers.slice().sort(function (a, b) {
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    });
  });
  return grouped;
}

/**
 * data = { category, title, content, fileBase64 (선택), fileName (선택) }
 */
function addAnnouncement(data) {
  requireStaff_();
  if (!data || !data.title || !data.category) {
    throw new Error('제목과 구분(카테고리)은 필수입니다.');
  }
  if (ANNOUNCEMENT_CATEGORIES.indexOf(data.category) === -1) {
    throw new Error('알 수 없는 카테고리입니다: ' + data.category);
  }

  let fileUrl = '';
  let fileName = '';
  if (data.fileBase64 && data.fileName) {
    const uploaded = uploadFileToFolder_(data.fileBase64, data.fileName, getAttachmentFolder_());
    fileUrl = getDirectDownloadUrl_(uploaded.getId());
    fileName = data.fileName;
  }

  const sheet = getAnnouncementSheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  const date = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');

  const row = buildRowByHeaderNames_(sheet, ANNOUNCEMENT_HEADERS, {
    ID: id,
    Category: data.category,
    Title: data.title,
    Content: data.content || '',
    Date: date,
    FileURL: fileUrl,
    FileName: fileName,
    Pinned: false,
    CreatedAt: now
  });
  sheet.appendRow(row);
  invalidateCache_(CACHE_KEY_ANNOUNCEMENTS);
  return { success: true, id: id };
}

/**
 * 알림마당 글 수정
 * data = { id, category, title, content,
 *          fileBase64 (선택 - 새 첨부파일), fileName (선택),
 *          removeFile (선택 - true 면 기존 첨부파일 삭제) }
 * 게시일, 상단 고정 여부, 등록 시각은 그대로 유지됩니다.
 */
function updateAnnouncement(data) {
  requireStaff_();
  if (!data || !data.id) throw new Error('수정할 글의 id가 없습니다.');
  if (!data.title || !data.category) throw new Error('제목과 구분(카테고리)은 필수입니다.');
  if (ANNOUNCEMENT_CATEGORIES.indexOf(data.category) === -1) {
    throw new Error('알 수 없는 카테고리입니다: ' + data.category);
  }

  const sheet = getAnnouncementSheet_();
  const old = findRowById_(sheet, data.id);
  if (!old) throw new Error('해당 글을 찾을 수 없습니다. (이미 삭제되었을 수 있습니다)');

  const fields = {
    Category: data.category,
    Title: data.title,
    Content: data.content || ''
  };

  if (data.fileBase64 && data.fileName) {
    const uploaded = uploadFileToFolder_(data.fileBase64, data.fileName, getAttachmentFolder_());
    fields.FileURL = getDirectDownloadUrl_(uploaded.getId());
    fields.FileName = data.fileName;
  } else if (data.removeFile) {
    fields.FileURL = '';
    fields.FileName = '';
  }

  updateRowFields_(sheet, old._rowNum, fields);
  invalidateCache_(CACHE_KEY_ANNOUNCEMENTS);
  return { success: true, id: data.id };
}

/**
 * 공지사항/채용공고 등에서 "상단 고정"을 켜거나 끕니다.
 * 시트의 현재 값을 직접 다시 확인해서 반전시킵니다.
 */
function toggleAnnouncementPinned(id) {
  requireStaff_();
  if (!id) throw new Error('대상 글의 id가 없습니다.');
  const sheet = getAnnouncementSheet_();
  const pinnedCol = getHeaderColumnIndex_(sheet, 'Pinned');
  const idCol = getHeaderColumnIndex_(sheet, 'ID');
  if (pinnedCol === -1) {
    throw new Error('시트에서 Pinned 컬럼을 찾을 수 없습니다. 시트 1행(헤더)을 확인해주세요.');
  }
  if (idCol === -1) {
    throw new Error('시트에서 ID 컬럼을 찾을 수 없습니다.');
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('해당 글을 찾을 수 없습니다.');
  const idColumn = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === id) {
      const rowNum = i + 2;
      const currentValue = !!sheet.getRange(rowNum, pinnedCol).getValue();
      const newValue = !currentValue;
      sheet.getRange(rowNum, pinnedCol).setValue(newValue);
      invalidateCache_(CACHE_KEY_ANNOUNCEMENTS);
      return { success: true, pinned: newValue };
    }
  }
  throw new Error('해당 글을 찾을 수 없습니다.');
}

function deleteAnnouncement(id) {
  requireStaff_();
  if (!id) throw new Error('삭제할 항목의 id가 없습니다.');
  const removed = deleteRowById_(getAnnouncementSheet_(), id);
  invalidateCache_(CACHE_KEY_ANNOUNCEMENTS);
  return { success: !!removed };
}

/**
 * 본문에 이미지를 붙여넣으면 호출됩니다. 드라이브에 파일로 저장하고 링크를 돌려줍니다.
 */
function uploadContentImage(base64DataUrl, fileName) {
  requireStaff_();
  if (!base64DataUrl || !fileName) {
    throw new Error('이미지 데이터가 없습니다.');
  }
  const file = uploadFileToFolder_(base64DataUrl, fileName, getAttachmentFolder_());
  return { url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200' };
}

// ---------------------------------------------------------------------------
// 반딧불이야기 (Stories)
// ---------------------------------------------------------------------------
function getStorySheet_() {
  const sheet = getOrCreateSheet_(STORY_SHEET_NAME, STORY_HEADERS);
  ensureSheetHeaderColumns_(sheet, STORY_HEADERS);
  return sheet;
}

/** 기존 시트의 1행(헤더)에 없는 새 컬럼 이름을 뒤에 채워 넣습니다. */
function ensureSheetHeaderColumns_(sheet, headers) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < headers.length) {
    sheet.getRange(1, lastCol + 1, 1, headers.length - lastCol).setValues([headers.slice(lastCol)]);
  }
}

/** 시트 1행(헤더)에서 특정 이름의 컬럼이 몇 번째 칸인지 찾습니다. (1-based, 없으면 -1) */
function getHeaderColumnIndex_(sheet, headerName) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return -1;
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const idx = headerRow.indexOf(headerName);
  return idx === -1 ? -1 : idx + 1;
}

/** 헤더 이름 → 0-based 배열 인덱스 매핑 */
function getHeaderIndexMap_(sheet) {
  const lastCol = sheet.getLastColumn();
  const map = {};
  if (lastCol < 1) return map;
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  headerRow.forEach(function (name, idx) {
    if (name) map[name] = idx;
  });
  return map;
}

/** data 객체의 값들을 시트의 실제 헤더 순서에 맞춰 한 행(배열)으로 만들어줍니다. */
function buildRowByHeaderNames_(sheet, canonicalHeaders, data) {
  const colMap = getHeaderIndexMap_(sheet);
  const rowLength = Math.max(sheet.getLastColumn(), canonicalHeaders.length);
  const row = new Array(rowLength).fill('');
  canonicalHeaders.forEach(function (name) {
    if (!data.hasOwnProperty(name)) return;
    const idx = colMap.hasOwnProperty(name) ? colMap[name] : canonicalHeaders.indexOf(name);
    row[idx] = data[name];
  });
  return row;
}

function getAllStories_() {
  return loadStoriesWithRows_().map(storyPublic_);
}

/**
 * 시트 한 행에서 첨부파일 목록을 만듭니다. AttachmentsJSON(여러 개)이 기본이고,
 * 이 컬럼이 생기기 전의 예전 글은 FileURL/FileName(한 개)을 사용합니다.
 */
function parseStoryAttachments_(attachmentsRaw, legacyFileUrl, legacyFileName) {
  let attachments = [];
  if (attachmentsRaw) {
    try { attachments = JSON.parse(attachmentsRaw) || []; } catch (e) { attachments = []; }
  }
  if (attachments.length === 0 && legacyFileUrl) {
    attachments = [{ url: legacyFileUrl, name: legacyFileName || '첨부파일' }];
  }
  return attachments;
}

/**
 * 반딧불이야기 전체를 한 번의 시트 읽기로 가져옵니다. (캐시 적용)
 * 각 항목에는 시트에서의 실제 행 번호(_rowIndex, 1-based)가 함께 담겨 있습니다.
 */
function loadStoriesWithRows_() {
  let list = getCachedJson_(CACHE_KEY_STORIES);
  if (!list) {
    const sheet = getStorySheet_();
    const colMap = getHeaderIndexMap_(sheet);
    const values = sheet.getDataRange().getValues();
    list = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const idVal = row[colMap['ID']];
      if (!idVal) continue;

      const attachments = parseStoryAttachments_(row[colMap['AttachmentsJSON']], row[colMap['FileURL']], row[colMap['FileName']]);
      const pdfFileId = row[colMap['PdfFileId']] || '';
      const createdAt = row[colMap['CreatedAt']];
      const createdTime = (createdAt instanceof Date) ? createdAt.getTime() : (createdAt ? new Date(createdAt).getTime() : 0);

      list.push({
        id: idVal,
        category: row[colMap['Category']],
        title: row[colMap['Title']],
        content: row[colMap['Content']],
        date: formatDateKST_(row[colMap['Date']]),
        thumbnailUrl: row[colMap['ThumbnailURL']],
        thumbnailFileId: row[colMap['ThumbnailFileId']],
        attachments: attachments,
        views: parseInt(row[colMap['Views']] || 0, 10),
        createdTime: isNaN(createdTime) ? 0 : createdTime,
        pdfFileId: pdfFileId,
        pdfEmbedUrl: pdfFileId ? ('https://drive.google.com/file/d/' + pdfFileId + '/preview') : '',
        pdfViewUrl: pdfFileId ? ('https://drive.google.com/file/d/' + pdfFileId + '/view') : '',
        pdfDownloadUrl: pdfFileId ? getDirectDownloadUrl_(pdfFileId) : '',
        _rowIndex: i + 1,
        _order: i
      });
    }

    list.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b._order - a._order;
    });
    list.forEach(function (item) { delete item._order; });

    setCachedJson_(CACHE_KEY_STORIES, list, CACHE_TTL_SHORT);
  }

  // "새소식" 배지는 매번 지금 시각 기준으로 계산합니다.
  const now = Date.now();
  list.forEach(function (item) {
    item.isNew = !!item.createdTime && (now - item.createdTime) < NEW_BADGE_HOURS * 60 * 60 * 1000;
  });
  return list;
}

/**
 * 조회수를 시트에 반영한 직후, 캐시 전체를 지우는 대신 해당 글의 조회수만
 * 최신값으로 바꿔치기합니다.
 */
function updateCachedStoryViews_(id, views) {
  const cached = getCachedJson_(CACHE_KEY_STORIES);
  if (!cached) return;
  const item = cached.find(function (s) { return s.id === id; });
  if (item) {
    item.views = views;
    setCachedJson_(CACHE_KEY_STORIES, cached, CACHE_TTL_SHORT);
  }
}

/** 카테고리 탭에 뿌릴 데이터를 한 번에 만들어줍니다. */
function getStoriesByCategory() {
  const all = getAllStories_();
  const grouped = { '전체': all };
  STORY_CATEGORIES.forEach(function (cat) {
    grouped[cat] = all.filter(function (s) { return s.category === cat; });
  });
  return grouped;
}

/** 화면에 그릴 탭 목록(전체 + 각 카테고리)을 [{name, tabId}] 형태로 만들어줍니다. */
function getStoryTabList_() {
  const list = [{ name: '전체', tabId: 'story-cat-all' }];
  STORY_CATEGORIES.forEach(function (c, i) {
    list.push({ name: c, tabId: 'story-cat-' + i });
  });
  return list;
}

function uploadStoryAttachments_(list) {
  const result = [];
  (list || []).forEach(function (att) {
    if (!att || !att.base64 || !att.name) return;
    const uploadedFile = uploadFileToFolder_(att.base64, att.name, getAttachmentFolder_());
    result.push({ url: getDirectDownloadUrl_(uploadedFile.getId()), name: att.name });
  });
  return result;
}

/** 소식지 PDF: 직접 업로드 또는 드라이브 링크. 둘 다 없으면 null 을 돌려줍니다. */
function resolveStoryPdf_(data) {
  if (data.pdfBase64 && data.pdfFileName) {
    return uploadFileToFolder_(data.pdfBase64, data.pdfFileName, getStoryPdfFolder_()).getId();
  }
  if (data.pdfDriveUrl) {
    const extractedId = extractDriveFileId_(data.pdfDriveUrl);
    if (!extractedId) {
      throw new Error('구글 드라이브 링크에서 파일 ID를 찾을 수 없습니다. 링크 형식을 확인해주세요.');
    }
    return extractedId;
  }
  return null;
}

/**
 * data = { category, title, content,
 *          attachments (선택, [{base64, name}, ...]),
 *          thumbnailBase64 (선택, 소식지 카드용), thumbnailName (선택),
 *          pdfBase64/pdfFileName 또는 pdfDriveUrl (선택) }
 */
function addStory(data) {
  requireStaff_();
  if (!data || !data.title || !data.category) {
    throw new Error('제목과 카테고리는 필수입니다.');
  }
  if (STORY_CATEGORIES.indexOf(data.category) === -1) {
    throw new Error('알 수 없는 카테고리입니다: ' + data.category);
  }

  const attachmentList = uploadStoryAttachments_(data.attachments);
  const pdfFileId = resolveStoryPdf_(data) || '';

  let thumbnailUrl = '';
  let thumbnailFileId = '';
  if (data.thumbnailBase64 && data.thumbnailName) {
    const uploadedThumb = uploadFileToFolder_(data.thumbnailBase64, data.thumbnailName, getStoryThumbnailFolder_());
    thumbnailFileId = uploadedThumb.getId();
    thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + thumbnailFileId + '&sz=w800';
  } else if (pdfFileId) {
    // 표지 이미지를 따로 안 올렸으면, PDF 첫 페이지를 표지로 자동 사용합니다.
    thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + pdfFileId + '&sz=w800';
  }

  const sheet = getStorySheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  const date = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');

  const row = buildRowByHeaderNames_(sheet, STORY_HEADERS, {
    ID: id,
    Category: data.category,
    Title: data.title,
    Content: data.content || '',
    Date: date,
    ThumbnailURL: thumbnailUrl,
    ThumbnailFileId: thumbnailFileId,
    FileURL: '',
    FileName: '',
    Views: 0,
    AttachmentsJSON: JSON.stringify(attachmentList),
    CreatedAt: now,
    PdfFileId: pdfFileId
  });
  sheet.appendRow(row);
  invalidateCache_(CACHE_KEY_STORIES);
  return { success: true, id: id };
}

/**
 * 수정 화면을 채우기 위해 글 원본을 돌려줍니다. (조회수는 올라가지 않습니다)
 */
function getStoryForEdit(id) {
  requireStaff_();
  if (!id) throw new Error('글 id가 없습니다.');
  const story = loadStoriesWithRows_().find(function (s) { return s.id === id; });
  if (!story) throw new Error('해당 글을 찾을 수 없습니다. (이미 삭제되었을 수 있습니다)');
  return storyPublic_(story);
}

/**
 * 반딧불이야기 글 수정
 * data = { id, category, title, content,
 *          keepAttachments ([{url, name}] - 남겨둘 기존 첨부파일),
 *          attachments (선택, [{base64, name}] - 새로 추가할 첨부파일),
 *          thumbnailBase64/thumbnailName (선택 - 새 표지), removeThumbnail (선택),
 *          pdfBase64/pdfFileName 또는 pdfDriveUrl (선택 - 새 PDF), removePdf (선택) }
 * 게시일, 조회수, 등록 시각은 그대로 유지됩니다.
 */
function updateStory(data) {
  requireStaff_();
  if (!data || !data.id) throw new Error('수정할 글의 id가 없습니다.');
  if (!data.title || !data.category) throw new Error('제목과 카테고리는 필수입니다.');
  if (STORY_CATEGORIES.indexOf(data.category) === -1) {
    throw new Error('알 수 없는 카테고리입니다: ' + data.category);
  }

  const sheet = getStorySheet_();
  const old = findRowById_(sheet, data.id);
  if (!old) throw new Error('해당 글을 찾을 수 없습니다. (이미 삭제되었을 수 있습니다)');

  // ----- 첨부파일: 원래 있던 것 중 남기기로 한 것 + 새로 올린 것 -----
  const oldAttachments = parseStoryAttachments_(old.AttachmentsJSON, old.FileURL, old.FileName);
  const keepUrls = {};
  (data.keepAttachments || []).forEach(function (a) { if (a && a.url) keepUrls[a.url] = true; });
  const attachmentList = oldAttachments
    .filter(function (a) { return keepUrls[a.url]; })
    .concat(uploadStoryAttachments_(data.attachments));

  // ----- PDF -----
  let pdfFileId = old.PdfFileId || '';
  const newPdfId = resolveStoryPdf_(data);
  if (newPdfId) pdfFileId = newPdfId;
  else if (data.removePdf) pdfFileId = '';

  // ----- 표지 이미지 -----
  let thumbnailFileId = old.ThumbnailFileId || '';
  if (data.thumbnailBase64 && data.thumbnailName) {
    const uploadedThumb = uploadFileToFolder_(data.thumbnailBase64, data.thumbnailName, getStoryThumbnailFolder_());
    trashDriveFileQuietly_(thumbnailFileId);
    thumbnailFileId = uploadedThumb.getId();
  } else if (data.removeThumbnail && thumbnailFileId) {
    trashDriveFileQuietly_(thumbnailFileId);
    thumbnailFileId = '';
  }
  let thumbnailUrl = '';
  if (thumbnailFileId) {
    thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + thumbnailFileId + '&sz=w800';
  } else if (pdfFileId) {
    thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + pdfFileId + '&sz=w800';
  }

  updateRowFields_(sheet, old._rowNum, {
    Category: data.category,
    Title: data.title,
    Content: data.content || '',
    ThumbnailURL: thumbnailUrl,
    ThumbnailFileId: thumbnailFileId,
    FileURL: '',   // 예전 방식(한 개짜리) 첨부는 AttachmentsJSON 으로 옮겨 담습니다.
    FileName: '',
    AttachmentsJSON: JSON.stringify(attachmentList),
    PdfFileId: pdfFileId
  });
  invalidateCache_(CACHE_KEY_STORIES);
  return { success: true, id: data.id };
}

function deleteStory(id) {
  requireStaff_();
  if (!id) throw new Error('삭제할 항목의 id가 없습니다.');

  const sheet = getStorySheet_();
  const colMap = getHeaderIndexMap_(sheet);
  const removed = deleteRowById_(sheet, id);
  invalidateCache_(CACHE_KEY_STORIES);
  const thumbnailFileId = (removed && colMap.hasOwnProperty('ThumbnailFileId')) ? removed[colMap['ThumbnailFileId']] : null;
  trashDriveFileQuietly_(thumbnailFileId);
  return { success: !!removed };
}

// ---------------------------------------------------------------------------
// 반딧불일정 (캘린더)
// ---------------------------------------------------------------------------
function getCalendarSheet_() {
  return getOrCreateSheet_(CALENDAR_SHEET_NAME, CALENDAR_HEADERS);
}

function getAllCalendarEvents() {
  const cached = getCachedJson_(CACHE_KEY_CALENDAR);
  if (cached) return cached;

  const sheet = getCalendarSheet_();
  const list = sheetRowsToObjects_(sheet, function (row) {
    const startDate = formatDateKST_(row[1]);
    return {
      id: row[0],
      date: startDate,
      title: row[2],
      memo: row[3] || '',
      endDate: row[4] ? formatDateKST_(row[4]) : startDate
    };
  });
  setCachedJson_(CACHE_KEY_CALENDAR, list, CACHE_TTL_SHORT);
  return list;
}

/** data = { date: 'yyyy-MM-dd', endDate: 'yyyy-MM-dd' (선택), title, memo } */
function addCalendarEvent(data) {
  requireStaff_();
  if (!data || !data.date || !data.title) {
    throw new Error('날짜와 제목은 필수입니다.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('날짜 형식이 올바르지 않습니다.');
  }
  let endDate = data.endDate && data.endDate.trim() ? data.endDate.trim() : data.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error('종료일 형식이 올바르지 않습니다.');
  }
  if (endDate < data.date) {
    throw new Error('종료일은 시작일보다 빠를 수 없습니다.');
  }
  const sheet = getCalendarSheet_();
  const id = Utilities.getUuid();
  sheet.appendRow([id, data.date, data.title, data.memo || '', endDate]);
  invalidateCache_(CACHE_KEY_CALENDAR);
  return { success: true, id: id };
}

function deleteCalendarEvent(id) {
  requireStaff_();
  if (!id) throw new Error('삭제할 항목의 id가 없습니다.');
  const removed = deleteRowById_(getCalendarSheet_(), id);
  invalidateCache_(CACHE_KEY_CALENDAR);
  return { success: !!removed };
}

// ---------------------------------------------------------------------------
// 공휴일 (구글 "대한민국 공휴일" 공개 캘린더에서 미리 가져와 시트에 저장)
// ---------------------------------------------------------------------------
function getHolidaySheet_() {
  return getOrCreateSheet_(HOLIDAY_SHEET_NAME, HOLIDAY_HEADERS);
}

function getHolidays_() {
  const cached = getCachedJson_(CACHE_KEY_HOLIDAYS);
  if (cached) return cached;

  const sheet = getHolidaySheet_();
  const list = sheetRowsToObjects_(sheet, function (row) {
    return {
      date: formatDateKST_(row[0]),
      title: row[1]
    };
  });
  setCachedJson_(CACHE_KEY_HOLIDAYS, list, CACHE_TTL_LONG);
  return list;
}

/**
 * 구글의 "대한민국 공휴일" 공개 캘린더에서 지정한 연도 범위의 공휴일을 가져와
 * Holidays 시트에 저장합니다(이미 저장된 날짜는 건너뜀).
 *
 * ⚠️ Apps Script 편집기에서 직접 실행합니다.
 *    1) 함수 선택 드롭다운에서 "syncKoreanHolidays" 선택
 *    2) ▶ 실행(Run) 클릭
 */
function syncKoreanHolidays(yearFrom, yearTo) {
  yearFrom = yearFrom || new Date().getFullYear();
  yearTo = yearTo || yearFrom + 1;

  const sheet = getHolidaySheet_();
  const existing = {};
  sheet.getDataRange().getValues().slice(1).forEach(function (row) {
    if (row[0]) existing[formatDateKST_(row[0])] = true;
  });

  const holidayCal = CalendarApp.getCalendarById(KOREA_HOLIDAY_CALENDAR_ID);
  if (!holidayCal) {
    throw new Error('공휴일 캘린더를 불러올 수 없습니다.');
  }

  let addedCount = 0;
  for (let y = yearFrom; y <= yearTo; y++) {
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    const events = holidayCal.getEvents(start, end);
    events.forEach(function (ev) {
      const d = ev.getAllDayStartDate();
      const ymd = Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
      if (!existing[ymd]) {
        sheet.appendRow([ymd, ev.getTitle()]);
        existing[ymd] = true;
        addedCount++;
      }
    });
  }

  Logger.log(yearFrom + '~' + yearTo + '년 공휴일 ' + addedCount + '건 추가 완료');
  invalidateCache_(CACHE_KEY_HOLIDAYS);
  return { success: true, added: addedCount };
}

// ==========================================================================
// 공개 사이트용 읽기 API (www.littlelight.or.kr 이 사용)
// ==========================================================================

/** 목록용 가벼운 글 정보 (본문/첨부는 제외해서 전송량을 줄입니다) */
function storyLite_(s) {
  if (!s) return null;
  return {
    id: s.id, category: s.category, title: s.title, date: s.date,
    thumbnailUrl: s.thumbnailUrl, views: s.views, isNew: s.isNew
  };
}

/** 내부 정보(_rowIndex, createdTime)를 뺀 글 정보 */
function storyPublic_(s) {
  const copy = {};
  for (const key in s) {
    if (key !== '_rowIndex' && key !== 'createdTime') copy[key] = s[key];
  }
  return copy;
}

const PUBLIC_ACTIONS_ = {
  // 메인 화면에 필요한 모든 데이터를 한 번에 돌려줍니다.
  home: function (p) {
    if (!p.silent) updateVisitorCounts();
    const byCat = getStoriesByCategory();
    const stories = {};
    Object.keys(byCat).forEach(function (k) {
      stories[k] = byCat[k].map(storyLite_);
    });
    return {
      announcements: getAnnouncementsByCategory(),
      calendar: getAllCalendarEvents(),
      holidays: getHolidays_(),
      stories: stories,
      cardCategory: STORY_CARD_CATEGORY,
      visitors: getVisitorCounts()
    };
  },

  // 글 하나(본문 + 이전글/다음글 + 사이드바). 조회수가 1 올라갑니다.
  story: function (p) {
    const d = prepareStoryDetailData_(p.id);
    if (!d) throw new Error('존재하지 않거나 삭제된 글입니다.');
    return {
      story: storyPublic_(d.story),
      prevStory: storyLite_(d.prevStory),
      nextStory: storyLite_(d.nextStory),
      sidebarStories: d.sidebarStories.map(storyLite_),
      cardCategory: STORY_CARD_CATEGORY
    };
  }
};

function handleApi_(p) {
  let out;
  try {
    const fn = PUBLIC_ACTIONS_[p.action];
    if (!fn) throw new Error('알 수 없는 요청입니다.');
    out = { ok: true, data: fn(p) };
  } catch (err) {
    out = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
}

/** 웹앱 진입점 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  if (params.action) return handleApi_(params);   // 공개 사이트용 JSON

  // ---- 아래는 기존 동작 그대로 (직원용 화면) ----
  updateVisitorCounts();
  if (params.page === 'story' && params.id) {
    return renderStoryDetailPage_(params.id);
  }
  return renderPublicPage_();
}

// 요청 하나를 처리하는 동안만 쓰는 값입니다. (실행할 때마다 비워져서 시작합니다)
let REQUEST_STAFF_EMAIL_ = '';

/** 직원인지 확인: (1) 로그인 토큰을 검증한 요청이거나 (2) 기존 직원용 화면에서 접속한 직원 */
function isStaff() {
  if (REQUEST_STAFF_EMAIL_) return true;
  const email = Session.getActiveUser().getEmail();
  return !!email && email.toLowerCase().endsWith(STAFF_DOMAIN.toLowerCase());
}

function verifyStaffToken_(idToken) {
  if (!idToken) throw new Error('직원 로그인이 필요합니다.');
  const key = PropertiesService.getScriptProperties().getProperty('FIREBASE_WEB_API_KEY');
  if (!key) throw new Error('서버 설정(FIREBASE_WEB_API_KEY)이 없습니다.');

  const res = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true
    }
  );
  if (res.getResponseCode() !== 200) {
    throw new Error('로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.');
  }
  const users = JSON.parse(res.getContentText()).users || [];
  const user = users[0];
  const email = (user && user.email) ? String(user.email).toLowerCase() : '';
  if (!user || !user.emailVerified || !email.endsWith(STAFF_DOMAIN.toLowerCase())) {
    throw new Error('권한이 없습니다. ' + STAFF_DOMAIN + ' 계정으로 로그인해 주세요.');
  }
  return email;
}

function staffActions_() {
  return {
    addAnnouncement: addAnnouncement,
    updateAnnouncement: updateAnnouncement,
    deleteAnnouncement: deleteAnnouncement,
    toggleAnnouncementPinned: toggleAnnouncementPinned,
    addStory: addStory,
    getStoryForEdit: getStoryForEdit,
    updateStory: updateStory,
    deleteStory: deleteStory,
    addCalendarEvent: addCalendarEvent,
    deleteCalendarEvent: deleteCalendarEvent,
    uploadContentImage: uploadContentImage
  };
}

function doPost(e) {
  let out;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    REQUEST_STAFF_EMAIL_ = verifyStaffToken_(req.idToken);
    const fn = staffActions_()[req.action];
    if (!fn) throw new Error('알 수 없는 요청입니다.');
    out = { ok: true, data: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
}

function authorizeOnce() {
  UrlFetchApp.fetch('https://www.google.com');
  Logger.log('권한 승인 완료');
}
