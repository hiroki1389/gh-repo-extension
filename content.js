// GitHubリポジトリページでユーザーのリポジトリ一覧へのリンクを追加
(function() {
  'use strict';

  // 定数
  const SELECTORS = {
    REPO_CONTEXT_ITEM: '.AppHeader-context-item[aria-current="page"]',
    REPO_TITLE_LABEL: '.AppHeader-context-item-label',
    CONTEXT_REGION: 'context-region',
    CONTEXT_CRUMB: 'context-region-crumb',
    APP_HEADER_CONTEXT: '.AppHeader-context',
    BREADCRUMB: 'nav[aria-label="Breadcrumb"]',
    BUTTON: '[data-gh-repo-list-shortcut]'
  };

  const EXCLUDED_PATHS = ['settings', 'orgs', 'new', 'login', 'signup', 'join'];
  const RETRY_DELAY = 1000;
  const DOM_CHECK_DELAY = 500;

  // リポジトリページかどうかを判定（個別ファイルページも含む）
  function isRepositoryPage() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    
    if (pathSegments.length < 2) {
      return false;
    }
    
    const firstSegment = pathSegments[0];
    return !EXCLUDED_PATHS.includes(firstSegment) && !firstSegment.startsWith('_');
  }

  // ユーザー名を取得
  function getUsername() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    return pathSegments[0] || null;
  }

  // リンクボタンを作成
  function createLinkButton(username) {
    const link = document.createElement('a');
    link.href = `https://github.com/${username}?tab=repositories`;
    link.textContent = '📦 リポジトリ一覧';
    link.setAttribute('data-gh-repo-list-shortcut', 'true');
    link.setAttribute('title', `${username}のリポジトリ一覧を見る`);
    
    // スタイル設定
    Object.assign(link.style, {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: '8px',
      padding: '5px 16px',
      backgroundColor: '#0969da',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      verticalAlign: 'middle',
      lineHeight: '20px',
      boxShadow: '0 1px 0 rgba(27, 31, 36, 0.1)'
    });

    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#0860ca';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = '#0969da';
    });
    
    link.addEventListener('click', () => {
      window.location.href = `https://github.com/${username}?tab=repositories`;
    });

    return link;
  }

  // リポジトリ名要素を探す
  function findRepositoryTitle() {
    // 1. aria-current="page"を持つ要素内のリポジトリ名
    const repoContextItem = document.querySelector(SELECTORS.REPO_CONTEXT_ITEM);
    if (repoContextItem) {
      const repoTitle = repoContextItem.querySelector(SELECTORS.REPO_TITLE_LABEL);
      if (repoTitle) {
        // context-region-crumbを探す（<a>タグの親要素）
        const repoCrumb = repoContextItem.closest(SELECTORS.CONTEXT_CRUMB);
        return { 
          element: repoTitle, 
          linkElement: repoContextItem,
          container: repoCrumb || repoContextItem 
        };
      }
    }

    // 2. context-region内のリポジトリ名crumb（個別ファイルページ用）
    const contextRegion = document.querySelector(SELECTORS.CONTEXT_REGION);
    if (contextRegion) {
      const crumbs = contextRegion.querySelectorAll(SELECTORS.CONTEXT_CRUMB);
      if (crumbs.length >= 2) {
        const repoCrumb = crumbs[1];
        const repoLink = repoCrumb.querySelector('.AppHeader-context-item');
        const repoTitle = repoLink?.querySelector(SELECTORS.REPO_TITLE_LABEL);
        if (repoTitle && repoLink) {
          return { 
            element: repoTitle, 
            linkElement: repoLink,
            container: repoCrumb 
          };
        }
      }
    }

    // 3. その他のセレクターで探す
    const fallbackSelectors = [
      'strong[itemprop="name"]',
      'h1 strong',
      'h1[itemprop="name"]'
    ];

    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return { 
          element, 
          linkElement: element.parentElement,
          container: element.parentElement 
        };
      }
    }

    return null;
  }

  // ボタンを挿入（<a>タグの外側、context-region-crumbの子要素として）
  function insertButton(repoTitleInfo, username) {
    if (!repoTitleInfo) {
      return false;
    }

    const { linkElement, container } = repoTitleInfo;
    
    // 既にボタンが存在するかチェック
    if (container.querySelector(SELECTORS.BUTTON)) {
      return false;
    }

    const link = createLinkButton(username);
    // <a>タグの後に挿入（context-region-crumbの子要素として）
    linkElement.insertAdjacentElement('afterend', link);
    return true;
  }

  // リポジトリ一覧へのリンクを追加
  function addRepositoryListLink() {
    if (!isRepositoryPage()) {
      return;
    }

    const username = getUsername();
    if (!username) {
      return;
    }

    // 既に追加済みかチェック
    if (document.querySelector(SELECTORS.BUTTON)) {
      return;
    }

    // リポジトリ名要素を探してボタンを挿入
    const repoTitleInfo = findRepositoryTitle();
    if (repoTitleInfo) {
      if (insertButton(repoTitleInfo, username)) {
        return;
      }
    }

    // フォールバック: AppHeader-contextに追加
    const context = document.querySelector(SELECTORS.APP_HEADER_CONTEXT);
    if (context && !context.querySelector(SELECTORS.BUTTON)) {
      const link = createLinkButton(username);
      context.appendChild(link);
      return;
    }

    // フォールバック: Breadcrumbに追加
    const breadcrumb = document.querySelector(SELECTORS.BREADCRUMB);
    if (breadcrumb && !breadcrumb.querySelector(SELECTORS.BUTTON)) {
      const link = createLinkButton(username);
      breadcrumb.appendChild(link);
      return;
    }

    // 要素が見つからない場合は再試行
    setTimeout(addRepositoryListLink, RETRY_DELAY);
  }

  // 初期化
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addRepositoryListLink);
    } else {
      addRepositoryListLink();
    }
  }

  // URL変更を監視（SPA対応）
  function setupUrlObserver() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        const existingLink = document.querySelector(SELECTORS.BUTTON);
        if (existingLink) {
          existingLink.remove();
        }
        setTimeout(addRepositoryListLink, RETRY_DELAY);
      }
    });
    observer.observe(document, { subtree: true, childList: true });
  }

  // DOM変更を監視（動的コンテンツ読み込み対応）
  function setupDOMObserver() {
    let timeoutId = null;
    const observer = new MutationObserver(() => {
      if (!document.querySelector(SELECTORS.BUTTON) && isRepositoryPage()) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(addRepositoryListLink, DOM_CHECK_DELAY);
      }
    });

    if (document.body) {
      observer.observe(document.body, { subtree: true, childList: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { subtree: true, childList: true });
      });
    }
  }

  // 実行
  init();
  setupUrlObserver();
  setupDOMObserver();

})();
