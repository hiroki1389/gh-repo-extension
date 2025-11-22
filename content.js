// GitHubリポジトリページでユーザーのリポジトリ一覧へのリンクを追加
(function() {
  'use strict';

  // リポジトリページかどうかを判定
  function isRepositoryPage() {
    const path = window.location.pathname;
    // /username/repo の形式かチェック（/で始まり、2つのセグメントがある）
    const pathSegments = path.split('/').filter(segment => segment);
    return pathSegments.length >= 2 && 
           pathSegments[0] !== 'settings' && 
           pathSegments[0] !== 'orgs' &&
           pathSegments[0] !== 'new' &&
           !pathSegments[0].startsWith('_');
  }

  // ユーザー名を取得
  function getUsername() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    return pathSegments[0];
  }

  // リンクボタンを作成する関数
  function createLinkButton(username) {
    const link = document.createElement('a');
    link.href = `https://github.com/${username}?tab=repositories`;
    link.textContent = '📦 リポジトリ一覧';
    link.setAttribute('data-gh-repo-list-shortcut', 'true');
    link.setAttribute('title', `${username}のリポジトリ一覧を見る`);
    link.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 5px 16px;
      background-color: #0969da;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
      white-space: nowrap;
      cursor: pointer;
      vertical-align: middle;
      line-height: 20px;
      box-shadow: 0 1px 0 rgba(27, 31, 36, 0.1);
    `;
    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#0860ca';
      link.style.textDecoration = 'none';
    });
    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = '#0969da';
    });
    link.addEventListener('click', (e) => {
      // 確実に遷移する
      window.location.href = `https://github.com/${username}?tab=repositories`;
    });
    return link;
  }

  // リポジトリ一覧へのリンクを追加
  function addRepositoryListLink() {
    if (!isRepositoryPage()) {
      return;
    }

    const username = getUsername();
    if (!username) {
      console.log('[GH Repo List] Username not found');
      return;
    }

    // 既に追加済みかチェック
    const existingLink = document.querySelector('[data-gh-repo-list-shortcut]');
    if (existingLink) {
      return;
    }

    console.log('[GH Repo List] Attempting to add button for user:', username);

    // 複数の場所を試してリンクを追加（リポジトリ名の右側を優先）
    const insertionPoints = [
      // 1. リポジトリ名の直後（最優先）- aria-current="page"を持つ要素内のリポジトリ名を探す
      () => {
        // リポジトリ名は aria-current="page" を持つ AppHeader-context-item の中にある
        const repoContextItem = document.querySelector('.AppHeader-context-item[aria-current="page"]');
        if (repoContextItem) {
          const repoTitle = repoContextItem.querySelector('.AppHeader-context-item-label');
          if (repoTitle && !repoContextItem.querySelector('[data-gh-repo-list-shortcut]')) {
            const link = createLinkButton(username);
            // リポジトリ名の直後に挿入（インライン要素として）
            repoTitle.insertAdjacentElement('afterend', link);
            console.log('[GH Repo List] Button added right after repo title');
            return true;
          }
        }
        
        // フォールバック: リポジトリ名の要素を探す（複数のパターンを試す）
        const repoTitleSelectors = [
          'strong[itemprop="name"]',
          'h1 strong',
          'h1[itemprop="name"]',
          '.AppHeader-context-item-label strong',
          'h1 .AppHeader-context-item-label'
        ];
        
        for (const selector of repoTitleSelectors) {
          const repoTitle = document.querySelector(selector);
          if (repoTitle) {
            // リポジトリ名の親要素を取得
            const parent = repoTitle.parentElement;
            if (parent && !parent.querySelector('[data-gh-repo-list-shortcut]')) {
              const link = createLinkButton(username);
              // リポジトリ名の直後に挿入（インライン要素として）
              repoTitle.insertAdjacentElement('afterend', link);
              console.log('[GH Repo List] Button added right after repo title (fallback)');
              return true;
            }
          }
        }
        return false;
      },
      // 2. AppHeader-context内でリポジトリ名の後に追加
      () => {
        const context = document.querySelector('.AppHeader-context');
        if (context && !context.querySelector('[data-gh-repo-list-shortcut]')) {
          // リポジトリ名は aria-current="page" を持つ AppHeader-context-item の中にある
          const repoContextItem = context.querySelector('.AppHeader-context-item[aria-current="page"]');
          if (repoContextItem) {
            const repoTitle = repoContextItem.querySelector('.AppHeader-context-item-label');
            if (repoTitle) {
              const link = createLinkButton(username);
              // リポジトリ名の後に挿入
              repoTitle.insertAdjacentElement('afterend', link);
              console.log('[GH Repo List] Button added in AppHeader-context after repo title');
              return true;
            }
          }
          // フォールバック: リポジトリ名の要素を探す
          const repoTitle = context.querySelector('strong[itemprop="name"]') ||
                           context.querySelector('strong');
          if (repoTitle) {
            const link = createLinkButton(username);
            // リポジトリ名の親要素に追加
            const parent = repoTitle.parentElement;
            if (parent) {
              repoTitle.insertAdjacentElement('afterend', link);
            } else {
              context.appendChild(link);
            }
            console.log('[GH Repo List] Button added in AppHeader-context after repo title (fallback)');
            return true;
          }
          // リポジトリ名が見つからない場合は、コンテキストの最後に追加
          const link = createLinkButton(username);
          context.appendChild(link);
          console.log('[GH Repo List] Button added to AppHeader-context');
          return true;
        }
        return false;
      },
      // 3. リポジトリ名の親要素（h1など）の後に追加
      () => {
        const repoTitle = document.querySelector('.AppHeader-context-item-label') ||
                          document.querySelector('strong[itemprop="name"]') ||
                          document.querySelector('h1 strong') ||
                          document.querySelector('h1[itemprop="name"]');
        if (repoTitle) {
          const parent = repoTitle.closest('.AppHeader-context') || 
                         repoTitle.closest('h1')?.parentElement;
          if (parent && !parent.querySelector('[data-gh-repo-list-shortcut]')) {
            const link = createLinkButton(username);
            // リポジトリ名を含む要素の後に挿入
            const repoContainer = repoTitle.closest('h1') || repoTitle.parentElement;
            if (repoContainer && repoContainer.nextSibling) {
              parent.insertBefore(link, repoContainer.nextSibling);
            } else {
              parent.appendChild(link);
            }
            console.log('[GH Repo List] Button added after repo container');
            return true;
          }
        }
        return false;
      },
      // 4. Breadcrumbナビゲーション
      () => {
        const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
        if (breadcrumb && !breadcrumb.querySelector('[data-gh-repo-list-shortcut]')) {
          const link = createLinkButton(username);
          breadcrumb.appendChild(link);
          console.log('[GH Repo List] Button added to breadcrumb');
          return true;
        }
        return false;
      },
      // 5. ページ上部の任意の場所（最後の手段）
      () => {
        const header = document.querySelector('header') || 
                       document.querySelector('.AppHeader') ||
                       document.querySelector('nav[role="navigation"]');
        if (header && !header.querySelector('[data-gh-repo-list-shortcut]')) {
          const link = createLinkButton(username);
          header.appendChild(link);
          console.log('[GH Repo List] Button added to header (fallback)');
          return true;
        }
        return false;
      }
    ];

    // 各挿入ポイントを試す
    for (const tryInsert of insertionPoints) {
      if (tryInsert()) {
        return;
      }
    }

    console.log('[GH Repo List] No insertion point found, retrying...');
    // 要素が見つからない場合は少し待って再試行
    setTimeout(addRepositoryListLink, 1000);
  }

  // ページ読み込み時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addRepositoryListLink);
  } else {
    addRepositoryListLink();
  }

  // SPA（Single Page Application）対応：URL変更を監視
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // 既存のリンクを削除
      const existingLink = document.querySelector('[data-gh-repo-list-shortcut]');
      if (existingLink) {
        existingLink.remove();
      }
      setTimeout(addRepositoryListLink, 1000);
    }
  });
  urlObserver.observe(document, { subtree: true, childList: true });

  // DOM変更も監視（GitHubの動的コンテンツ読み込みに対応）
  let domCheckTimeout = null;
  const domObserver = new MutationObserver(() => {
    if (!document.querySelector('[data-gh-repo-list-shortcut]') && isRepositoryPage()) {
      // 頻繁な実行を防ぐためにthrottle
      if (domCheckTimeout) {
        clearTimeout(domCheckTimeout);
      }
      domCheckTimeout = setTimeout(() => {
        addRepositoryListLink();
      }, 500);
    }
  });
  
  if (document.body) {
    domObserver.observe(document.body, { subtree: true, childList: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      domObserver.observe(document.body, { subtree: true, childList: true });
    });
  }

})();

