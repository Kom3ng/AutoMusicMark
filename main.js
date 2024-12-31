// ==UserScript==
// @name         看过动画自动标记音乐
// @namespace    https://astrack.me/
// @version      0.2.1
// @description  看过动画自动标记音乐
// @author       astrack
// @include      /^http(s)?://(bgm.tv|bangumi.tv|chii.in)/*/
// @grant        none
// @license      MIT
// ==/UserScript==

"use strict";

function isMusic(element) {
  const title = element.querySelector("span").innerText;
  return ["原声集", "片头曲", "片尾曲", "插入歌", "角色歌"].includes(title);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = document.querySelector("#collectBoxForm");
  if (!form) return;

  submitTip();
  if ($("#collect").is(":checked")) {
    let subjectDocument = document;
    const subjectId = window.location.pathname.split("/")[2];

    if (!document.getElementById("bangumiInfo")) {
      2;
      try {
        const response = await fetch(`/subject/${subjectId}`);
        if (!response.ok) throw new Error("Failed to fetch subject document");
        subjectDocument = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
      } catch (error) {
        console.error("Error loading subject document:", error);
        return;
      }
    }
    await collectMusic(subjectDocument);
  }
  const actionUrl = form.getAttribute("action");
  const formData = new URLSearchParams(new FormData(form)).toString();
  await fetch(actionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  }).then(() => location.reload());
}

function setupSyncButton() {
  const typeList = document.querySelector("#browserTools .filters");
  if (!typeList) return;

  const syncButton = document.createElement("a");
  syncButton.innerText = "同步音樂收藏";
  syncButton.className = "collect_btn chiiBtn thickbox";
  typeList.appendChild(syncButton);

  syncButton.addEventListener("click", async () => {
    syncButton.style.pointerEvents = "none";
    syncButton.innerText = "加载收藏数据中...";

    const subjects = await loadCollects(syncButton);

    syncButton.innerText = "收藏音乐中...";
    for (let idx = 0; idx < subjects.length; idx++) {
      try {
        const response = await fetch(`/subject/${subjects[idx]}`);
        if (!response.ok) continue;

        const dom = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        await collectMusic(dom);

        syncButton.innerText = `收藏音乐中... ${idx + 1}/${subjects.length}`;
      } catch (error) {
        console.warn("Error processing subject:", error);
      }
    }
    syncButton.innerText = "收藏完成";
  });
}

async function loadCollects(button) {
  const subjects = [];
  const totalPages = getTotalPages();
  const domParser = new DOMParser();

  for (let page = 1; page <= totalPages; page++) {
    try {
      const response = await fetch(`${window.location.pathname}?page=${page}`);
      if (!response.ok) continue;

      const dom = domParser.parseFromString(await response.text(), "text/html");
      dom.querySelectorAll("#browserItemList li").forEach((el) => {
        const id = Number(el.id.replace("item_", ""));
        if (!isNaN(id)) subjects.push(id);
      });

      button.innerText = `加载收藏数据中... ${page}/${totalPages}`;
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }
  return subjects;
}

function getTotalPages() {
  const pageEl = document.querySelector(".p_edge");
  if (pageEl) {
    const match = pageEl.innerText.match(/\(\s*\d+\s*\/\s*(\d+)\s*\)/);
    return match ? parseInt(match[1], 10) : 1;
  }
  return document.querySelectorAll(".page_inner a").length || 1;
}

async function collectMusic(subjectDocument) {
  const relatedSubjects = subjectDocument.querySelector(
    ".subject_section ul.browserCoverMedium",
  );
  if (!relatedSubjects) return;

  const musicItems = [...relatedSubjects.querySelectorAll("li")].filter(
    isMusic,
  );
  const formAction = subjectDocument
    .querySelector("#collectBoxForm")
    .getAttribute("action")
    .split("?gh=")
    .pop();

  await Promise.all(
    musicItems.map(async (item) => {
      try {
        await fetch(
          `${item.querySelector("a").href}/interest/update?gh=${formAction}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "referer=subject&interest=2&tags=&comment=&update=%E4%BF%9D%E5%AD%98",
          },
        );
      } catch (error) {
        console.error("Error collecting music:", error);
      }
    }),
  );
}

if (window.location.pathname.startsWith("/subject")) {
  document.addEventListener("submit", handleFormSubmit, true);
} else if (
  window.location.pathname.startsWith("/anime/list") &&
  window.location.pathname.endsWith("/collect")
) {
  setupSyncButton();
}
